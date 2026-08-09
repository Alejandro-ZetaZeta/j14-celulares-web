import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllProducts } from "@/lib/actions/admin-products";
import { getAllTickets } from "@/lib/actions/admin-service";
import type { ProductWithVariants, TechnicalService } from "@/types/database";
import AdminPanelSkeleton from "./AdminPanelSkeleton";

async function DashboardContent() {
  await requireAdmin();
  const [products, tickets] = await Promise.all([
    getAllProducts(),
    getAllTickets(),
  ]);

  const typedProducts = products as ProductWithVariants[];
  const typedTickets = tickets as TechnicalService[];
  const totalVariants = typedProducts.reduce(
    (acc, product) => acc + (product.product_variants?.length ?? 0),
    0
  );
  const lowStock = typedProducts.filter((product) =>
    product.product_variants?.some((variant) => variant.stock <= 2 && variant.stock > 0)
  ).length;
  const openTickets = typedTickets.filter((ticket) => ticket.status !== "ready_for_delivery").length;
  const readyTickets = typedTickets.filter((ticket) => ticket.status === "ready_for_delivery").length;

  const stats = [
    { label: "Productos", value: typedProducts.length, icon: "📦", href: "/admin/productos", color: "var(--accent)" },
    { label: "Variantes", value: totalVariants, icon: "🗂", href: "/admin/productos", color: "#5E5CE6" },
    { label: "Stock Bajo", value: lowStock, icon: "⚠️", href: "/admin/productos", color: "var(--status-amber)" },
    { label: "Tickets Abiertos", value: openTickets, icon: "🔧", href: "/admin/servicio-tecnico", color: "#FF6B35" },
    { label: "Listos p/ Entrega", value: readyTickets, icon: "✅", href: "/admin/servicio-tecnico", color: "var(--status-green)" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">Resumen general del negocio.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            id={`dashboard-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="card-apple p-5 hover:!transform-none hover:!shadow-[var(--shadow-md)] group"
          >
            <div className="text-2xl mb-3">{stat.icon}</div>
            <p
              className="text-[32px] font-bold leading-none mb-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-[12px] text-[var(--text-tertiary)] font-medium group-hover:text-[var(--text-secondary)] transition-colors">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/productos/nuevo"
          id="dashboard-quick-new-product"
          className="flex items-center gap-4 p-5 card-apple hover:!transform-none hover:border-[var(--accent)] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-[18px]">+</div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Nuevo Producto</p>
            <p className="text-caption">Agregar un celular al catálogo</p>
          </div>
        </Link>

        <Link
          href="/admin/servicio-tecnico/nuevo"
          id="dashboard-quick-new-ticket"
          className="flex items-center gap-4 p-5 card-apple hover:!transform-none hover:border-[var(--accent)] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-[20px]">🎫</div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Nuevo Ticket</p>
            <p className="text-caption">Registrar un equipo para reparación</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="dashboard" />}>
      <DashboardContent />
    </Suspense>
  );
}
