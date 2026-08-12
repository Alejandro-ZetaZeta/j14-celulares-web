import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllProducts } from "@/lib/actions/admin-products";
import NuevoProductoClient from "./NuevoProductoClient";
import AdminPanelSkeleton from "../../AdminPanelSkeleton";

async function NuevoProductoContent() {
  await requireAdmin();
  return <NuevoProductoClient productOptions={await getAllProducts() as never} />;
}

export default function NuevoProductoPage() {
  return (
      <Suspense fallback={<AdminPanelSkeleton variant="form" />}>
      <NuevoProductoContent />
    </Suspense>
  );
}
