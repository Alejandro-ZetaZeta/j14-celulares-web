import CheckoutClient from "./CheckoutClient";
import { requireCompletedClient } from "@/lib/auth/roles";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { Suspense } from "react";

async function CheckoutContent() {
  const profile = await requireCompletedClient();
  const client = createServerClient({ cookies: await cookies() });
  const { data: authData } = await client.auth.getCurrentUser();
  return <CheckoutClient profile={profile} initialEmail={authData?.user?.email ?? ""} />;
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-[65vh] bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando checkout...</div>}><CheckoutContent /></Suspense>;
}