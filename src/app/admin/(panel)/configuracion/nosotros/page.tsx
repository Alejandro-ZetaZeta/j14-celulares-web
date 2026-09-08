import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAboutContentAdmin } from "@/lib/actions/site-settings";
import NosotrosEditor from "./NosotrosEditor";
import AdminPanelSkeleton from "../../AdminPanelSkeleton";

async function NosotrosContent() {
  await requireAdmin();
  return (
    <div className="max-w-5xl p-8">
      <div className="mb-8">
        <p className="catalog-kicker">Contenido del sitio</p>
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Página Nosotros</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Edita toda la historia de J14: titular, manifiesto, relato, hitos, valores, cifras y llamado final. Todo se publica al guardar.
        </p>
      </div>
      <NosotrosEditor initialContent={await getAboutContentAdmin()} />
    </div>
  );
}

export default function NosotrosPage() {
  return <Suspense fallback={<AdminPanelSkeleton variant="settings" />}><NosotrosContent /></Suspense>;
}
