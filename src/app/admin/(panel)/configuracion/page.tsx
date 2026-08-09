import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getSiteSettingsAdmin } from "@/lib/actions/site-settings";
import ConfiguracionClient from "./ConfiguracionClient";

async function ConfiguracionContent() {
  await requireAdmin();
  return <ConfiguracionClient settings={await getSiteSettingsAdmin()} />;
}

export default function ConfiguracionPage() {
  return <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Cargando configuración...</div>}><ConfiguracionContent /></Suspense>;
}
