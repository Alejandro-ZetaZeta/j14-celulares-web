import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getCreditCardRatesAdmin } from "@/lib/actions/credit-card-rates";
import FinanciamientoClient from "./FinanciamientoClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function FinanciamientoContent() {
  await requireAdmin();
  const rates = await getCreditCardRatesAdmin();
  return <FinanciamientoClient rates={rates} />;
}

export default function FinanciamientoPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="financing" />}>
      <FinanciamientoContent />
    </Suspense>
  );
}
