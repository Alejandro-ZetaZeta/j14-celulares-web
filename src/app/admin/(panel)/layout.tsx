import { Suspense } from "react";
import { getCurrentUserRole } from "@/lib/auth/roles";
import AdminPanelClient from "./AdminPanelClient";
import AdminPanelSkeleton from "./AdminPanelSkeleton";

async function AdminShell({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRole();
  return <AdminPanelClient role={role}>{children}</AdminPanelClient>;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="shell" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
