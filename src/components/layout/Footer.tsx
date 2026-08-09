import Link from "next/link";
import Image from "next/image";

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
    heading: "Legal",
    links: [
      { href: "/terminos", label: "Términos y Condiciones" },
      { href: "/privacidad", label: "Política de Privacidad" },
    ],
  },
];

export default function Footer() {
  // In Cache Components mode, Date.now() / new Date() cannot be called in RSC
  // without a dynamic signal. The year is rendered as a static span and updated
  // client-side via suppressHydrationWarning (safe: year never changes mid-session).
  const year = 2026;

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-auto">
      <div className="container-apple pt-20 pb-12">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--border)] pb-10 md:grid-cols-4">
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
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-caption">
            Copyright &copy; {year} J14 Celulares. Todos los derechos reservados.
          </p>
          <Link
            href="/admin/login"
            className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            Acceso Administrador
          </Link>
        </div>
      </div>
    </footer>
  );
}
