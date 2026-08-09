import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import NuevoProductoClient from "./NuevoProductoClient";

async function NuevoProductoContent() {
  await requireAdmin();
  return <NuevoProductoClient />;
}

export default function NuevoProductoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Cargando...</div>}>
      <NuevoProductoContent />
    </Suspense>
  );
}
