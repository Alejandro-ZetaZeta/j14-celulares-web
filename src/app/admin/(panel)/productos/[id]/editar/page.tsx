import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { getProductForAdmin } from "@/lib/actions/admin-products";
import EditarProductoClient from "./EditarProductoClient";
import AdminPanelSkeleton from "../../../AdminPanelSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditarProductoContent({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  return <EditarProductoClient product={product} />;
}

export default function EditarProductoPage({ params }: PageProps) {
  return (
      <Suspense fallback={<AdminPanelSkeleton variant="form" />}>
      <EditarProductoContent params={params} />
    </Suspense>
  );
}
