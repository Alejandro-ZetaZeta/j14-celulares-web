"use client";

import { useEffect, useState, useTransition } from "react";
import { getAdminOrders } from "@/lib/actions/admin-orders";
import type { AdminOrderFilters, AdminOrdersResult } from "@/lib/actions/admin-orders";
import type { AdminOrder, OrderStatus } from "@/types/database";
import { formatCurrency } from "@/lib/cart";
import OrderDetailDrawer from "./OrderDetailDrawer";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Pagado",
  DISPATCHED: "Enviado",
  DELIVERED: "Entregado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "bg-[#FFF8EC] text-[var(--status-amber)]",
  APPROVED: "bg-[#F0FBF4] text-[var(--status-green)]",
  DISPATCHED: "bg-[#FFF8EC] text-[var(--status-amber)]",
  DELIVERED: "bg-[#F0FBF4] text-[var(--status-green)]",
  REJECTED: "bg-red-50 text-[var(--status-red)]",
  CANCELLED: "bg-red-50 text-[var(--status-red)]",
};

const filterStatuses: Array<{ value: AdminOrderFilters["status"]; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "APPROVED", label: "Pagados" },
  { value: "PENDING", label: "Pendientes" },
  { value: "DISPATCHED", label: "Enviados" },
  { value: "DELIVERED", label: "Entregados" },
  { value: "CANCELLED", label: "Cancelados" },
];

