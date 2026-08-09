import { Suspense } from "react";
import { requireAdminOrTechnician } from "@/lib/auth/roles";
import { getClientProfiles } from "@/lib/actions/admin-service";
import NuevoTicketClient from "./NuevoTicketClient";

async function NuevoTicketContent() {
  await requireAdminOrTechnician();
  const profiles = await getClientProfiles();
  return <NuevoTicketClient profiles={profiles} />;
}

export default function NuevoTicketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Cargando...</div>}>
      <NuevoTicketContent />
    </Suspense>
  );
}
