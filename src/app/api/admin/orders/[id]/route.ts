import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { FULFILLMENT_STEPS, type FulfillmentStatus } from "@/lib/admin-labels";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

// Ubah proses pesanan lunas: status pemenuhan, nomor resi, catatan admin.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await params;
    const body = await readJsonObject(request, 4096);
    const fulfillment = body.fulfillmentStatus as FulfillmentStatus;
    if (!FULFILLMENT_STEPS.includes(fulfillment)) return jsonError("Status pemrosesan tidak valid.", 400);
    const tracking = typeof body.trackingNumber === "string" ? body.trackingNumber.trim().toUpperCase() : "";
    const note = typeof body.adminNote === "string" ? body.adminNote.trim() : "";
    if (tracking.length > 60 || (tracking && !/^[A-Z0-9-]+$/.test(tracking))) return jsonError("Nomor resi hanya huruf, angka, dan tanda hubung (maks. 60).", 400);
    if ((fulfillment === "shipped" || fulfillment === "delivered") && !tracking) return jsonError("Isi nomor resi sebelum menandai pesanan dikirim.", 400);
    if (note.length > 1000) return jsonError("Catatan maksimal 1.000 karakter.", 400);
    const order = (await getPool().query<{ status: string }>("SELECT status FROM orders WHERE id = $1", [id])).rows[0];
    if (!order) return jsonError("Pesanan tidak ditemukan.", 404);
    if (order.status !== "paid") return jsonError("Hanya pesanan lunas yang bisa diproses.", 409);
    const shipped = fulfillment === "shipped" || fulfillment === "delivered";
    await getPool().query(`
      UPDATE orders SET fulfillment_status = $2, tracking_number = $3, admin_note = $4,
        shipped_at = CASE WHEN $5::boolean THEN COALESCE(shipped_at, now()) ELSE NULL END,
        delivered_at = CASE WHEN $2 = 'delivered' THEN COALESCE(delivered_at, now()) ELSE NULL END
      WHERE id = $1
    `, [id, fulfillment, tracking || null, note || null, shipped]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Pesanan belum dapat diperbarui.");
  }
}
