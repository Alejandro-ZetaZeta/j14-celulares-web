import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { getProductForAdmin } from "@/lib/actions/admin-products";
import { getAllProducts } from "@/lib/actions/admin-products";
import { getProductGifts } from "@/lib/actions/admin-promotions";
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

  const [productOptions, gifts] = await Promise.all([getAllProducts(), getProductGifts(id)]);
  return <EditarProductoClient product={product} productOptions={productOptions as never} initialGiftIds={gifts.map((gift) => gift.gift_product_id)} />;
}

export default function EditarProductoPage({ params }: PageProps) {
  return (
      <Suspense fallback={<AdminPanelSkeleton variant="form" />}>
      <EditarProductoContent params={params} />
    </Suspense>
  );
}
