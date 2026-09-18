import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllAds } from "@/lib/actions/admin-ads";
import AdsClient from "./AdsClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function AdsContent() {
  await requireAdmin();
  const ads = await getAllAds();
  return <AdsClient initialAds={ads} />;
}

export default function PublicidadPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="collections" />}>
      <AdsContent />
    </Suspense>
  );
}
