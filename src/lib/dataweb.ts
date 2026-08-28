import type { CartTotals } from "@/types/cart";

const APPROVED_CODES = new Set(["000.000.000", "000.100.112", "000.100.110"]);

export interface DatawebCustomer {
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
}

export interface DatawebItem {
  variantId: string;
  brand: string;
  model: string;
  capacity: string;
  color: string;
  unitPrice: number;
  quantity: number;
  isGift?: boolean;
  giftForProductId?: string;
}

export function datawebBaseUrl(): string {
  return process.env.DATAWEB_BASE_URL || "https://eu-test.oppwa.com";
}

export function datawebApproved(code: unknown): boolean {
  return typeof code === "string" && APPROVED_CODES.has(code);
}

function names(fullName: string): { givenName: string; middleName: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { givenName: (parts[0] || "Cliente").slice(0, 48), middleName: (parts[1] || parts[0] || "Cliente").slice(0, 50), surname: (parts.slice(2).join(" ") || parts[1] || parts[0] || "Cliente").slice(0, 48) };
}

export function buildDatawebParams(input: {
  merchantTransactionId: string;
  customer: DatawebCustomer;
  items: DatawebItem[];
  totals: CartTotals;
  clientIp: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  const customer = input.customer;
  const person = names(customer.fullName);
  const amount = Number(input.totals.total).toFixed(2);
  const append = (key: string, value: string) => params.append(key, value);
  append("entityId", process.env.DATAWEB_ENTITY_ID || "");
  append("amount", amount);
  append("currency", "USD");
  append("paymentType", "DB");
  append("merchantTransactionId", input.merchantTransactionId);
  append("customer.givenName", person.givenName);
  append("customer.middleName", person.middleName);
  append("customer.surname", person.surname);
  append("customer.ip", input.clientIp);
  append("customer.merchantCustomerId", (process.env.DATAWEB_CUSTOMER_ID || "guest").slice(0, 16));
  append("customer.email", customer.email.trim().slice(0, 128));
  append("customer.identificationDocType", "IDCARD");
  append("customer.identificationDocId", customer.cedula.replace(/\D/g, "").slice(0, 10));
  append("customer.phone", customer.phone.replace(/[^\d+]/g, "").slice(0, 25));
  append("billing.street1", customer.address.trim().slice(0, 100));
  append("billing.country", "EC");
  append("shipping.street1", customer.address.trim().slice(0, 100));
  append("shipping.country", "EC");
  append("customParameters[SHOPPER_VAL_BASE0]", input.totals.subtotalBase0.toFixed(2));
  append("customParameters[SHOPPER_VAL_BASEIMP]", input.totals.subtotalBase15.toFixed(2));
  append("customParameters[SHOPPER_VAL_IVA]", input.totals.ivaAmount.toFixed(2));
  if (process.env.DATAWEB_MODE !== "integrator") {
    append("customParameters[SHOPPER_MID]", process.env.DATAWEB_MID || "");
    append("customParameters[SHOPPER_TID]", process.env.DATAWEB_TID || "");
    append("customParameters[SHOPPER_ECI]", "0103910");
    append("customParameters[SHOPPER_PSERV]", "17913101");
    append("customParameters[SHOPPER_VERSIONDF]", "2");
    append("risk.parameters[USER_DATA2]", "CelularesJ14");
  }
  input.items.forEach((item, index) => {
    const name = `${item.brand} ${item.model} ${item.capacity} ${item.color}`.replace(/&/g, "y").slice(0, 255);
    append(`cart.items[${index}].name`, name);
    append(`cart.items[${index}].description`, name);
    append(`cart.items[${index}].price`, Number(item.unitPrice).toFixed(2));
    append(`cart.items[${index}].quantity`, String(item.quantity));
  });
  return params;
}
