import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getPool, invalidateProducts } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

// Menyelesaikan pesanan "stock_issue" (sudah dibayar, stok kurang saat pembayaran masuk):
// - "fulfill": stok dipotong sekarang (setelah admin restok), pesanan menjadi lunas & diproses.
// - "cancel": pesanan dibatalkan; pengembalian dana dilakukan manual oleh toko.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let client: PoolClient | undefined;
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const body = await readJsonObject(request, 2048);
    const action = body.action;
    if (action !== "fulfill" && action !== "cancel") return jsonError("Aksi tidak valid.", 400);
    client = await getPool().connect();
    await client.query("BEGIN");
    const order = (await client.query<{ status: string; admin_note: string | null }>("SELECT status, admin_note FROM orders WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!order) { await client.query("ROLLBACK"); return jsonError("Pesanan tidak ditemukan.", 404); }
    if (order.status !== "stock_issue") { await client.query("ROLLBACK"); return jsonError("Pesanan ini tidak sedang bermasalah stok.", 409); }
    const stamp = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date());
    if (action === "cancel") {
      const note = [order.admin_note, `[${stamp}] Dibatalkan oleh ${admin.name} karena stok tidak tersedia — dana dikembalikan manual.`].filter(Boolean).join("\n");
      await client.query("UPDATE orders SET status = 'cancelled', admin_note = $2 WHERE id = $1", [id, note]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true });
    }
    const items = (await client.query<{ variant_id: string; quantity: number }>(
      "SELECT variant_id, SUM(quantity)::integer AS quantity FROM order_items WHERE order_id = $1 GROUP BY variant_id ORDER BY variant_id", [id],
    )).rows;
    for (const item of items) {
      const variant = (await client.query<{ stock: number; size_eu: string }>("SELECT stock, size_eu FROM product_variants WHERE id = $1 FOR UPDATE", [item.variant_id])).rows[0];
      if (!variant || variant.stock < item.quantity) {
        await client.query("ROLLBACK");
        return jsonError(`Stok ukuran ${variant?.size_eu ?? "?"} masih kurang (tersedia ${variant?.stock ?? 0}, dibutuhkan ${item.quantity}). Tambah stok dulu atau batalkan pesanan.`, 409);
      }
    }
    for (const item of items) {
      const stockAfter = (await client.query<{ stock: number }>("UPDATE product_variants SET stock = stock - $2 WHERE id = $1 RETURNING stock", [item.variant_id, item.quantity])).rows[0].stock;
      await client.query("INSERT INTO stock_movements (id, variant_id, delta, stock_after, reason, admin_id, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [randomUUID(), item.variant_id, -item.quantity, stockAfter, "Pesanan (masalah stok diselesaikan)", admin.id, id]);
    }
    const note = [order.admin_note, `[${stamp}] Masalah stok diselesaikan oleh ${admin.name}.`].filter(Boolean).join("\n");
    await client.query("UPDATE orders SET status = 'paid', fulfillment_status = 'processing', admin_note = $2 WHERE id = $1", [id, note]);
    await client.query("COMMIT");
    invalidateProducts();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    return errorResponse(error, "Pesanan belum dapat diselesaikan.");
  } finally {
    client?.release();
  }
}
