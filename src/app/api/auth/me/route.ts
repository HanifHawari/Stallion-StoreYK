import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentCustomer() });
  } catch {
    return NextResponse.json({ error: "Status akun belum dapat diperiksa." }, { status: 503 });
  }
}

