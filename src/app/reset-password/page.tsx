import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Atur Ulang Kata Sandi", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
  return <AuthShell title="ATUR ULANG KATA SANDI" intro={valid ? "Buat kata sandi baru untuk akun Stallion Store kamu." : "Tautan atur ulang tidak lengkap atau tidak valid."}>
    {valid ? <ResetPasswordForm token={token} /> : <Link className="button button-dark auth-submit" href="/forgot-password">MINTA TAUTAN BARU</Link>}
  </AuthShell>;
}
