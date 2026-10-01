import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/checkout-view";
import { getCurrentCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/checkout");
  return <div className="checkout-page"><CheckoutView /></div>;
}


