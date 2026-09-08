import type { Metadata } from "next";
import Image from "next/image";
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
      <div className="section-black relative overflow-hidden py-16">
        {/* Mobile-only backdrop: protagonista a baja opacidad detrás del texto */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none lg:hidden">
          <img
            src="/ProtasTechService.png"
            alt=""
            className="w-full h-full object-contain object-bottom opacity-15 select-none"
          />
        </div>

        <div className="container-apple relative z-10">
          <div className="grid grid-cols-1 items-center lg:grid-cols-[1fr_auto] lg:gap-10">
            {/* Contenido centrado horizontalmente en su columna */}
            <AnimatedSection className="text-center">
              <h1 className="text-display text-white mb-4">
                Seguimiento de Reparación
              </h1>
              <p className="text-body-lg text-[#A1A1A6] max-w-[440px] mx-auto">
                Ingresa tu número de ticket para ver el estado actual de tu equipo en tiempo real.
              </p>
            </AnimatedSection>

            {/* Desktop: imagen al lado derecho */}
            <AnimatedSection className="hidden lg:block justify-self-end">
              <Image
                src="/ProtasTechService.png"
                alt="Técnico de J14 Celulares"
                width={480}
                height={640}
                priority
                className="h-[24rem] w-auto object-contain drop-shadow-2xl select-none"
              />
            </AnimatedSection>
          </div>
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