const datePresets: Array<{ value: NonNullable<AdminOrderFilters["datePreset"]>; label: string }> = [
  { value: "all", label: "Todas las fechas" },
  { value: "today", label: "Hoy" },
  { value: "last7", label: "Últimos 7 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shortId(value: string): string {
  return `#${value.slice(0, 8).toUpperCase()}`;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>;
}

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <div className="card-apple p-5 hover:!transform-none">
      <p className="text-[12px] font-medium text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-3 text-[28px] font-bold leading-none" style={{ color: accent }}>{value}</p>
      <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

export default function VentasTableClient({ initialData }: { initialData: AdminOrdersResult }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminOrderFilters["status"]>("ALL");
  const [datePreset, setDatePreset] = useState<NonNullable<AdminOrderFilters["datePreset"]>>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const filters: AdminOrderFilters = { search, status, datePreset, from, to, page, pageSize: 15 };
      startTransition(() => {
        void getAdminOrders(filters).then(setData).catch(() => undefined);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, status, datePreset, from, to, page]);

  function changeFilter<T>(setter: (value: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  function handleUpdated(updated: AdminOrder) {
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === updated.id ? updated : order),
    }));
    setSelected(updated);
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="catalog-kicker">Operación comercial</p>
          <h1 className="mt-2 text-[28px] font-bold text-[var(--text-primary)]">Ventas y pedidos</h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Control de pagos, despachos y entregas.</p>
        </div>
        <p className="text-[13px] text-[var(--text-tertiary)]">{data.total} pedidos registrados</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Ingresos" value={formatCurrency(data.metrics.revenue)} detail="Pedidos pagados" accent="var(--accent)" />
        <MetricCard label="Total de ventas" value={String(data.metrics.sales)} detail="Todas las órdenes" accent="#5E5CE6" />
        <MetricCard label="Por despachar" value={String(data.metrics.pendingDispatch)} detail="Pagados pendientes" accent="var(--status-amber)" />
        <MetricCard label="Ticket promedio" value={formatCurrency(data.metrics.averageTicket)} detail="Sobre ventas pagadas" accent="var(--status-green)" />
      </div>

      <section className="card-apple overflow-hidden hover:!transform-none">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:p-5 lg:flex-row">
          <label className="flex min-h-11 flex-1 items-center rounded-full border border-[var(--border-strong)] px-4 text-[14px] text-[var(--text-secondary)]">
            <span aria-hidden="true" className="mr-2">⌕</span>
            <span className="sr-only">Buscar pedidos</span>
            <input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Buscar por pedido, cliente, cédula o correo" className="w-full bg-transparent outline-none placeholder:text-[var(--text-tertiary)]" />
          </label>
          <select value={status} onChange={(event) => changeFilter(setStatus, event.target.value as AdminOrderFilters["status"])} className="min-h-11 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] outline-none">
            {filterStatuses.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
          <select value={datePreset} onChange={(event) => changeFilter(setDatePreset, event.target.value as NonNullable<AdminOrderFilters["datePreset"]>)} className="min-h-11 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] outline-none">
            {datePresets.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {datePreset === "custom" && (
          <div className="flex flex-wrap gap-3 border-b border-[var(--border)] px-4 pb-4 sm:px-5">
            <label className="text-[12px] font-medium text-[var(--text-secondary)]">Desde<input type="date" value={from} onChange={(event) => changeFilter(setFrom, event.target.value)} className="ml-2 rounded-md border border-[var(--border-strong)] px-2 py-1 text-[13px]" /></label>
            <label className="text-[12px] font-medium text-[var(--text-secondary)]">Hasta<input type="date" value={to} onChange={(event) => changeFilter(setTo, event.target.value)} className="ml-2 rounded-md border border-[var(--border-strong)] px-2 py-1 text-[13px]" /></label>
          </div>
        )}

        <div className={isPending ? "opacity-60 transition-opacity" : ""}>
          {data.orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl">⌁</p>
              <p className="mt-3 text-[15px] font-semibold">No hay pedidos con estos filtros</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Prueba otra búsqueda o rango de fechas.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]"><th className="px-5 py-3">Pedido</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Pago</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3" /></tr></thead>
                  <tbody>{data.orders.map((order) => <tr key={order.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]"><td className="px-5 py-4 font-mono font-semibold">{shortId(order.id)}</td><td className="whitespace-nowrap px-5 py-4 text-[var(--text-secondary)]">{formatDate(order.created_at)}</td><td className="px-5 py-4"><p className="font-semibold">{order.customer.full_name}</p><p className="text-[12px] text-[var(--text-secondary)]">{order.customer.identification}</p></td><td className="px-5 py-4 text-[var(--text-secondary)]">{order.payment_method}</td><td className="px-5 py-4 text-right font-semibold">{formatCurrency(order.total_amount)}</td><td className="px-5 py-4"><StatusBadge status={order.status} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelected(order)} className="font-semibold text-[var(--accent)] hover:underline">Ver detalle</button></td></tr>)}</tbody>
                </table>
              </div>
              <div className="divide-y divide-[var(--border)] md:hidden">{data.orders.map((order) => <button key={order.id} type="button" onClick={() => setSelected(order)} className="block w-full p-4 text-left"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[13px] font-bold">{shortId(order.id)}</p><p className="mt-1 font-semibold">{order.customer.full_name}</p><p className="text-[12px] text-[var(--text-secondary)]">{formatDate(order.created_at)}</p></div><StatusBadge status={order.status} /></div><div className="mt-3 flex justify-between text-[13px]"><span className="text-[var(--text-secondary)]">{order.payment_method}</span><span className="font-bold">{formatCurrency(order.total_amount)}</span></div></button>)}</div>
            </>
          )}
        </div>

        {data.totalPages > 1 && <div className="flex items-center justify-between border-t border-[var(--border)] p-4 text-[13px]"><button type="button" disabled={page <= 1 || isPending} onClick={() => setPage((current) => current - 1)} className="btn-secondary !px-4 !py-2 disabled:opacity-40">Anterior</button><span className="text-[var(--text-secondary)]">Página {page} de {data.totalPages}</span><button type="button" disabled={page >= data.totalPages || isPending} onClick={() => setPage((current) => current + 1)} className="btn-secondary !px-4 !py-2 disabled:opacity-40">Siguiente</button></div>}
      </section>

      <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
    </div>
  );
}
