import Link from "next/link";
import type { ReactNode } from "react";
import { FULFILLMENT_LABEL, ORDER_STATUS_LABEL } from "@/lib/admin-labels";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return <header className="admin-header">
    <div>
      {back && <Link className="admin-back" href={back.href}><span className="material-symbols-outlined">arrow_back</span>{back.label}</Link>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="admin-header-actions">{actions}</div>}
  </header>;
}

const statusTone: Record<string, string> = { paid: "ok", awaiting_payment: "wait", stock_issue: "warn", payment_setup_failed: "bad", failed: "bad", expired: "muted", cancelled: "muted" };
export function OrderStatusBadge({ status }: { status: string }) {
  return <span className={`admin-badge is-${statusTone[status] ?? "muted"}`}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}
export function FulfillmentBadge({ status, paid }: { status: string | null; paid: boolean }) {
  if (!paid) return <span className="admin-badge is-muted">—</span>;
  const value = status ?? "processing";
  return <span className={`admin-badge ${value === "delivered" ? "is-ok" : value === "shipped" ? "is-info" : "is-wait"}`}>{FULFILLMENT_LABEL[value]}{status === null ? " (baru)" : ""}</span>;
}

export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return <nav className="admin-pagination" aria-label="Halaman">
    {page > 1 ? <Link href={href(page - 1)}>‹ Sebelumnya</Link> : <span />}
    <span>Halaman {page} dari {totalPages}</span>
    {page < totalPages ? <Link href={href(page + 1)}>Berikutnya ›</Link> : <span />}
  </nav>;
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const body = <><small>{label}</small><strong>{value}</strong>{hint && <span>{hint}</span>}</>;
  return href ? <Link className="admin-stat" href={href}>{body}</Link> : <div className="admin-stat">{body}</div>;
}

// Membaca parameter halaman (?page=) dengan aman.
export function pageParam(value: string | undefined): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
