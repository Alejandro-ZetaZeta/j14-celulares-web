import type { AdminOrderDetail, OrderStatus } from "@/types/database";
import { formatCurrency } from "@/lib/cart";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Pagado",
  DISPATCHED: "Enviado",
  DELIVERED: "Entregado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

export default function NotaDeVenta({ order, className = "" }: { order: AdminOrderDetail; className?: string }) {
  const date = new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at));

  return (
    <div className={`bg-white text-neutral-900 ${className}`}>
      <div className="h-1.5 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-dark)] to-[var(--accent)]" />

      <header className="flex items-start justify-between gap-6 px-8 pt-8">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">Celulares J14</p>
          <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-neutral-500">Nota de venta</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[15px] font-bold">#{order.id}</p>
          <p className="mt-1 text-[12px] text-neutral-500">{date}</p>
        </div>
      </header>

      <section className="mt-7 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Cliente</p>
        <p className="mt-1 text-[15px] font-semibold">{order.customer.full_name}</p>
        <p className="mt-1 text-[13px] text-neutral-600">Cédula · {order.customer.identification || "No registrada"}</p>
        <p className="mt-0.5 text-[13px] text-neutral-600">{order.customer.email} · {order.customer.phone}</p>
        <p className="mt-0.5 text-[13px] text-neutral-600">{order.customer.address}</p>
      </section>

      <table className="mt-7 w-full border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400">
            <th className="border-b border-dashed border-neutral-300 py-2 pr-3">Producto</th>
            <th className="border-b border-dashed border-neutral-300 py-2 pr-3">Variante</th>
            <th className="border-b border-dashed border-neutral-300 py-2 pr-3 text-right">Cant.</th>
            <th className="border-b border-dashed border-neutral-300 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-dashed border-neutral-300">
              <td className="py-3 pr-3">
                <span className="font-semibold">{item.product.brand} {item.product.model}</span>
                {item.is_gift && (
                  <span className="ml-2 inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Regalo</span>
                )}
              </td>
              <td className="py-3 pr-3 text-neutral-600">{item.variant.capacity} · {item.variant.color}</td>
              <td className="py-3 pr-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1.5 text-[13px]">
          <p className="flex justify-between text-neutral-600"><span>Base 0%</span><span>{formatCurrency(order.subtotal_base_0)}</span></p>
          <p className="flex justify-between text-neutral-600"><span>Base IVA 15%</span><span>{formatCurrency(order.subtotal_base_15)}</span></p>
          <p className="flex justify-between text-neutral-600"><span>IVA 15%</span><span>{formatCurrency(order.iva_amount)}</span></p>
          <p className="flex justify-between border-t-2 border-dashed border-neutral-300 pt-2 text-[17px] font-extrabold text-[var(--accent-dark)]"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></p>
        </div>
      </div>

      <footer className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-neutral-200 px-8 pb-10 pt-6">
        <div className="text-[12px] text-neutral-600">
          <p>Estado · <span className="font-semibold">{STATUS_LABEL[order.status]}</span></p>
          <p>Método de pago · {order.payment_method}</p>
          <p>Transacción · {order.payment_transaction_id ?? "No registrada"}</p>
          {order.tracking_number && <p>Guía · {order.tracking_number}</p>}
        </div>
        <div className="w-56 border-t border-dashed border-neutral-300 pt-2 text-center text-[11px] uppercase tracking-wider text-neutral-400">
          Firma del cliente
        </div>
      </footer>

      <div className="print-footer" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> kept for html2canvas/print capture */}
        <img src="/BRAZOS_CRUZADOS.png" alt="" className="brand-left" />
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> kept for html2canvas/print capture */}
        <img src="/J14Premium.png" alt="" className="brand-right" />
      </div>
    </div>
  );
}