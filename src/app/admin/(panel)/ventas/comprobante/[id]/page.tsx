import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { getAdminOrderDetail } from "@/lib/actions/admin-orders";
import { formatCurrency } from "@/lib/cart";

type Props = { params: Promise<{ id: string }> };

export default async function OrderReceiptPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  return <main className="mx-auto max-w-3xl p-6 text-[13px] text-black print:max-w-none print:p-0"><div className="mb-6 flex items-start justify-between border-b-2 border-black pb-5"><div><p className="text-xl font-bold">Celulares J14</p><p>Nota de venta</p></div><div className="text-right"><p className="font-mono font-bold">#{order.id}</p><p>{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}</p></div></div><section className="grid gap-1 border-b border-black pb-5"><p className="font-bold">Cliente</p><p>{order.customer.full_name} · {order.customer.identification}</p><p>{order.customer.email} · {order.customer.phone}</p><p>{order.customer.address}</p></section><table className="mt-6 w-full"><thead><tr className="border-b border-black text-left"><th className="py-2">Producto</th><th className="py-2">Variante</th><th className="py-2 text-right">Cant.</th><th className="py-2 text-right">Subtotal</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-gray-300"><td className="py-2">{item.product.brand} {item.product.model}</td><td className="py-2">{item.variant.capacity} · {item.variant.color}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.subtotal)}</td></tr>)}</tbody></table><div className="ml-auto mt-6 w-64 space-y-1"><p className="flex justify-between"><span>Base 0%</span><span>{formatCurrency(order.subtotal_base_0)}</span></p><p className="flex justify-between"><span>Base IVA 15%</span><span>{formatCurrency(order.subtotal_base_15)}</span></p><p className="flex justify-between"><span>IVA 15%</span><span>{formatCurrency(order.iva_amount)}</span></p><p className="flex justify-between border-t border-black pt-2 text-lg font-bold"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></p></div><div className="mt-8 border-t border-black pt-4"><p>Estado: {order.status}</p><p>Método de pago: {order.payment_method}</p><p>Transacción: {order.pagoplux_transaction_id ?? "No registrada"}</p>{order.tracking_number && <p>Guía: {order.tracking_number}</p>}</div><div className="mt-8 print:hidden"><button type="button" onClick={() => window.print()} className="btn-primary">Imprimir</button></div></main>;
}
