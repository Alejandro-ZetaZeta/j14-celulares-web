import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { datawebApproved, datawebBaseUrl } from "@/lib/dataweb";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resourcePath = url.searchParams.get("resourcePath");
  if (!resourcePath || !resourcePath.startsWith("/v1/")) return NextResponse.redirect(new URL("/checkout/confirmacion?estado=error", url));
  const entityId = process.env.DATAWEB_ENTITY_ID?.trim();
  const authToken = process.env.DATAWEB_AUTH_TOKEN?.trim();
  if (!entityId || !authToken) return NextResponse.redirect(new URL("/checkout/confirmacion?estado=error", url));

  const gatewayUrl = new URL(resourcePath, `${datawebBaseUrl().replace(/\/$/, "")}/`);
  gatewayUrl.searchParams.set("entityId", entityId);
  console.info("[dataweb-result] querying gateway", { endpoint: gatewayUrl.toString() });
  const gatewayResponse = await fetch(gatewayUrl, { method: "GET", headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
  const transaction = await gatewayResponse.json() as { id?: string; merchantTransactionId?: string; result?: { code?: string; description?: string; parameterErrors?: Array<{ name?: string; value?: unknown; message?: string }> }; resultDetails?: Record<string, string>; ndc?: string };
  const merchantId = transaction.merchantTransactionId;
  const checkoutId = url.searchParams.get("id") || transaction.id;
  let { data: attempt } = merchantId
    ? await insforgeAdmin.database.from("dataweb_payment_attempts").select("id, payload, status").eq("merchant_transaction_id", merchantId).maybeSingle()
    : { data: null };
  if (!attempt && checkoutId) {
    ({ data: attempt } = await insforgeAdmin.database.from("dataweb_payment_attempts").select("id, payload, status").eq("checkout_id", checkoutId).maybeSingle());
  }
  const resultCode = transaction.result?.code || "";
  console.info("[dataweb-result]", { checkoutId, merchantId: merchantId || null, gatewayHttpStatus: gatewayResponse.status, gatewayId: transaction.id || null, ndc: transaction.ndc || null, resultCode, description: transaction.result?.description || null, parameterErrors: transaction.result?.parameterErrors || [], attemptFound: Boolean(attempt) });
  if (!attempt || attempt.status === "APPROVED") return NextResponse.redirect(new URL(`/checkout/confirmacion?estado=${datawebApproved(resultCode) ? "ok" : "error"}&codigo=${encodeURIComponent(resultCode)}`, url));

  const approved = datawebApproved(resultCode);
  await insforgeAdmin.database.from("dataweb_payment_attempts").update({ status: approved ? "PROCESSING" : "REJECTED", transaction_id: transaction.id || null, response_payload: transaction, updated_at: new Date().toISOString() }).eq("id", attempt.id);
  if (!approved) return NextResponse.redirect(new URL(`/checkout/confirmacion?estado=error&codigo=${encodeURIComponent(resultCode)}`, url));

  // Save tokenized card registration if generated
  const rawTx = transaction as Record<string, unknown>;
  const registrationId = typeof rawTx.registrationId === "string" ? rawTx.registrationId : (Array.isArray(rawTx.registrations) && typeof (rawTx.registrations[0] as Record<string, unknown>)?.id === "string" ? ((rawTx.registrations[0] as Record<string, unknown>).id as string) : null);
  const cardObj = (rawTx.card as Record<string, string> | undefined) || {};
  const userId = (attempt.payload as Record<string, unknown> | null)?.userId as string | undefined;

  if (registrationId && userId) {
    try {
      await insforgeAdmin.database.from("card_tokens").insert([{
        user_id: userId,
        registration_id: registrationId,
        brand: (rawTx.paymentBrand as string) || null,
        last4: cardObj.last4Digits || cardObj.last4 || null,
        expiry_month: cardObj.expiryMonth || null,
        expiry_year: cardObj.expiryYear || null,
        holder: cardObj.holder || null,
      }]);
    } catch (tokenErr) {
      console.error("[dataweb-result] error saving card token:", tokenErr);
    }
  }

  const origin = url.origin;
  const fulfillment = await fetch(`${origin}/api/payments/payment-callback`, { method: "POST", headers: { "Content-Type": "application/json", "x-dataweb-internal-secret": process.env.DATAWEB_INTERNAL_SECRET || "" }, body: JSON.stringify({ paymentTransaction: transaction.id, paymentResponse: transaction, ...attempt.payload }) });
  const result = await fulfillment.json() as { orderId?: string };
  await insforgeAdmin.database.from("dataweb_payment_attempts").update({ status: fulfillment.ok ? "APPROVED" : "REJECTED", updated_at: new Date().toISOString() }).eq("id", attempt.id);
  return NextResponse.redirect(new URL(`/checkout/confirmacion?estado=${fulfillment.ok ? "ok" : "error"}${result.orderId ? `&orden=${encodeURIComponent(result.orderId)}` : ""}`, url));
}
