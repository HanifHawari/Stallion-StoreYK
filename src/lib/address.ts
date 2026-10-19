import { RequestError } from "@/lib/http";

export const MAX_ADDRESSES = 10;

export type SavedAddress = {
  id: string; label: string; recipientName: string; phone: string;
  address: string; city: string; postalCode: string; isDefault: boolean;
};
export type AddressInput = Omit<SavedAddress, "id">;

export type AddressRow = {
  id: string; label: string; recipient_name: string; phone: string;
  address: string; city: string; postal_code: string; is_default: boolean;
};

export function fromAddressRow(row: AddressRow): SavedAddress {
  return { id: row.id, label: row.label, recipientName: row.recipient_name, phone: row.phone, address: row.address, city: row.city, postalCode: row.postal_code, isDefault: row.is_default };
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

// Aturan sama dengan validasi alamat di /api/checkout.
export function parseAddressInput(body: Record<string, unknown>): AddressInput {
  const input: AddressInput = {
    label: text(body.label) || "Alamat",
    recipientName: text(body.recipientName),
    phone: text(body.phone),
    address: text(body.address),
    city: text(body.city),
    postalCode: text(body.postalCode),
    isDefault: body.isDefault === true,
  };
  if (input.label.length > 40) throw new RequestError("Label alamat maksimal 40 karakter.");
  if (input.recipientName.length < 2 || input.recipientName.length > 100) throw new RequestError("Nama penerima harus 2–100 karakter.");
  if (!/^[+0-9 ()-]{8,25}$/.test(input.phone)) throw new RequestError("Nomor telepon tidak valid.");
  if (input.address.length < 10 || input.address.length > 300) throw new RequestError("Alamat lengkap harus 10–300 karakter.");
  if (input.city.length < 2 || input.city.length > 100) throw new RequestError("Kota / kabupaten harus 2–100 karakter.");
  if (!/^[0-9]{5}$/.test(input.postalCode)) throw new RequestError("Kode pos harus 5 angka.");
  return input;
}
