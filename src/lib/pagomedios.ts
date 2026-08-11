import type { CartTotals } from "@/types/cart";

export const PAGOMEDIOS_API_URL = process.env.PAGOMEDIOS_API_URL ?? "https://api.abitmedia.cloud/pagomedios/v2";

export interface PagomediosCustomer {
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
}

interface PaymentRequestResponse {
  success?: boolean;
  data?: { url?: string; token?: string };
  message?: string;
}

function authHeaders(): HeadersInit {
  const token = process.env.PAGOMEDIOS_API_TOKEN;
  if (!token) throw new Error("PAGOMEDIOS_API_TOKEN no está configurado.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function createPagomediosPayment(
  totals: CartTotals,
  customer: PagomediosCustomer,
  orderId: string,
): Promise<{ url: string; token: string; response: PaymentRequestResponse }> {
  const notifyUrl = new URL(process.env.PAGOMEDIOS_NOTIFY_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/payments/pagomedios-notify`);
  if (process.env.PAGOMEDIOS_NOTIFY_SECRET) notifyUrl.searchParams.set("secret", process.env.PAGOMEDIOS_NOTIFY_SECRET);
  const response = await fetch(`${PAGOMEDIOS_API_URL}/payment-requests`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      integration: true,
      third: {
        document: customer.cedula.trim(),
        document_type: customer.cedula.trim().length === 13 ? "04" : "05",
        name: customer.fullName.trim(),
        email: customer.email.trim(),
        phones: customer.phone.trim(),
        address: customer.address.trim(),
        type: "Individual",
      },
      generate_invoice: Number(process.env.PAGOMEDIOS_GENERATE_INVOICE ?? "1") === 1 ? 1 : 0,
      description: `Compra Celulares J14 ${orderId.slice(0, 8)}`,
      amount: totals.total,
      amount_with_tax: totals.subtotalBase15,
      amount_without_tax: totals.subtotalBase0,
      tax_value: totals.ivaAmount,
      notify_url: notifyUrl.toString(),
      custom_value: orderId,
      has_cards: 1,
      has_de_una: 1,
      has_paypal: 1,
      has_safetypay: true,
    }),
  });
  const payload = await response.json() as PaymentRequestResponse;
  if (!response.ok || !payload.data?.url || !payload.data.token) {
    throw new Error(payload.message ?? "Pagomedios no pudo crear la solicitud de pago.");
  }
  return { url: payload.data.url, token: payload.data.token, response: payload };
}

export async function getPagomediosPayment(token: string): Promise<unknown> {
  const response = await fetch(`${PAGOMEDIOS_API_URL}/payment-requests?integration=true&uuid=${encodeURIComponent(token)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("No se pudo verificar el pago en Pagomedios.");
  return payload;
}
