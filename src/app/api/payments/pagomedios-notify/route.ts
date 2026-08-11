import { NextResponse } from "next/server";
import { getPagomediosPayment } from "@/lib/pagomedios";
import { insforgeAdmin } from "@/lib/insforge-admin";

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object"; }
function findValue(value: unknown, keys: string[]): unknown {
  if (!isRecord(value)) return undefined;
  for (const key of keys) if (value[key] !== undefined) return value[key];
  for (const child of Object.values(value)) { const found = findValue(child, keys); if (found !== undefined) return found; }
  return undefined;
}
function statusOf(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const item of value) { const status = statusOf(item); if (status !== null) return status; }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const key of ["status", "estado"]) {
    const parsed = typeof value[key] === "number" ? value[key] : Number(value[key]);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 3) return parsed;
  }
  for (const child of Object.values(value)) { const status = statusOf(child); if (status !== null) return status; }
  return null;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.PAGOMEDIOS_NOTIFY_SECRET;
  const suppliedSecret = new URL(request.url).searchParams.get("secret");
  if (!expectedSecret || suppliedSecret !== expectedSecret) return NextResponse.json({ error: "Notificación no autorizada." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const customValue = findValue(body, ["customValue", "custom_value"]);
  if (typeof customValue !== "string") return NextResponse.json({ error: "Orden no identificada." }, { status: 400 });
  const { data: order } = await insforgeAdmin.database.from("orders").select("id, status, pagomedios_payment_token").eq("id", customValue).maybeSingle();
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  if (order.status !== "PENDING") return NextResponse.json({ orderId: order.id, status: order.status });
  if (!order.pagomedios_payment_token) return NextResponse.json({ error: "Pago sin token." }, { status: 409 });

  let verified: unknown;
  try { verified = await getPagomediosPayment(String(order.pagomedios_payment_token)); } catch { return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 502 }); }
  const status = statusOf(verified);
  if (status === 0) return NextResponse.json({ orderId: order.id, status: "PENDING" });
  if (status === 2 || status === 3) {
    await insforgeAdmin.database.from("orders").update({ status: status === 3 ? "CANCELLED" : "REJECTED", pagomedios_response_payload: verified }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, status: status === 3 ? "CANCELLED" : "REJECTED" });
  }
  if (status !== 1) return NextResponse.json({ error: "Estado de pago desconocido." }, { status: 409 });

  const { data: approved, error: stockError } = await insforgeAdmin.database.rpc("approve_order_with_stock", { p_order_id: order.id });
  if (stockError) return NextResponse.json({ error: "No se pudo reservar el stock." }, { status: 500 });
  if (approved !== true) {
    const { data: current } = await insforgeAdmin.database.from("orders").select("status").eq("id", order.id).maybeSingle();
    if (current?.status === "APPROVED") return NextResponse.json({ orderId: order.id, status: "APPROVED" });
    await insforgeAdmin.database.from("orders").update({ status: "REJECTED", pagomedios_response_payload: verified }).eq("id", order.id).eq("status", "PENDING");
    return NextResponse.json({ error: "Stock insuficiente." }, { status: 409 });
  }
  await insforgeAdmin.database.from("orders").update({ pagomedios_response_payload: verified }).eq("id", order.id);
  return NextResponse.json({ orderId: order.id, status: "APPROVED" });
}
