import CheckoutClient from "./CheckoutClient";
import { requireCompletedClient } from "@/lib/auth/roles";
import { Suspense } from "react";

async function CheckoutContent() {
  const profile = await requireCompletedClient();
  return <CheckoutClient profile={profile} />;
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-[65vh] bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando checkout...</div>}><CheckoutContent /></Suspense>;
}