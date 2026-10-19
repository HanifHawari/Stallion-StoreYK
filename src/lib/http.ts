import { NextResponse } from "next/server";
import { record } from "@/lib/commerce";

export class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }

// Membaca body JSON berbentuk objek dengan batas ukuran. Melempar RequestError (400) jika tidak valid.
export async function readJsonObject(request: Request, maxLength: number): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > maxLength) throw new RequestError("Data terlalu besar.");
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new RequestError("Data tidak valid."); }
  if (!record(body)) throw new RequestError("Data tidak valid.");
  return body;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Mengubah error yang dilempar route menjadi respons JSON. Error tak dikenal → 503 dengan pesan cadangan.
export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof RequestError) return jsonError(error.message, error.status);
  console.error(fallback, error instanceof Error ? error.message : error);
  return jsonError(fallback, 503);
}
