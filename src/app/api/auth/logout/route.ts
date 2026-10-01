import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try { await clearCustomerSession(); }
  catch { return NextResponse.json({ error: "Gagal keluar dari akun. Coba lagi." }, { status: 503 }); }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

