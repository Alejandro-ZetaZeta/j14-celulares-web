import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { createInsforgeServerClient } from "@/lib/insforge-server";
import { roundCents, IVA_RATE } from "@/lib/cart";
import { calculatePromotion } from "@/lib/promotions";
import { datawebApproved } from "@/lib/dataweb";

interface CallbackItem { variantId: string; quantity: number; isGift?: boolean; giftForProductId?: string }
interface CallbackBody {
  paymentResponse?: unknown;
  paymentTransaction?: string;
  customer: { fullName: string; cedula: string; email: string; phone: string; address: string };
  items: CallbackItem[];
  promotionCode?: string;
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
  return isRecord(response) && isRecord(response.result) && datawebApproved(response.result.code);
}

function transactionId(response: unknown): string | null {
  const value = findValue(response, [
    "id_transaccion",
    "token",
    "transactionId",
    "transaction_id",
    "idTransaction",
    "paymentId",
    "payment_id",
  ]);
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function validBody(value: unknown): value is CallbackBody {
  if (!isRecord(value) || !isRecord(value.customer) || !Array.isArray(value.items)) return false;
  const customer = value.customer;
  return ["fullName", "cedula", "email", "phone", "address"].every((key) => typeof customer[key] === "string" && customer[key].trim())
    && value.items.length > 0
    && value.items.every((item) => isRecord(item) && typeof item.variantId === "string" && typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 && (item.isGift === undefined || typeof item.isGift === "boolean"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!validBody(body)) return NextResponse.json({ error: "Datos de pago incompletos." }, { status: 400 });
  if (!process.env.DATAWEB_INTERNAL_SECRET || request.headers.get("x-dataweb-internal-secret") !== process.env.DATAWEB_INTERNAL_SECRET) {
    return NextResponse.json({ error: "Solicitud interna no autorizada." }, { status: 403 });
  }

  const paymentResponse = body.paymentResponse;
  if (!paymentApproved(paymentResponse)) {
    return NextResponse.json({ error: "Pago no aprobado." }, { status: 402 });
  }

  const transaction = body.paymentTransaction || transactionId(paymentResponse);
  if (!transaction) return NextResponse.json({ error: "Respuesta de Dataweb sin ID de transacción." }, { status: 400 });
  const { data: previousOrder } = await insforgeAdmin.database.from("orders").select("id, status").eq("payment_provider", "dataweb").eq("payment_transaction_id", transaction).maybeSingle();
  if (previousOrder?.id) return NextResponse.json({ orderId: previousOrder.id, status: previousOrder.status });

  const requestedQuantities = new Map<string, number>();
  for (const item of body.items) if (!item.isGift) requestedQuantities.set(item.variantId, (requestedQuantities.get(item.variantId) ?? 0) + item.quantity);
  const normalizedItems = [...requestedQuantities.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  const giftItems = body.items.filter((item) => item.isGift);
  const variantIds = normalizedItems.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await insforgeAdmin.database.from("product_variants").select("id, product_id, price, stock").in("id", variantIds);
  if (variantsError || !variants || variants.length !== variantIds.length) return NextResponse.json({ error: "Uno o más productos ya no están disponibles." }, { status: 409 });

  const byId = new Map<string, { id: string; product_id: string; price: number; stock: number }>(variants.map((variant) => [String(variant.id), variant as { id: string; product_id: string; price: number; stock: number }]));
  const orderItems: Array<{ product_id: string; variant_id: string; quantity: number; unit_price: number; subtotal: number; is_gift: boolean; promotion_id: string | null }> = normalizedItems.map((item) => {
    const variant = byId.get(item.variantId)!;
    return { product_id: variant.product_id, variant_id: variant.id, quantity: item.quantity, unit_price: Number(variant.price), subtotal: roundCents(Number(variant.price) * item.quantity), is_gift: false, promotion_id: null };
  });
  const giftVariantIds = [...new Set(giftItems.map((item) => item.variantId))];
  if (giftVariantIds.length) {
    const { data: giftVariants } = await insforgeAdmin.database.from("product_variants").select("id, product_id, price, stock").in("id", giftVariantIds);
    const { data: giftLinks } = await insforgeAdmin.database.from("product_gifts").select("product_id, gift_product_id, quantity").in("product_id", orderItems.map((item) => item.product_id));
    for (const variant of giftVariants ?? []) byId.set(String(variant.id), variant as { id: string; product_id: string; price: number; stock: number });
    for (const gift of giftItems) {
      const variant = giftVariants?.find((candidate) => candidate.id === gift.variantId);
      const link = giftLinks?.find((candidate) => candidate.product_id === gift.giftForProductId && candidate.gift_product_id === variant?.product_id);
      if (!variant || !link || gift.quantity > Number(link.quantity) * Number(orderItems.find((item) => item.product_id === gift.giftForProductId)?.quantity ?? 0) || gift.quantity > Number(variant.stock)) return NextResponse.json({ error: "Regalo inválido o sin stock." }, { status: 409 });
      orderItems.push({ product_id: variant.product_id, variant_id: variant.id, quantity: gift.quantity, unit_price: 0, subtotal: 0, is_gift: true, promotion_id: null });
    }
  }
  if (orderItems.some((item) => item.quantity > Number(byId.get(item.variant_id)?.stock ?? 0))) return NextResponse.json({ error: "Stock insuficiente para uno o más productos." }, { status: 409 });

  let discountAmount = 0;
  let promotionId: string | null = null;
  if (body.promotionCode) {
    const promotionResult = await calculatePromotion(body.promotionCode, normalizedItems);
    if ("error" in promotionResult) return NextResponse.json({ error: promotionResult.error }, { status: 409 });
    discountAmount = promotionResult.discount;
    promotionId = String(promotionResult.promotion.id);
    const eligible = new Set(promotionResult.eligibleProductIds);
    const eligibleGross = orderItems.filter((item) => eligible.has(item.product_id)).reduce((sum, item) => sum + item.subtotal, 0);
    for (const item of orderItems) {
      const allocation = eligibleGross > 0 && eligible.has(item.product_id) ? roundCents(discountAmount * item.subtotal / eligibleGross) : 0;
      item.subtotal = roundCents(item.subtotal - allocation);
      item.unit_price = roundCents(item.subtotal / item.quantity);
      item.promotion_id = allocation > 0 ? promotionId : null;
    }
  }
  // Catalog and Dataweb amounts are VAT-inclusive; derive taxable base from gross total.
  const grossTotal = roundCents(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
  const { data: taxSetting } = await insforgeAdmin.database.from("site_settings").select("value").eq("key", "tax_rate").maybeSingle();
  const configuredTaxRate = Number(taxSetting?.value);
  const ivaRate = Number.isFinite(configuredTaxRate) && configuredTaxRate >= 0 && configuredTaxRate <= 100 ? configuredTaxRate / 100 : IVA_RATE;
  const subtotalBase15 = roundCents(grossTotal / (1 + ivaRate));
  const ivaAmount = roundCents(grossTotal - subtotalBase15);
  const totalAmount = grossTotal;
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

  const { data: order, error: orderError } = await insforgeAdmin.database.from("orders").insert([{ customer_id: customerId, user_id: userId, subtotal_base_0: 0, subtotal_base_15: subtotalBase15, iva_amount: ivaAmount, total_amount: totalAmount, discount_amount: discountAmount, promotion_code: body.promotionCode?.trim().toUpperCase() ?? null, status: "PENDING", payment_method: "Dataweb", payment_provider: "dataweb", payment_transaction_id: transaction, payment_response_payload: paymentResponse }]).select("id").single();
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
  if (promotionId) {
    const { data: counted, error: countError } = await insforgeAdmin.database.rpc("increment_promotion_use", { p_promotion_id: promotionId });
    if (countError || counted !== true) {
      for (const reservedItem of reservedItems) await insforgeAdmin.database.rpc("release_variant_stock", { p_variant_id: reservedItem.variant_id, p_quantity: reservedItem.quantity });
      await insforgeAdmin.database.from("orders").update({ status: "REJECTED" }).eq("id", order.id);
      return NextResponse.json({ error: "Esta promoción alcanzó su límite de usos." }, { status: 409 });
    }
  }
  await insforgeAdmin.database.from("orders").update({ status: "APPROVED" }).eq("id", order.id);
  return NextResponse.json({ orderId: order.id, status: "APPROVED" });
}
