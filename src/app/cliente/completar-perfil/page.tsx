import ClientAuthShell from "@/components/client/ClientAuthShell";
import { getCurrentUserProfile, requireClientOrAdmin } from "@/lib/auth/roles";
import { getMissingProfileFields, PROFILE_FIELD_LABELS } from "@/lib/auth/profile-completeness";
import CompleteProfileForm from "./CompleteProfileForm";

async function CompleteProfileContent() {
  await requireClientOrAdmin();
  const profile = await getCurrentUserProfile();
  const missingLabels = getMissingProfileFields(profile).map((key) => PROFILE_FIELD_LABELS[key]);

  return (
    <ClientAuthShell eyebrow="Un último paso" title="Completa tu perfil">
      <CompleteProfileForm missingLabels={missingLabels} initial={{ fullName: profile?.full_name ?? "", phone: profile?.phone ?? "", cedula: profile?.cedula ?? "", dateOfBirth: profile?.date_of_birth ?? "", address: profile?.address ?? "", province: profile?.province ?? "", city: profile?.city ?? "", postcode: profile?.postcode ?? "" }} />
    </ClientAuthShell>
  );
}

export default function CompleteProfilePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)] p-8 text-[var(--text-tertiary)]">Cargando perfil...</div>}><CompleteProfileContent /></Suspense>;
}
import { Suspense } from "react";
