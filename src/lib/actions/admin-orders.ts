"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getAdminDatabase } from "@/lib/insforge-server";
import type {
  AdminOrder,
  AdminOrderDetail,
  AdminOrderItem,
  Customer,
  Order,
  OrderStatus,
  Product,
  ProductVariant,
} from "@/types/database";

export type OrderDatePreset = "all" | "today" | "last7" | "month" | "custom";

export interface AdminOrderFilters {
  search?: string;
  status?: OrderStatus | "ALL";
  datePreset?: OrderDatePreset;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminOrderMetrics {
  revenue: number;
  sales: number;
  pendingDispatch: number;
  averageTicket: number;
}

export interface AdminOrdersResult {
  orders: AdminOrder[];
  metrics: AdminOrderMetrics;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface OrderWithCustomer extends Omit<Order, "pagoplux_response_payload"> {
  pagoplux_response_payload?: Record<string, unknown> | null;
  customers: Customer[];
}

interface OrderWithRelations extends OrderWithCustomer {
  order_items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    products: Array<Pick<Product, "id" | "brand" | "model" | "image_url">>;
    product_variants: Array<Pick<ProductVariant, "id" | "capacity" | "color">>;
  }>;
}

const PAID_STATUSES: readonly OrderStatus[] = ["APPROVED", "DISPATCHED", "DELIVERED"];

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeSearch(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 80);
}

function safeIlike(value: string): string {
  return value.replace(/[,%()]/g, " ");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function dateRange(filters: AdminOrderFilters): { from: string | null; to: string | null } {
  const preset = filters.datePreset ?? "all";
  if (preset === "custom") {
    const from = filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : null;
    const to = filters.to ? new Date(`${filters.to}T00:00:00.000Z`) : null;
    return {
      from: from && !Number.isNaN(from.getTime()) ? from.toISOString() : null,
      to: to && !Number.isNaN(to.getTime()) ? to.toISOString() : null,
    };
  }

  if (preset === "all") return { from: null, to: null };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (preset === "last7") start.setUTCDate(start.getUTCDate() - 6);
  if (preset === "month") start.setUTCDate(1);

  return { from: start.toISOString(), to: null };
}

function mapOrder(row: OrderWithCustomer): AdminOrder {
  const { customers, ...order } = row;
  return { ...order, pagoplux_response_payload: row.pagoplux_response_payload ?? null, customer: customers[0] ?? {
    id: order.customer_id,
    identification: "",
    full_name: "Cliente sin datos",
    email: "",
    phone: "",
    address: "",
    user_id: order.user_id,
    created_at: order.created_at,
  } };
}

function mapDetail(row: OrderWithRelations): AdminOrderDetail {
  return {
    ...mapOrder(row),
    items: row.order_items.map((item): AdminOrderItem => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: asNumber(item.unit_price),
      subtotal: asNumber(item.subtotal),
      product: item.products[0] ?? { id: item.product_id, brand: "Producto", model: "No disponible", image_url: null },
      variant: item.product_variants[0] ?? { id: item.variant_id, capacity: "", color: "" },
    })),
  };
}

