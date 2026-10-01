export const SHIPPING_FEE_IDR = 25000;
export const RESERVATION_HOURS = 24;

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "payment_setup_failed"
  | "stock_issue";
