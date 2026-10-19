import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { fromAddressRow, parseAddressInput, type AddressRow } from "@/lib/address";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[a-f0-9-]{36}$/.test(id);

export async function PATCH(request: Request, { params }: Context) {
  if (!process.env.DATABASE_URL) return jsonError("Buku alamat belum tersedia.", 503);
  let client: PoolClient | undefined;
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const { id } = await params;
    if (!validId(id)) return jsonError("Alamat tidak ditemukan.", 404);
    const input = parseAddressInput(await readJsonObject(request, 4096));
    client = await getPool().connect();
    await client.query("BEGIN");
    await client.query("SELECT id FROM customers WHERE id = $1 FOR UPDATE", [customer.id]);
    const current = (await client.query<{ is_default: boolean }>("SELECT is_default FROM customer_addresses WHERE id = $1 AND customer_id = $2", [id, customer.id])).rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return jsonError("Alamat tidak ditemukan.", 404);
    }
    // Alamat utama tidak bisa "dilepas" langsung; pilih alamat lain sebagai utama.
    const isDefault = input.isDefault || current.is_default;
    if (isDefault && !current.is_default) await client.query("UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default", [customer.id]);
    const row = (await client.query<AddressRow>(`
      UPDATE customer_addresses SET label = $3, recipient_name = $4, phone = $5, address = $6, city = $7, postal_code = $8, is_default = $9
      WHERE id = $1 AND customer_id = $2
      RETURNING id, label, recipient_name, phone, address, city, postal_code, is_default
    `, [id, customer.id, input.label, input.recipientName, input.phone, input.address, input.city, input.postalCode, isDefault])).rows[0];
    await client.query("COMMIT");
    return NextResponse.json({ address: fromAddressRow(row) });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    return errorResponse(error, "Alamat belum dapat diperbarui.");
  } finally {
    client?.release();
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!process.env.DATABASE_URL) return jsonError("Buku alamat belum tersedia.", 503);
  let client: PoolClient | undefined;
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const { id } = await params;
    if (!validId(id)) return jsonError("Alamat tidak ditemukan.", 404);
    client = await getPool().connect();
    await client.query("BEGIN");
    await client.query("SELECT id FROM customers WHERE id = $1 FOR UPDATE", [customer.id]);
    const deleted = (await client.query<{ is_default: boolean }>("DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING is_default", [id, customer.id])).rows[0];
    if (!deleted) {
      await client.query("ROLLBACK");
      return jsonError("Alamat tidak ditemukan.", 404);
    }
    // Jika alamat utama dihapus, alamat tertua yang tersisa menjadi utama.
    if (deleted.is_default) {
      await client.query(`
        UPDATE customer_addresses SET is_default = true
        WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at LIMIT 1)
      `, [customer.id]);
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    return errorResponse(error, "Alamat belum dapat dihapus.");
  } finally {
    client?.release();
  }
}
