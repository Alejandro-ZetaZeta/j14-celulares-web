import type { Metadata } from "next";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TicketSearchForm from "./TicketSearchForm";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Consulta tu Servicio Técnico — J14 Celulares",
  description:
    "Ingresa tu número de ticket para conocer el estado actual de tu reparación en tiempo real.",
};

export default async function ServicioTecnicoPage() {
  const { howItWorks } = await getSiteSettings();
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero header */}
      <div className="section-black py-16">
        <div className="container-apple text-center">
          <AnimatedSection>
            <span className="text-5xl mb-6 block" aria-hidden="true">🔧</span>
            <h1 className="text-display text-white mb-4">
              Seguimiento de Reparación
            </h1>
            <p className="text-body-lg text-[#A1A1A6] max-w-[440px] mx-auto">
              Ingresa tu número de ticket para ver el estado actual de tu equipo en tiempo real.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* Search area */}
      <div className="container-apple py-16 flex flex-col items-center gap-0">
        <AnimatedSection className="w-full flex flex-col items-center">
          <TicketSearchForm />
        </AnimatedSection>
      </div>

      {/* How it works */}
      <section className="section-gray section-padding border-t border-[var(--border)]">
        <div className="container-apple">
          <AnimatedSection>
            <h2 className="text-headline text-center mb-12">¿Cómo funciona?</h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.filter((item) => item.visible).map((item, i) => (
              <AnimatedSection key={item.id} delay={i * 0.1}>
                <div className="card-apple p-6 hover:!transform-none">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-[16px] mb-4">
                    {i + 1}
                  </div>
                  <h3 className="text-title mb-2">{item.title}</h3>
                  <p className="text-caption leading-relaxed text-[14px]">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
