import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import { roundCents, IVA_RATE } from "@/lib/cart";

interface CallbackItem { variantId: string; quantity: number }
interface CallbackBody {
  pagopluxResponse: unknown;
  customer: { fullName: string; cedula: string; email: string; phone: string; address: string };
  items: CallbackItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function findValue(value: unknown, keys: string[]): unknown {
  if (!isRecord(value)) return undefined;
  for (const key of keys) if (value[key] !== undefined) return value[key];
  for (const child of Object.values(value)) {
    const found = findValue(child, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function paymentApproved(response: unknown): boolean {
  const status = findValue(response, ["status", "estado", "result", "responseCode", "response_code", "code"]);
  if (status === true || status === 1 || status === "1") return true;
  if (typeof status !== "string") return false;
  return ["approved", "aprobado", "success", "successful", "succeeded", "successed", "ok", "00"].includes(status.trim().toLowerCase());
}

function transactionId(response: unknown): string | null {
  const value = findValue(response, ["transactionId", "transaction_id", "idTransaction", "paymentId", "payment_id"]);
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function validBody(value: unknown): value is CallbackBody {
  if (!isRecord(value) || !isRecord(value.customer) || !Array.isArray(value.items)) return false;
  const customer = value.customer;
  return ["fullName", "cedula", "email", "phone", "address"].every((key) => typeof customer[key] === "string" && customer[key].trim())
    && value.items.length > 0
    && value.items.every((item) => isRecord(item) && typeof item.variantId === "string" && typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!validBody(body)) return NextResponse.json({ error: "Datos de pago incompletos." }, { status: 400 });

  if (!paymentApproved(body.pagopluxResponse)) {
    return NextResponse.json({ error: "Pago no aprobado." }, { status: 402 });
  }

  const transaction = transactionId(body.pagopluxResponse);
  if (!transaction) return NextResponse.json({ error: "Respuesta de PagoPlux sin ID de transacción." }, { status: 400 });
  const { data: previousOrder } = await insforgeAdmin.database.from("orders").select("id, status").eq("pagoplux_transaction_id", transaction).maybeSingle();
  if (previousOrder?.id) return NextResponse.json({ orderId: previousOrder.id, status: previousOrder.status });

  const requestedQuantities = new Map<string, number>();
  for (const item of body.items) requestedQuantities.set(item.variantId, (requestedQuantities.get(item.variantId) ?? 0) + item.quantity);
  const normalizedItems = [...requestedQuantities.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  const variantIds = normalizedItems.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await insforgeAdmin.database.from("product_variants").select("id, product_id, price, stock").in("id", variantIds);
  if (variantsError || !variants || variants.length !== variantIds.length) return NextResponse.json({ error: "Uno o más productos ya no están disponibles." }, { status: 409 });

  const byId = new Map(variants.map((variant) => [String(variant.id), variant as { id: string; product_id: string; price: number; stock: number }]));
  const orderItems = normalizedItems.map((item) => {
    const variant = byId.get(item.variantId)!;
    return { product_id: variant.product_id, variant_id: variant.id, quantity: item.quantity, unit_price: Number(variant.price), subtotal: roundCents(Number(variant.price) * item.quantity) };
  });
  if (orderItems.some((item) => item.quantity > Number(byId.get(item.variant_id)?.stock ?? 0))) return NextResponse.json({ error: "Stock insuficiente para uno o más productos." }, { status: 409 });

  const subtotalBase15 = roundCents(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
  const { data: taxSetting } = await insforgeAdmin.database.from("site_settings").select("value").eq("key", "tax_rate").maybeSingle();
  const configuredTaxRate = Number(taxSetting?.value);
  const ivaRate = Number.isFinite(configuredTaxRate) && configuredTaxRate >= 0 && configuredTaxRate <= 100 ? configuredTaxRate / 100 : IVA_RATE;
  const ivaAmount = roundCents(subtotalBase15 * ivaRate);
  const totalAmount = roundCents(subtotalBase15 + ivaAmount);
  let userId: string | null = null;
  try {
    const client = await createInsforgeServerClient();
    const { data } = await client.auth.getCurrentUser();
    userId = data?.user?.id ?? null;
  } catch { /* Guest checkout has no session. */ }

  const customerInput = { identification: body.customer.cedula.trim(), full_name: body.customer.fullName.trim(), email: body.customer.email.trim(), phone: body.customer.phone.trim(), address: body.customer.address.trim(), user_id: userId };
  const { data: existingCustomer } = await insforgeAdmin.database.from("customers").select("id").eq("identification", customerInput.identification).maybeSingle();
  let customerId: string;
  if (existingCustomer?.id) {
    const { data, error } = await insforgeAdmin.database.from("customers").update(customerInput).eq("id", existingCustomer.id).select("id").single();
    if (error || !data) return NextResponse.json({ error: "No se pudo actualizar el cliente." }, { status: 500 });
    customerId = String(data.id);
  } else {
    const { data, error } = await insforgeAdmin.database.from("customers").insert([customerInput]).select("id").single();
    if (error || !data) return NextResponse.json({ error: "No se pudo registrar el cliente." }, { status: 500 });
    customerId = String(data.id);
  }

  const { data: order, error: orderError } = await insforgeAdmin.database.from("orders").insert([{ customer_id: customerId, user_id: userId, subtotal_base_0: 0, subtotal_base_15: subtotalBase15, iva_amount: ivaAmount, total_amount: totalAmount, status: "PENDING", pagoplux_transaction_id: transaction, pagoplux_response_payload: body.pagopluxResponse }]).select("id").single();
  if (orderError || !order) return NextResponse.json({ error: "No se pudo registrar la orden." }, { status: 500 });

  const reservedItems: typeof orderItems = [];
  for (const item of orderItems) {
    const { data: reserved, error: reserveError } = await insforgeAdmin.database.rpc("reserve_variant_stock", { p_variant_id: item.variant_id, p_quantity: item.quantity });
    if (reserveError || reserved !== true) {
      for (const reservedItem of reservedItems) await insforgeAdmin.database.rpc("release_variant_stock", { p_variant_id: reservedItem.variant_id, p_quantity: reservedItem.quantity });
      await insforgeAdmin.database.from("orders").update({ status: "REJECTED" }).eq("id", order.id);
      return NextResponse.json({ error: "Stock insuficiente para uno o más productos." }, { status: 409 });
    }
    reservedItems.push(item);
  }

  const { error: itemsError } = await insforgeAdmin.database.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) {
    for (const reservedItem of reservedItems) await insforgeAdmin.database.rpc("release_variant_stock", { p_variant_id: reservedItem.variant_id, p_quantity: reservedItem.quantity });
    await insforgeAdmin.database.from("orders").update({ status: "REJECTED" }).eq("id", order.id);
    return NextResponse.json({ error: "No se pudieron registrar los productos de la orden." }, { status: 500 });
  }
  await insforgeAdmin.database.from("orders").update({ status: "APPROVED" }).eq("id", order.id);
  return NextResponse.json({ orderId: order.id, status: "APPROVED" });
}
