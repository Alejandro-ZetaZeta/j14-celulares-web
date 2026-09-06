import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { buildDatawebParams, datawebBaseUrl, type DatawebCustomer, type DatawebItem } from "@/lib/dataweb";
import type { CartTotals } from "@/types/cart";

function valid(input: unknown): input is { customer: DatawebCustomer; items: DatawebItem[]; totals: CartTotals; promotionCode?: string } {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  const customer = value.customer as Record<string, unknown> | undefined;
  const totals = value.totals as Record<string, unknown> | undefined;
  if (!customer || !totals) return false;
  return Boolean(customer && totals && Array.isArray(value.items) && value.items.length > 0)
    && ["fullName", "cedula", "email", "phone", "address"].every((key) => typeof customer?.[key] === "string" && String(customer[key]).trim())
    && /^\d{10}$/.test(String(customer?.cedula))
    && ["subtotalBase0", "subtotalBase15", "ivaAmount", "total"].every((key) => Number.isFinite(Number(totals?.[key])))
    && Number(totals.total) >= 1
    && Math.abs(Number(totals.total) - (Number(totals.subtotalBase0) + Number(totals.subtotalBase15) + Number(totals.ivaAmount))) < 0.011;
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!valid(body) || !process.env.DATAWEB_ENTITY_ID || !process.env.DATAWEB_AUTH_TOKEN) return NextResponse.json({ error: "Configuración o datos Dataweb incompletos." }, { status: 400 });

  const merchantTransactionId = `J14_${crypto.randomUUID().replace(/-/g, "")}`;
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "0.0.0.0";
  const customer = body.customer;
  const items = body.items;
  const totals = body.totals;
  const payload = { customer, items, totals, promotionCode: body.promotionCode?.trim().toUpperCase() || null };
  const response = await fetch(`${datawebBaseUrl()}/v1/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DATAWEB_AUTH_TOKEN}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: buildDatawebParams({ merchantTransactionId, customer, items, totals, clientIp }).toString(),
  });
  const data = await response.json() as { id?: string; result?: { code?: string; description?: string } };
  if (!response.ok || data.result?.code !== "000.200.100" || !data.id) return NextResponse.json({ error: data.result?.description || "Dataweb no pudo crear checkout." }, { status: 502 });

  const { error } = await insforgeAdmin.database.from("dataweb_payment_attempts").insert([{ merchant_transaction_id: merchantTransactionId, checkout_id: data.id, payload, status: "CREATED" }]);
  if (error) return NextResponse.json({ error: "No se pudo preparar la orden de pago." }, { status: 500 });
  return NextResponse.json({ checkoutId: data.id, merchantTransactionId });
}
