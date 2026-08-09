"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import type { AppRole } from "@/lib/auth/roles";

const allSidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true, roles: ["admin"] as AppRole[] },
  { href: "/admin/productos", label: "Productos", icon: "📦", roles: ["admin"] as AppRole[] },
  { href: "/admin/colecciones", label: "Colecciones", icon: "◌", roles: ["admin"] as AppRole[] },
  { href: "/admin/financiamiento", label: "Financiamiento", icon: "💳", roles: ["admin"] as AppRole[] },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️", roles: ["admin"] as AppRole[] },
  { href: "/admin/ventas", label: "Ventas", icon: "🧾", roles: ["admin"] as AppRole[] },
  { href: "/admin/servicio-tecnico", label: "Servicio Técnico", icon: "🔧", roles: ["admin", "technician"] as AppRole[] },
];

interface AdminPanelClientProps {
  role: AppRole | null;
  children: React.ReactNode;
}

export default function AdminPanelClient({ role, children }: AdminPanelClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const sidebarLinks = allSidebarLinks.filter((link) => role && link.roles.includes(role));

  async function handleLogout() {
    await signOutAction();
    router.replace("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--bg-dark)] flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/J14_Icono_Azul.jpg"
              alt="J14 Celulares"
              width={28}
              height={28}
              className="rounded-full object-cover flex-shrink-0"
            />
            <span className="text-[14px] font-semibold text-white">J14 Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4" aria-label="Navegación del panel">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-2">
            Panel
          </p>
          <ul className="space-y-0.5">
            {sidebarLinks.map(({ href, label, icon, exact }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] font-medium transition-colors duration-150 ${
                    isActive(href, exact)
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  aria-current={isActive(href, exact) ? "page" : undefined}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-white/50 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            <span aria-hidden="true">🌐</span>
            Ver sitio público
          </Link>
          <button
            id="admin-logout"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors duration-150 text-left"
          >
            <span aria-hidden="true">🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
