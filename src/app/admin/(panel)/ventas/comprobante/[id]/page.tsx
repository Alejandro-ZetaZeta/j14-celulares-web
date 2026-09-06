import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { getAdminOrderDetail } from "@/lib/actions/admin-orders";
import PrintButton from "../PrintButton";
import NotaDeVenta from "../../NotaDeVenta";

type Props = { params: Promise<{ id: string }> };

export default async function OrderReceiptPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div id="print-area" className="overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]">
        <NotaDeVenta order={order} />
      </div>
      <PrintButton />
    </main>
  );
}