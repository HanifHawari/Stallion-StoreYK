import { formatRupiah } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/commerce";

export type OrderDetailItem = { product_name: string; size_eu: string; image_url: string; unit_price_idr: number; quantity: number };
export type OrderDetail = {
  status: OrderStatus; created_at: Date; paid_at: Date | null; expires_at: Date;
  subtotal_idr: number; shipping_idr: number; total_idr: number;
  customer_name: string; customer_phone: string; shipping_address: string; shipping_city: string; shipping_postal_code: string;
  shipping_courier_code: string | null; shipping_service_code: string | null;
  fulfillment_status: string | null; tracking_number: string | null; shipped_at: Date | null; delivered_at: Date | null;
};

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const paymentStep: Record<OrderStatus, { label: string; state: "done" | "current" | "failed" }> = {
  awaiting_payment: { label: "Menunggu pembayaran", state: "current" },
  paid: { label: "Pembayaran diterima", state: "done" },
  stock_issue: { label: "Pembayaran diterima, stok sedang ditinjau", state: "current" },
  failed: { label: "Pembayaran gagal", state: "failed" },
  expired: { label: "Pembayaran kedaluwarsa", state: "failed" },
  cancelled: { label: "Pesanan dibatalkan", state: "failed" },
  payment_setup_failed: { label: "Halaman pembayaran gagal dibuat", state: "failed" },
};

export function OrderDetails({ order, items }: { order: OrderDetail; items: OrderDetailItem[] }) {
  const payment = paymentStep[order.status];
  const paid = order.status === "paid" || order.status === "stock_issue";
  const steps: { label: string; detail?: string; state: "done" | "current" | "failed" | "upcoming" }[] = [
    { label: "Pesanan dibuat", detail: dateTime.format(order.created_at), state: "done" },
    { label: payment.label, detail: order.paid_at ? dateTime.format(order.paid_at) : order.status === "awaiting_payment" ? `Bayar sebelum ${dateTime.format(order.expires_at)} WIB` : undefined, state: payment.state },
  ];
  if (order.status === "paid") {
    // Tahap proses dari admin. NULL = baru lunas, dianggap sedang diproses.
    // Peringkat: diproses 0, dikemas 1, dikirim 2, diterima 3. Langkah ≤ peringkat selesai; langkah berikutnya sedang berjalan.
    const rank = Math.max(0, ["processing", "packed", "shipped", "delivered"].indexOf(order.fulfillment_status ?? "processing"));
    const state = (index: number) => index <= rank ? "done" as const : index === rank + 1 ? "current" as const : "upcoming" as const;
    steps.push(
      { label: "Pesanan dikemas", state: state(1) },
      { label: "Pesanan dikirim", detail: order.shipped_at ? `${dateTime.format(order.shipped_at)}${order.tracking_number ? ` · Resi ${order.tracking_number}` : ""}` : undefined, state: state(2) },
      { label: "Pesanan diterima", detail: order.delivered_at ? dateTime.format(order.delivered_at) : undefined, state: state(3) },
    );
  } else if (paid) {
    steps.push({ label: "Pesanan dikemas", state: "upcoming" }, { label: "Pesanan dikirim", state: "upcoming" });
  }
  const courier = [order.shipping_courier_code, order.shipping_service_code].filter(Boolean).join(" · ").toUpperCase();
  return <div className="order-details">
    <section>
      <h2>ITEM PESANAN</h2>
      <ul className="order-detail-items">{items.map((item, index) => <li key={index}>
        <img src={item.image_url} alt="" />
        <span><strong>{item.product_name}</strong><small>EU {item.size_eu} · Qty {item.quantity} · {formatRupiah(item.unit_price_idr)}</small></span>
        <b>{formatRupiah(item.unit_price_idr * item.quantity)}</b>
      </li>)}</ul>
      <dl className="order-detail-totals">
        <div><dt>Subtotal</dt><dd>{formatRupiah(order.subtotal_idr)}</dd></div>
        <div><dt>Ongkir</dt><dd>{formatRupiah(order.shipping_idr)}</dd></div>
        <div className="order-detail-grand"><dt>Total</dt><dd>{formatRupiah(order.total_idr)}</dd></div>
      </dl>
    </section>
    <section>
      <h2>PENGIRIMAN</h2>
      <p className="order-detail-address"><strong>{order.customer_name}</strong> · {order.customer_phone}<br />{order.shipping_address}<br />{order.shipping_city} {order.shipping_postal_code}</p>
      {courier && <p className="order-detail-address">Kurir: <strong>{courier}</strong></p>}
      {order.tracking_number && <p className="order-detail-address">Nomor resi: <strong>{order.tracking_number}</strong></p>}
    </section>
    <section>
      <h2>STATUS PESANAN</h2>
      <ol className="order-timeline">{steps.map((step) => <li key={step.label} className={"is-" + step.state}><span>{step.label}</span>{step.detail && <small>{step.detail}</small>}</li>)}</ol>
    </section>
  </div>;
}
