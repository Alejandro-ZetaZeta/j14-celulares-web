import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import AcceptTermsClient from "./AcceptTermsClient";

async function AcceptTermsContent() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/cliente/login");
  if (profile.role !== "client") redirect("/admin/servicio-tecnico");
  if (profile.terms_accepted_at) redirect("/cliente/completar-perfil");

  return <AcceptTermsClient />;
}

export default function AcceptTermsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando términos...</div>}><AcceptTermsContent /></Suspense>;
}