async function findCustomerIds(db: Awaited<ReturnType<typeof getAdminDatabase>>, search: string): Promise<string[]> {
  const term = safeIlike(search);
  const { data, error } = await db
    .from("customers")
    .select("id")
    .or(`full_name.ilike.%${term}%,identification.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(100);
  if (error) throw new Error(error.message);
  return (data as Array<{ id: string }>).map((customer) => customer.id);
}

function applyOrderFilters<T extends {
  eq: (column: string, value: string) => T;
  in: (column: string, values: string[]) => T;
  gte: (column: string, value: string) => T;
  lt: (column: string, value: string) => T;
}>(query: T, filters: AdminOrderFilters, customerIds: string[], search: string): T {
  let next = query;
  if (filters.status && filters.status !== "ALL") next = next.eq("status", filters.status);
  if (customerIds.length) next = next.in("customer_id", customerIds);
  if (search && isUuid(search)) next = next.eq("id", search);
  const range = dateRange(filters);
  if (range.from) next = next.gte("created_at", range.from);
  if (range.to) next = next.lt("created_at", range.to);
  return next;
}

export async function getAdminOrders(filters: AdminOrderFilters = {}): Promise<AdminOrdersResult> {
  const db = await getAdminDatabase();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Math.floor(filters.pageSize ?? 15)));
  const search = normalizeSearch(filters.search);
  const customerIds = search && !isUuid(search) ? await findCustomerIds(db, search) : [];

  if (search && !isUuid(search) && customerIds.length === 0) {
    return { orders: [], metrics: await getMetrics(db), page, pageSize, total: 0, totalPages: 0 };
  }

  const select = "id, customer_id, user_id, subtotal_base_0, subtotal_base_15, iva_amount, total_amount, status, payment_method, tracking_number, internal_notes, delivery_observations, pagoplux_transaction_id, created_at, updated_at, customers(id, identification, full_name, email, phone, address, user_id, created_at)";
  let query = db.from("orders").select(select, { count: "exact" });
  query = applyOrderFilters(query, filters, customerIds, search);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    orders: (data as OrderWithCustomer[]).map(mapOrder),
    metrics: await getMetrics(db),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function getMetrics(db: Awaited<ReturnType<typeof getAdminDatabase>>): Promise<AdminOrderMetrics> {
  const { data, error } = await db.from("orders").select("status, total_amount");
  if (error) throw new Error(error.message);
  const orders = data as Array<Pick<Order, "status" | "total_amount">>;
  const paid = orders.filter((order) => PAID_STATUSES.includes(order.status));
  const revenue = paid.reduce((sum, order) => sum + asNumber(order.total_amount), 0);
  return {
    revenue,
    sales: orders.length,
    pendingDispatch: orders.filter((order) => order.status === "APPROVED").length,
    averageTicket: paid.length ? revenue / paid.length : 0,
  };
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const db = await getAdminDatabase();
  if (!isUuid(orderId)) return null;

  const { data, error } = await db
    .from("orders")
    .select("id, customer_id, user_id, subtotal_base_0, subtotal_base_15, iva_amount, total_amount, status, payment_method, tracking_number, internal_notes, delivery_observations, pagoplux_transaction_id, created_at, updated_at, customers(id, identification, full_name, email, phone, address, user_id, created_at), order_items(id, order_id, product_id, variant_id, quantity, unit_price, subtotal, products(id, brand, model, image_url), product_variants(id, capacity, color))")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDetail(data as OrderWithRelations) : null;
}

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["APPROVED", "DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DISPATCHED", "DELIVERED", "CANCELLED"],
  DELIVERED: ["DELIVERED"],
  REJECTED: ["REJECTED"],
  CANCELLED: ["CANCELLED"],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updates: Pick<Order, "tracking_number" | "internal_notes" | "delivery_observations">,
): Promise<AdminOrderDetail> {
  const db = await getAdminDatabase();
  if (!isUuid(orderId)) throw new Error("Orden inválida.");

  const { data: current, error: currentError } = await db.from("orders").select("status").eq("id", orderId).single();
  if (currentError || !current) throw new Error("Orden no encontrada.");

  const currentStatus = current.status as OrderStatus;
  if (!TRANSITIONS[currentStatus].includes(status)) {
    throw new Error(`Transición no permitida: ${currentStatus} → ${status}.`);
  }

  const { error } = await db.from("orders").update({
    status,
    tracking_number: updates.tracking_number?.trim() || null,
    internal_notes: updates.internal_notes?.trim() || null,
    delivery_observations: updates.delivery_observations?.trim() || null,
  }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ventas");
  updateTag(`order-${orderId}`);
  const updated = await getAdminOrderDetail(orderId);
  if (!updated) throw new Error("No se pudo cargar orden actualizada.");
  return updated;
}
