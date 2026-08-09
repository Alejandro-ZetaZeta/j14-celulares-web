import { Suspense } from "react";
import Link from "next/link";
import { requireAdminOrTechnician } from "@/lib/auth/roles";
import { getAllTickets } from "@/lib/actions/admin-service";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import TicketTableClient from "./TicketTableClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function ServicioContent() {
  await requireAdminOrTechnician();
  const tickets = await getAllTickets();
  const client = await createInsforgeServerClient();
  const { data: userData } = await client.auth.getCurrentUser();
  const profile = await getCurrentUserProfile();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Servicio Técnico</h1>
          <p className="text-[var(--text-secondary)] mt-1">{tickets.length} tickets en total</p>
        </div>
        <Link
          href="/admin/servicio-tecnico/nuevo"
          id="admin-tickets-new"
          className="btn-primary"
        >
          + Nuevo Ticket
        </Link>
      </div>

      <TicketTableClient initialTickets={tickets} currentUserId={userData?.user?.id ?? ""} currentRole={profile?.role ?? "technician"} />
    </div>
  );
}

export default function AdminServicioPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="tickets" />}>
      <ServicioContent />
    </Suspense>
  );
}
