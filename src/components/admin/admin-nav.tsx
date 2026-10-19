"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Produk & Stok", icon: "inventory_2" },
  { href: "/admin/orders", label: "Pesanan", icon: "package_2" },
  { href: "/admin/customers", label: "Pelanggan", icon: "group" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "mail" },
];

export function AdminNav() {
  const pathname = usePathname();
  return <nav className="admin-nav" aria-label="Menu admin">
    {links.map((link) => {
      const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
      return <Link key={link.href} href={link.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}><span className="material-symbols-outlined">{link.icon}</span>{link.label}</Link>;
    })}
  </nav>;
}
