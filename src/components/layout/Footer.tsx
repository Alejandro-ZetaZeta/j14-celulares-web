import Link from "next/link";
import Image from "next/image";

const CONTACT = {
  email: "celularesj14593@gmail.com",
  instagram: "https://www.instagram.com/celularesj14?stkn=ZDNlZDc0MzIxNw==",
  facebook: "https://www.facebook.com/celularesj14/",
};

const footerLinks = [
  {
    heading: "Catálogo",
    links: [
      { href: "/catalogo?coleccion=android", label: "Android" },
      { href: "/catalogo?coleccion=sellados", label: "iPhone Sellados" },
      { href: "/catalogo?coleccion=open-box", label: "iPhone Open Box" },
    ],
  },
  {
    heading: "Servicios",
    links: [
      { href: "/servicio-tecnico", label: "Consultar Ticket" },
      { href: "/servicio-tecnico", label: "Seguimiento de Reparación" },
    ],
  },
  {
    heading: "Nosotros",
    links: [
      { href: "/nosotros", label: "Nuestra historia" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terminos", label: "Términos y Condiciones" },
      { href: "/privacidad", label: "Política de Privacidad" },
    ],
  },
];

export default function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  // In Cache Components mode, Date.now() / new Date() cannot be called in RSC
  // without a dynamic signal. The year is rendered as a static span and updated
  // client-side via suppressHydrationWarning (safe: year never changes mid-session).
  const year = 2026;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola Celulares J14, quiero más información.")}`;

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-auto">
      <div className="container-apple pt-20 pb-12">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--border)] pb-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/J14_Icono_Azul.jpg"
                alt="J14 Celulares"
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
              <span className="font-semibold text-[var(--text-primary)]">J14 Celulares</span>
            </div>
            <p className="text-caption leading-relaxed max-w-[220px]">
              Tu tienda de confianza para smartphones y reparaciones de calidad.
            </p>
          </div>

          {/* Nav Columns */}
          {footerLinks.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div id="contactanos" className="scroll-mt-24">
            <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
              Contáctanos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="whitespace-nowrap text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-150"
                >
                  {CONTACT.email}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="Escríbenos por WhatsApp"
                title="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.83 14.12c-.25.7-1.45 1.33-2.02 1.38-.51.05-1.16.24-3.9-.81-3.3-1.28-5.4-4.57-5.56-4.78-.16-.21-1.33-1.77-1.33-3.38 0-1.61.84-2.4 1.14-2.73.3-.33.65-.41.87-.41s.43.01.62.01c.2 0 .47-.07.73.56.27.65.92 2.24 1 2.4.08.16.13.35.03.57-.11.22-.16.35-.32.54-.16.19-.34.43-.49.57-.16.16-.33.34-.14.67.19.32.84 1.39 1.81 2.25 1.24 1.11 2.29 1.45 2.61 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.03-1.27.21-.32.43-.27.72-.16.3.11 1.89.89 2.21 1.05.32.16.54.24.62.38.08.13.08.78-.17 1.47Z" /></svg>
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="Síguenos en Instagram"
                title="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <a
                href={CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="Síguenos en Facebook"
                title="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" /></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-caption">
            Copyright &copy; {year} J14 Celulares. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
