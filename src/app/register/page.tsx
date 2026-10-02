import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = typeof next === "string" && /^\/(?!\/|\\)[^\u0000-\u0020\\]*$/.test(next) ? next : "/";
  return <AuthForm mode="register" next={destination} />;
}


