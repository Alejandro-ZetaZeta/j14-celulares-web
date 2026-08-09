import CheckoutClient from "./CheckoutClient";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import { Suspense } from "react";

async function CheckoutContent() {
  const profile = await getCurrentUserProfile();
  return <CheckoutClient initialIsAuthenticated={Boolean(profile)} />;
}

export default function CheckoutPage() {
  return <Suspense fallback={<CheckoutClient initialIsAuthenticated={false} />}><CheckoutContent /></Suspense>;
}
