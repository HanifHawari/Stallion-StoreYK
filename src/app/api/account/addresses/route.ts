import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { fromAddressRow, MAX_ADDRESSES, parseAddressInput, type AddressRow } from "@/lib/address";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) return jsonError("Buku alamat belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const rows = (await getPool().query<AddressRow>(
      "SELECT id, label, recipient_name, phone, address, city, postal_code, is_default FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at",
      [customer.id],
    )).rows;
    return NextResponse.json({ addresses: rows.map(fromAddressRow) });
  } catch (error) {
    return errorResponse(error, "Buku alamat belum dapat dimuat.");
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Buku alamat belum tersedia.", 503);
  let client: PoolClient | undefined;
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const input = parseAddressInput(await readJsonObject(request, 4096));
    client = await getPool().connect();
    await client.query("BEGIN");
    // Kunci baris pelanggan agar batas jumlah & alamat utama konsisten saat ada permintaan bersamaan.
    await client.query("SELECT id FROM customers WHERE id = $1 FOR UPDATE", [customer.id]);
    const count = (await client.query<{ count: number }>("SELECT COUNT(*)::integer AS count FROM customer_addresses WHERE customer_id = $1", [customer.id])).rows[0].count;
    if (count >= MAX_ADDRESSES) {
      await client.query("ROLLBACK");
      return jsonError(`Maksimal ${MAX_ADDRESSES} alamat tersimpan.`, 409);
    }
    const isDefault = input.isDefault || count === 0;
    if (isDefault) await client.query("UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default", [customer.id]);
    const row = (await client.query<AddressRow>(`
      INSERT INTO customer_addresses (id, customer_id, label, recipient_name, phone, address, city, postal_code, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, label, recipient_name, phone, address, city, postal_code, is_default
    `, [randomUUID(), customer.id, input.label, input.recipientName, input.phone, input.address, input.city, input.postalCode, isDefault])).rows[0];
    await client.query("COMMIT");
    return NextResponse.json({ address: fromAddressRow(row) }, { status: 201 });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    return errorResponse(error, "Alamat belum dapat disimpan.");
  } finally {
    client?.release();
  }
}
