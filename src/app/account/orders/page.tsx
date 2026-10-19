import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";
import type { OrderStatus } from "@/lib/commerce";
import { MemberNavigation } from "@/components/member-navigation";
import { OrderCheckDrawer } from "@/components/order-check-drawer";

export const dynamic = "force-dynamic";

type AccountOrder = { id: string; status: OrderStatus; total_idr: number; created_at: Date };
const pageSize = 20;
const statusNames: Record<OrderStatus, string> = {
  awaiting_payment: "Menunggu pembayaran",
  paid: "Pembayaran berhasil",
  failed: "Pembayaran gagal",
  expired: "Pembayaran kedaluwarsa",
  cancelled: "Dibatalkan",
  payment_setup_failed: "Pembayaran belum tersedia",
  stock_issue: "Perlu ditinjau",
};

export default async function AccountOrdersPage({ searchParams }: { searchParams: Promise<{ preview?: string; page?: string }> }) {
  const params = await searchParams;
  const isPreview = process.env.NODE_ENV === "development" && params.preview === "1";
  const signedInCustomer = await getCurrentCustomer();
  if (!signedInCustomer && !isPreview) redirect("/login?next=/account/orders");
  const customer = signedInCustomer ?? { id: "preview", name: "Pengunjung", email: "" };
  let orders: AccountOrder[] = [];
  let totalPages = 1;
  let page = 1;
  if (!isPreview) {
    const total = (await getPool().query<{ count: number }>(
      "SELECT COUNT(*)::integer AS count FROM orders WHERE customer_id = $1", [customer.id],
    )).rows[0]?.count ?? 0;
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    const requestedPage = Number(params.page);
    page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
    orders = (await getPool().query<AccountOrder>(
      "SELECT id, status, total_idr, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [customer.id, pageSize, (page - 1) * pageSize],
    )).rows;
  }
  return <div className="account-page"><div className="site-container member-container">
    <MemberNavigation active="orders" name={customer.name} preview={isPreview} />
    <div className="member-page-heading"><div><span className="eyebrow">STALLION STORE MEMBER</span><h1>PESANAN SAYA</h1><p>Riwayat dan status pesanan dari akunmu.</p></div><OrderCheckDrawer preview={isPreview} /></div>
    <section className="member-panel member-full-panel">
      <div className="member-panel-heading"><h2>RIWAYAT PESANAN</h2><Link href={isPreview ? "/check-order?preview=1" : "/check-order"}>CEK NOMOR PESANAN <span className="material-symbols-outlined">arrow_forward</span></Link></div>
      {orders.length ? <div className="member-orders">{orders.map((order) => <Link href={"/order/" + order.id} className="member-order" key={order.id}><span className="material-symbols-outlined">package_2</span><span><strong>{order.id}</strong><small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(order.created_at)} · {statusNames[order.status]}</small></span><b>{formatRupiah(order.total_idr)}</b><span className="material-symbols-outlined">arrow_forward</span></Link>)}</div> : <div className="member-empty"><span className="material-symbols-outlined">package_2</span><p>Belum ada pesanan.</p><Link className="button button-dark" href="/shoes">MULAI BELANJA</Link></div>}
      {totalPages > 1 && <nav className="member-pagination" aria-label="Halaman pesanan">{page > 1 && <Link href={"/account/orders?page=" + (page - 1)}>SEBELUMNYA</Link>}<span>Halaman {page} dari {totalPages}</span>{page < totalPages && <Link href={"/account/orders?page=" + (page + 1)}>BERIKUTNYA</Link>}</nav>}
    </section>
  </div></div>;
}

