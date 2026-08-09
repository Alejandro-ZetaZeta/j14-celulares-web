"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { getAdminOrderDetail, updateOrderStatus } from "@/lib/actions/admin-orders";
import type { AdminOrder, AdminOrderDetail } from "@/types/database";
import type { OrderStatus } from "@/types/database";
import { formatCurrency } from "@/lib/cart";

const statuses: Array<{ value: OrderStatus; label: string }> = [
  { value: "APPROVED", label: "Pagado" },
  { value: "DISPATCHED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function OrderDetailDrawer({ order, onClose, onUpdated }: { order: AdminOrder | null; onClose: () => void; onUpdated: (order: AdminOrder) => void }) {
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "PENDING");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!order) return;
    void getAdminOrderDetail(order.id).then((loaded) => {
      if (!loaded) return;
      setDetail(loaded);
      setStatus(loaded.status);
      setTracking(loaded.tracking_number ?? "");
      setNotes(loaded.internal_notes ?? "");
      setObservations(loaded.delivery_observations ?? "");
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "No se pudo cargar detalle."));
  }, [order]);

  if (!order) return null;
  const selectedOrder = order;
  const current = detail?.id === selectedOrder.id ? detail : selectedOrder;
  const whatsapp = current.customer.phone.replace(/\D/g, "");

  function save() {
    setError("");
    startTransition(() => {
      void updateOrderStatus(selectedOrder.id, status, { tracking_number: tracking, internal_notes: notes, delivery_observations: observations })
        .then((updated) => { setDetail(updated); onUpdated(updated); })
        .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "No se pudo guardar."));
    });
  }

  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Detalle del pedido"><button type="button" aria-label="Cerrar detalle" onClick={onClose} className="absolute inset-0 bg-black/30" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col bg-[var(--surface)] shadow-[var(--shadow-xl)]"><header className="flex items-center justify-between border-b border-[var(--border)] p-5"><div><p className="font-mono text-[13px] text-[var(--text-secondary)]">#{selectedOrder.id}</p><h2 className="mt-1 text-[20px] font-bold">Detalle del pedido</h2></div><button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-2xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]" aria-label="Cerrar">×</button></header><div className="flex-1 overflow-y-auto p-5"><section className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{current.customer.full_name}</p><p className="text-[13px] text-[var(--text-secondary)]">{current.customer.identification} · {current.customer.email}</p><p className="mt-1 text-[13px] text-[var(--text-secondary)]">{current.customer.phone}</p></div>{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn-whatsapp !px-3 !py-2 !text-[12px]">WhatsApp</a>}</div><p className="mt-3 text-[13px] text-[var(--text-secondary)]">{current.customer.address}</p></section>{detail?.id === selectedOrder.id ? <><section className="mt-6"><h3 className="text-[15px] font-bold">Productos</h3><div className="mt-3 divide-y divide-[var(--border)]">{detail.items.map((item) => <div key={item.id} className="flex gap-3 py-3"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--bg-secondary)]">{item.product.image_url ? <Image src={item.product.image_url} alt="" fill sizes="56px" className="object-contain" /> : <span className="flex h-full items-center justify-center text-xl">📦</span>}</div><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{item.product.brand} {item.product.model}</p><p className="text-[12px] text-[var(--text-secondary)]">{item.variant.capacity} · {item.variant.color} · x{item.quantity}</p></div><p className="text-[13px] font-semibold">{formatCurrency(item.subtotal)}</p></div>)}</div></section><section className="mt-6 border-t border-[var(--border)] pt-4 text-[13px]"><div className="flex justify-between py-1 text-[var(--text-secondary)]"><span>Subtotal base 0%</span><span>{formatCurrency(detail.subtotal_base_0)}</span></div><div className="flex justify-between py-1 text-[var(--text-secondary)]"><span>Subtotal base IVA 15%</span><span>{formatCurrency(detail.subtotal_base_15)}</span></div><div className="flex justify-between py-1 text-[var(--text-secondary)]"><span>IVA 15%</span><span>{formatCurrency(detail.iva_amount)}</span></div><div className="mt-2 flex justify-between border-t border-[var(--border)] pt-3 text-[18px] font-bold"><span>Total pagado</span><span>{formatCurrency(detail.total_amount)}</span></div><p className="mt-3 text-[12px] text-[var(--text-tertiary)]">{detail.payment_method} · Transacción {detail.pagoplux_transaction_id ?? "No registrada"}</p></section></> : <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Cargando detalle...</div>}<section className="mt-6 border-t border-[var(--border)] pt-5"><h3 className="text-[15px] font-bold">Gestión de entrega</h3><label className="mt-3 block text-[12px] font-semibold text-[var(--text-secondary)]">Estado<select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} disabled={isPending} className="mt-1 h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px]"><option value={current.status}>{current.status}</option>{statuses.filter((item) => item.value !== current.status).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="mt-3 block text-[12px] font-semibold text-[var(--text-secondary)]">Número de guía<input value={tracking} onChange={(event) => setTracking(event.target.value)} disabled={isPending} className="mt-1 h-10 w-full rounded-md border border-[var(--border-strong)] px-3 text-[13px]" /></label><label className="mt-3 block text-[12px] font-semibold text-[var(--text-secondary)]">Observaciones de entrega<textarea value={observations} onChange={(event) => setObservations(event.target.value)} disabled={isPending} rows={2} className="mt-1 w-full resize-none rounded-md border border-[var(--border-strong)] px-3 py-2 text-[13px]" /></label><label className="mt-3 block text-[12px] font-semibold text-[var(--text-secondary)]">Notas internas<textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={isPending} rows={2} className="mt-1 w-full resize-none rounded-md border border-[var(--border-strong)] px-3 py-2 text-[13px]" /></label>{error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-[var(--status-red)]">{error}</p>}</section></div><footer className="flex gap-3 border-t border-[var(--border)] p-5"><button type="button" onClick={() => window.open(`/admin/ventas/comprobante/${selectedOrder.id}`, "_blank", "noopener,noreferrer")} className="btn-secondary flex-1 !px-3 !text-[13px]">Imprimir nota</button><button type="button" onClick={save} disabled={isPending || !detail} className="btn-primary flex-1 !px-3 !text-[13px] disabled:opacity-50">{isPending ? "Guardando..." : "Guardar cambios"}</button></footer></aside></div>;
}
