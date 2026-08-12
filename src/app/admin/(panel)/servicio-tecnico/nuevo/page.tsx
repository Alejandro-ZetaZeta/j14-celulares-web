import { Suspense } from "react";
import { requireAdminOrTechnician } from "@/lib/auth/roles";
import { getClientProfiles } from "@/lib/actions/admin-service";
import NuevoTicketClient from "./NuevoTicketClient";
import AdminPanelSkeleton from "../../AdminPanelSkeleton";

async function NuevoTicketContent() {
  await requireAdminOrTechnician();
  const profiles = await getClientProfiles();
  return <NuevoTicketClient profiles={profiles} />;
}

export default function NuevoTicketPage() {
  return (
      <Suspense fallback={<AdminPanelSkeleton variant="form" />}>
      <NuevoTicketContent />
    </Suspense>
  );
}
