// Label & format untuk panel admin. Aman dipakai komponen client (tanpa import server).
export const ORDER_STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Menunggu pembayaran", paid: "Lunas", failed: "Gagal", expired: "Kedaluwarsa",
  cancelled: "Dibatalkan", payment_setup_failed: "Pembayaran gagal dibuat", stock_issue: "Masalah stok",
};
export const FULFILLMENT_LABEL: Record<string, string> = {
  processing: "Diproses", packed: "Dikemas", shipped: "Dikirim", delivered: "Diterima",
};
export const FULFILLMENT_STEPS = ["processing", "packed", "shipped", "delivered"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STEPS)[number];

export const adminDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
