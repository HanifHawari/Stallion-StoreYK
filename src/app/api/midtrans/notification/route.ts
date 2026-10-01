import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getPool } from "@/lib/db";
import { getMidtransStatus, verifyMidtransSignature } from "@/lib/midtrans";

export const runtime = "nodejs";

type Notification = {
  order_id: string;
  transaction_id?: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
};

function parseNotification(value: unknown): Notification | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.order_id !== "string" || typeof body.status_code !== "string" ||
      typeof body.gross_amount !== "string" || typeof body.signature_key !== "string") return null;
  return {
    order_id: body.order_id,
    transaction_id: typeof body.transaction_id === "string" ? body.transaction_id : undefined,
    status_code: body.status_code,
    gross_amount: body.gross_amount,
    signature_key: body.signature_key,
  };
}

function idrAmount(value: string): number | null {
  if (!/^\d+(?:\.00)?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }
  let notification: Notification | null = null;
  try {
    const text = await request.text();
    if (text.length > 16000) return NextResponse.json({ error: "Body too large" }, { status: 413 });
    notification = parseNotification(JSON.parse(text) as unknown);
  } catch { /* Invalid JSON is rejected below. */ }
  if (!notification || !verifyMidtransSignature(notification)) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 401 });
  }

  let verified;
  try {
    verified = await getMidtransStatus(notification.transaction_id ?? notification.order_id);
  } catch (error) {
    console.error("Midtrans status verification failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 503 });
  }
  if (verified.order_id !== notification.order_id || idrAmount(verified.gross_amount) === null) {
    return NextResponse.json({ error: "Payment details mismatch" }, { status: 400 });
  }
  const pool = getPool();
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    await client.query("BEGIN");
    const orderResult = await client.query<{ total_idr: number; status: string }>(
      "SELECT total_idr, status FROM orders WHERE id = $1 FOR UPDATE", [verified.order_id]
    );
    const order = orderResult.rows[0];
    if (!order || order.total_idr !== idrAmount(verified.gross_amount) || order.total_idr !== idrAmount(notification.gross_amount)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Order amount mismatch" }, { status: 400 });
    }
    const success = ["capture", "settlement"].includes(verified.transaction_status) &&
      verified.status_code === "200" &&
      (!verified.fraud_status || verified.fraud_status.toLowerCase() === "accept");
    if (success && order.status !== "paid") {
      const items = await client.query<{ variant_id: string; quantity: number }>(`
        SELECT variant_id, SUM(quantity)::integer AS quantity
        FROM order_items WHERE order_id = $1 GROUP BY variant_id ORDER BY variant_id
      `, [verified.order_id]);
      let stockAvailable = true;
      for (const item of items.rows) {
        const variant = await client.query<{ stock: number }>("SELECT stock FROM product_variants WHERE id = $1 FOR UPDATE", [item.variant_id]);
        if (!variant.rows[0] || variant.rows[0].stock < item.quantity) stockAvailable = false;
      }
      if (stockAvailable) {
        for (const item of items.rows) await client.query("UPDATE product_variants SET stock = stock - $2 WHERE id = $1", [item.variant_id, item.quantity]);
        await client.query("UPDATE orders SET status = 'paid', paid_at = now() WHERE id = $1", [verified.order_id]);
      } else {
        await client.query("UPDATE orders SET status = 'stock_issue' WHERE id = $1", [verified.order_id]);
      }
    } else if (order.status !== "paid" && order.status !== "stock_issue") {
      const nextStatus = verified.transaction_status === "expire" ? "expired" :
        verified.transaction_status === "cancel" ? "cancelled" :
        verified.transaction_status === "deny" ? "failed" : null;
      if (nextStatus) await client.query("UPDATE orders SET status = $2 WHERE id = $1", [verified.order_id, nextStatus]);
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment notification processing failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Unable to process notification" }, { status: 500 });
  } finally {
    client.release();
  }
}
