import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Pengaturan akun belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const body = await readJsonObject(request, 1024);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 100) return jsonError("Nama harus 2–100 karakter.", 400);
    await getPool().query("UPDATE customers SET name = $2 WHERE id = $1", [customer.id, name]);
    return NextResponse.json({ user: { ...customer, name }, message: "Nama berhasil disimpan." });
  } catch (error) {
    return errorResponse(error, "Nama belum dapat disimpan. Coba lagi nanti.");
  }
}
