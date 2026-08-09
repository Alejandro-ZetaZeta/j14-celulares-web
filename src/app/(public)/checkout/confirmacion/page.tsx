import { Suspense } from "react";
import ConfirmationClient from "./ConfirmationClient";

export default function ConfirmationPage() {
  return <Suspense fallback={<main className="container-wide flex min-h-[70vh] items-center justify-center px-5 py-28"><p className="text-[var(--text-secondary)]">Cargando confirmación...</p></main>}><ConfirmationClient /></Suspense>;
}
