import { Suspense } from "react";
import { requireAdminOrTechnician } from "@/lib/auth/roles";
import { getServiceStepsForEditor } from "@/lib/actions/site-settings";
import ServiceStepsEditor from "./ServiceStepsEditor";
import AdminPanelSkeleton from "../../AdminPanelSkeleton";

async function ServiceContentSettings() {
  await requireAdminOrTechnician();
  return (
    <div className="max-w-5xl p-8">
      <div className="mb-8">
        <p className="catalog-kicker">Configuración del sitio</p>
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Contenido de servicio técnico</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Personaliza las tarjetas informativas que se muestran en la página pública.</p>
      </div>
      <ServiceStepsEditor initialSteps={await getServiceStepsForEditor()} />
    </div>
  );
}

export default function ServiceContentSettingsPage() {
  return <Suspense fallback={<AdminPanelSkeleton variant="settings" />}><ServiceContentSettings /></Suspense>;
}
