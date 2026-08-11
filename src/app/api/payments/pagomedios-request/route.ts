import { NextResponse } from "next/server";
import { createPagomediosPayment, type PagomediosCustomer } from "@/lib/pagomedios";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import { roundCents, IVA_RATE } from "@/lib/cart";

interface RequestBody {
  customer: PagomediosCustomer;
  items: Array<{ variantId: string; quantity: number }>;
}

function validBody(value: unknown): value is RequestBody {
  if (!value || typeof value !== "object" || !Array.isArray((value as RequestBody).items)) return false;
  const customer = (value as RequestBody).customer;
  return Boolean(customer && ["fullName", "cedula", "email", "phone", "address"].every((key) => typeof customer[key as keyof PagomediosCustomer] === "string" && customer[key as keyof PagomediosCustomer].trim()))
    && (value as RequestBody).items.length > 0
    && (value as RequestBody).items.every((item) => typeof item.variantId === "string" && Number.isInteger(item.quantity) && item.quantity > 0);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!validBody(body)) return NextResponse.json({ error: "Datos de checkout incompletos." }, { status: 400 });

  const quantities = new Map<string, number>();
  for (const item of body.items) quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  const requested = [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
  const { data: variants, error } = await insforgeAdmin.database.from("product_variants").select("id, product_id, price, stock").in("id", requested.map((item) => item.variantId));
  if (error || !variants || variants.length !== requested.length) return NextResponse.json({ error: "Uno o más productos ya no están disponibles." }, { status: 409 });
  const byId = new Map(variants.map((variant) => [String(variant.id), variant as { id: string; product_id: string; price: number; stock: number }]));
  if (requested.some((item) => item.quantity > Number(byId.get(item.variantId)?.stock ?? 0))) return NextResponse.json({ error: "Stock insuficiente para uno o más productos." }, { status: 409 });

  const orderItems = requested.map((item) => {
    const variant = byId.get(item.variantId)!;
    const subtotal = roundCents(Number(variant.price) * item.quantity);
    return { product_id: variant.product_id, variant_id: variant.id, quantity: item.quantity, unit_price: Number(variant.price), subtotal };
  });
  const subtotalBase15 = roundCents(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
  const { data: taxSetting } = await insforgeAdmin.database.from("site_settings").select("value").eq("key", "tax_rate").maybeSingle();
  const configuredTaxRate = Number(taxSetting?.value);
  const ivaRate = Number.isFinite(configuredTaxRate) && configuredTaxRate >= 0 && configuredTaxRate <= 100 ? configuredTaxRate / 100 : IVA_RATE;
  const ivaAmount = roundCents(subtotalBase15 * ivaRate);
  const totals = { subtotalBase0: 0, subtotalBase15, ivaAmount, total: roundCents(subtotalBase15 + ivaAmount) };

  let userId: string | null = null;
  try { userId = (await (await createInsforgeServerClient()).auth.getCurrentUser()).data?.user?.id ?? null; } catch { /* Guest checkout. */ }
  const customerInput = { identification: body.customer.cedula.trim(), full_name: body.customer.fullName.trim(), email: body.customer.email.trim(), phone: body.customer.phone.trim(), address: body.customer.address.trim(), user_id: userId };
  const { data: existingCustomer } = await insforgeAdmin.database.from("customers").select("id").eq("identification", customerInput.identification).maybeSingle();
  let customerId: string;
  if (existingCustomer?.id) {
    const { data, error: updateError } = await insforgeAdmin.database.from("customers").update(customerInput).eq("id", existingCustomer.id).select("id").single();
    if (updateError || !data) return NextResponse.json({ error: "No se pudo actualizar el cliente." }, { status: 500 });
    customerId = String(data.id);
  } else {
    const { data, error: insertError } = await insforgeAdmin.database.from("customers").insert([customerInput]).select("id").single();
    if (insertError || !data) return NextResponse.json({ error: "No se pudo registrar el cliente." }, { status: 500 });
    customerId = String(data.id);
  }

  const { data: order, error: orderError } = await insforgeAdmin.database.from("orders").insert([{ customer_id: customerId, user_id: userId, subtotal_base_0: totals.subtotalBase0, subtotal_base_15: totals.subtotalBase15, iva_amount: totals.ivaAmount, total_amount: totals.total, status: "PENDING", payment_method: "Pagomedios" }]).select("id").single();
  if (orderError || !order) return NextResponse.json({ error: "No se pudo registrar la orden." }, { status: 500 });
  const { error: itemsError } = await insforgeAdmin.database.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) return NextResponse.json({ error: "No se pudieron registrar los productos de la orden." }, { status: 500 });

  try {
    const payment = await createPagomediosPayment(totals, body.customer, String(order.id));
    const { error: paymentError } = await insforgeAdmin.database.from("orders").update({ pagomedios_payment_token: payment.token, pagomedios_response_payload: payment.response }).eq("id", order.id);
    if (paymentError) throw paymentError;
    return NextResponse.json({ orderId: order.id, url: payment.url });
  } catch (caught) {
    await insforgeAdmin.database.from("order_items").delete().eq("order_id", order.id);
    await insforgeAdmin.database.from("orders").update({ status: "REJECTED" }).eq("id", order.id);
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "No se pudo iniciar el pago." }, { status: 502 });
  }
}
