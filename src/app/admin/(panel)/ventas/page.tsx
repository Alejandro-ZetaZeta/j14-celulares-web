import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAdminOrders } from "@/lib/actions/admin-orders";
import VentasTableClient from "./VentasTableClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function VentasContent() {
  await requireAdmin();
  const initialData = await getAdminOrders({ page: 1, pageSize: 15, datePreset: "all", status: "ALL" });
  return <VentasTableClient initialData={initialData} />;
}

export default function AdminVentasPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="sales" />}>
      <VentasContent />
    </Suspense>
  );
}
