import { createHash, timingSafeEqual } from "node:crypto";

type MidtransStatus = {
  order_id: string;
  gross_amount: string;
  status_code: string;
  transaction_status: string;
  fraud_status?: string;
};

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  return key;
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`;
}

function baseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function statusBaseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function jakartaTime(date: Date): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ") + " +0700";
}

export async function createMidtransTransaction(input: {
  orderId: string;
  total: number;
  name: string;
  email: string;
  phone: string;
  finishUrl: string;
  createdAt: Date;
}): Promise<string> {
  const response = await fetch(`${baseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: basicAuth() },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.total },
      customer_details: { first_name: input.name, email: input.email, phone: input.phone },
      callbacks: { finish: input.finishUrl },
      expiry: { start_time: jakartaTime(input.createdAt), unit: "hours", duration: 24 },
      page_expiry: { unit: "hours", duration: 24 },
      credit_card: { secure: true },
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Midtrans menolak transaksi (${response.status}).`);
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("redirect_url" in result) || typeof result.redirect_url !== "string") {
    throw new Error("Midtrans tidak mengembalikan URL pembayaran.");
  }
  const url = new URL(result.redirect_url);
  if (url.protocol !== "https:" || url.hostname !== new URL(baseUrl()).hostname) throw new Error("URL pembayaran Midtrans tidak valid.");
  return url.toString();
}

export function verifyMidtransSignature(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const expected = createHash("sha512").update(notification.order_id + notification.status_code + notification.gross_amount + serverKey()).digest("hex");
  const received = notification.signature_key.toLowerCase();
  if (!/^[a-f0-9]{128}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export async function getMidtransStatus(orderId: string): Promise<MidtransStatus> {
  const response = await fetch(`${statusBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: basicAuth() },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Status Midtrans tidak tersedia (${response.status}).`);
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null ||
    !("order_id" in result) || typeof result.order_id !== "string" ||
    !("gross_amount" in result) || typeof result.gross_amount !== "string" ||
    !("status_code" in result) || typeof result.status_code !== "string" ||
    !("transaction_status" in result) || typeof result.transaction_status !== "string") {
    throw new Error("Format status Midtrans tidak valid.");
  }
  return {
    order_id: result.order_id,
    gross_amount: result.gross_amount,
    status_code: result.status_code,
    transaction_status: result.transaction_status,
    fraud_status: "fraud_status" in result && typeof result.fraud_status === "string" ? result.fraud_status : undefined,
  };
}
