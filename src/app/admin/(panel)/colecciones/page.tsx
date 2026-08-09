import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllCollections } from "@/lib/actions/admin-collections";
import CollectionsClient from "./CollectionsClient";

async function CollectionsContent() {
  await requireAdmin();
  const collections = await getAllCollections();
  return <CollectionsClient initialCollections={collections} />;
}

export default function CollectionsPage() {
  return <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Cargando colecciones...</div>}><CollectionsContent /></Suspense>;
}
