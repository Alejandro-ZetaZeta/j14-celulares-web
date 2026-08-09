import ClientAuthShell from "@/components/client/ClientAuthShell";
import { getCurrentUserProfile, requireClientOrAdmin } from "@/lib/auth/roles";
import CompleteProfileForm from "./CompleteProfileForm";

async function CompleteProfileContent() {
  await requireClientOrAdmin();
  const profile = await getCurrentUserProfile();

  return (
    <ClientAuthShell eyebrow="Un último paso" title="Completa tu perfil">
      <CompleteProfileForm initial={{ cedula: profile?.cedula ?? "", dateOfBirth: profile?.date_of_birth ?? "", address: profile?.address ?? "" }} />
    </ClientAuthShell>
  );
}

export default function CompleteProfilePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando perfil...</div>}><CompleteProfileContent /></Suspense>;
}
import { Suspense } from "react";
