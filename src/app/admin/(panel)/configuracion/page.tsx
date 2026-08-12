import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getSiteSettingsAdmin } from "@/lib/actions/site-settings";
import ConfiguracionClient from "./ConfiguracionClient";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

async function ConfiguracionContent() {
  await requireAdmin();
  return <ConfiguracionClient settings={await getSiteSettingsAdmin()} />;
}

export default function ConfiguracionPage() {
  return <Suspense fallback={<AdminPanelSkeleton variant="settings" />}><ConfiguracionContent /></Suspense>;
}
