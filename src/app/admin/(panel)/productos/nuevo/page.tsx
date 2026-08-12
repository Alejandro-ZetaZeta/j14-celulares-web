import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import NuevoProductoClient from "./NuevoProductoClient";
import AdminPanelSkeleton from "../../AdminPanelSkeleton";

async function NuevoProductoContent() {
  await requireAdmin();
  return <NuevoProductoClient />;
}

export default function NuevoProductoPage() {
  return (
      <Suspense fallback={<AdminPanelSkeleton variant="form" />}>
      <NuevoProductoContent />
    </Suspense>
  );
}
