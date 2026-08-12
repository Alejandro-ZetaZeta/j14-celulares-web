import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllPromotions } from "@/lib/actions/admin-promotions";
import { getAllProducts } from "@/lib/actions/admin-products";
import PromotionsClient from "./PromotionsClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function PromotionsContent() {
  await requireAdmin();
  const [promotions, products] = await Promise.all([getAllPromotions(), getAllProducts()]);
  return <PromotionsClient initialPromotions={promotions} products={products as never} />;
}

export default function PromotionsPage() {
  return <Suspense fallback={<AdminPanelSkeleton variant="collections" />}><PromotionsContent /></Suspense>;
}
