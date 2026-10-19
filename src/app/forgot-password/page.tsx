import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Lupa Kata Sandi", robots: { index: false } };

export default function ForgotPasswordPage() {
  return <AuthShell title="LUPA KATA SANDI" intro="Masukkan email akunmu. Kami akan mengirim tautan untuk mengatur ulang kata sandi.">
    <ForgotPasswordForm />
  </AuthShell>;
}
