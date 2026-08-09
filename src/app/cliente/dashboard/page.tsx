import { redirect } from "next/navigation";
import { getCurrentUserProfile, requireCompletedClient } from "@/lib/auth/roles";
import { getClientTickets } from "@/lib/actions/client-service";
import { getUnreadTicketMessageCounts } from "@/lib/actions/ticket-chat";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import ClientDashboard from "./ClientDashboard";
import ClientDashboardSkeleton from "./ClientDashboardSkeleton";

async function ClientDashboardContent() {
  const profile = await requireCompletedClient();
  if (profile.role !== "client") redirect("/admin");
  const client = await createInsforgeServerClient();
  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user) redirect("/cliente/login");
  const [tickets, currentProfile] = await Promise.all([getClientTickets(), getCurrentUserProfile()]);
  const unreadCounts = await getUnreadTicketMessageCounts(tickets.map((ticket) => ticket.id));
  return <ClientDashboard profile={{ full_name: currentProfile?.full_name ?? null, phone: currentProfile?.phone ?? null }} tickets={tickets} userId={userData.user.id} unreadCounts={unreadCounts} />;
}

export default function ClientDashboardPage() {
  return <Suspense fallback={<ClientDashboardSkeleton />}><ClientDashboardContent /></Suspense>;
}
import { Suspense } from "react";
