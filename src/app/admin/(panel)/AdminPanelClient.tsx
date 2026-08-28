"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/lib/actions/auth";
import type { AppRole } from "@/lib/auth/roles";

const allSidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true, roles: ["admin"] as AppRole[] },
  { href: "/admin/productos", label: "Productos", icon: "📦", roles: ["admin"] as AppRole[] },
  { href: "/admin/colecciones", label: "Colecciones", icon: "◌", roles: ["admin"] as AppRole[] },
  { href: "/admin/promociones", label: "Promociones", icon: "%", roles: ["admin"] as AppRole[] },
  { href: "/admin/financiamiento", label: "Financiamiento", icon: "💳", roles: ["admin"] as AppRole[] },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️", roles: ["admin"] as AppRole[] },
  { href: "/admin/ventas", label: "Ventas", icon: "🧾", roles: ["admin"] as AppRole[] },
  {
    href: "/admin/servicio-tecnico",
    label: "Servicio Técnico",
    icon: "🔧",
    roles: ["admin", "technician"] as AppRole[],
    children: [{ href: "/admin/servicio-tecnico/configuracion", label: "Personalizar página", icon: "✎" }],
  },
];

interface AdminPanelClientProps {
  role: AppRole | null;
  children: React.ReactNode;
}

export default function AdminPanelClient({ role, children }: AdminPanelClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({});

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

  function toggleSubmenu(href: string) {
    setExpandedSubmenus((current) => ({ ...current, [href]: !current[href] }));
  }

  return (
    <div className="admin-panel-shell flex h-screen max-h-screen h-dvh max-h-dvh overflow-hidden bg-[var(--bg-secondary)]">
      {/* Sidebar */}
      <aside className={`admin-sidebar bg-[var(--bg-dark)] flex flex-col flex-shrink-0 h-full max-h-full overflow-y-auto ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
        {/* Brand */}
        <div className="admin-sidebar__brand px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/J14_Icono_Azul.jpg"
              alt="J14 Celulares"
              width={28}
              height={28}
              className="rounded-full object-cover flex-shrink-0"
            />
            <span className="admin-sidebar__brand-name text-[14px] font-semibold text-white">J14 Admin</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar__toggle"
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={isSidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <span aria-hidden="true">‹</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4" aria-label="Navegación del panel">
          <p className="admin-sidebar__section-label text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-2">
            Panel
          </p>
          <ul className="space-y-0.5">
            {sidebarLinks.map(({ href, label, icon, exact, children }) => (
              <li key={href}>
                <div className={`admin-sidebar__nav-group flex items-center ${children ? "has-submenu" : ""}`}>
                  <Link
                    href={href}
                    className={`admin-sidebar__nav-link flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 pr-10 text-[14px] font-medium transition-colors duration-150 ${
                      isActive(href, exact)
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                    aria-current={isActive(href, exact) ? "page" : undefined}
                  >
                    <span className="admin-sidebar__icon" aria-hidden="true">{icon}</span>
                    <span className="admin-sidebar__label">{label}</span>
                  </Link>
                  {children && <button type="button" onClick={() => toggleSubmenu(href)} aria-expanded={Boolean(expandedSubmenus[href])} aria-label={`${expandedSubmenus[href] ? "Contraer" : "Expandir"} submenú de ${label}`} className={`admin-sidebar__submenu-toggle ${expandedSubmenus[href] ? "is-open" : ""}`}>
                    <span aria-hidden="true" />
                  </button>}
                </div>
                {children && <div className={`admin-sidebar__submenu grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expandedSubmenus[href] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="min-h-0 overflow-hidden"><ul className="admin-sidebar__submenu-list ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-2">{children.map((child) => <li key={child.href}><Link href={child.href} className={`admin-sidebar__submenu-link flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-colors ${isActive(child.href) ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5 hover:text-white"}`} aria-current={isActive(child.href) ? "page" : undefined}><span aria-hidden="true">{child.icon}</span><span className="admin-sidebar__label">{child.label}</span></Link></li>)}</ul></div></div>}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="admin-sidebar__footer-link flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-white/50 hover:text-white hover:bg-white/5 transition-colors duration-150"
            title={isSidebarCollapsed ? "Ver sitio público" : undefined}
          >
            <span aria-hidden="true">🌐</span>
            <span className="admin-sidebar__label">Ver sitio público</span>
          </Link>
          <button
            id="admin-logout"
            onClick={handleLogout}
            className="admin-sidebar__footer-link w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors duration-150 text-left"
            title={isSidebarCollapsed ? "Cerrar sesión" : undefined}
          >
            <span aria-hidden="true">🚪</span>
            <span className="admin-sidebar__label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
