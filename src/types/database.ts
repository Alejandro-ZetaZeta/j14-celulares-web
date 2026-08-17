// ============================================================
// Database TypeScript Interfaces — Cell Phone Sales Platform
// ============================================================

export type ProductType = string;
export type ServiceStatus = 'received' | 'under_diagnosis' | 'ready_for_delivery' | 'delivered';
export type AppRole = 'admin' | 'technician' | 'client';
export type OrderStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
export type PromotionType = 'percentage' | 'fixed' | 'gift';

export interface Product {
  id: string;
  brand: string;
  model: string;
  type: ProductType;
  image_url: string | null;
  image_key: string | null;
  allows_installments: boolean;
  is_featured: boolean;
  featured_order: number;
  featured_eyebrow: string | null;
  featured_headline: string | null;
  featured_description: string | null;
  featured_cta: string | null;
  created_at: string;
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_key: string;
  display_order: number;
  created_at: string;
}

export type CollectionMatchType = "all" | "product_type" | "brand_eq" | "model_contains";

export interface CatalogCollection {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  match_type: CollectionMatchType;
  match_value: string | null;
  show_as_chip: boolean;
  show_on_home: boolean;
  pin_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CreditCardRate {
  id: string;
  months: number;
  interest_multiplier: number;
  active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  capacity: string;
  color: string;
  price: number;
  stock: number;               // Aggregate count of unsold phone_serials
  battery_condition: number | null; // Only for open_box_iphone (0–100)
  created_at: string;
}

// Internal admin-only entity — never exposed to public catalog responses
export interface PhoneSerial {
  id: string;
  variant_id: string;
  imei: string;
  is_sold: boolean;
  created_at: string;
}

export interface TechnicalService {
  id: string;
  ticket_id: string;        // Human-readable public ticket code, e.g. ST-20260625-001
  client_name: string;
  client_contact: string;
  device: string;
  status: ServiceStatus;
  progressing: boolean;     // true = Avanzando, false = Detenido (only relevant under_diagnosis)
  current_details: string;
  entry_date: string;
  user_id?: string | null;
}

export interface TechnicalServiceWithProfile extends TechnicalService {
  client_profile: Pick<UserProfile, "id" | "full_name" | "phone" | "role"> | null;
}

export interface UserProfile {
  id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  cedula: string | null;
  date_of_birth: string | null;
  address: string | null;
  is_profile_completed: boolean;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: AppRole;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Joined / Extended Types ───────────────────────────────────

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
  product_gifts?: ProductGift[];
}

export interface ProductGift {
  product_id: string;
  gift_product_id: string;
  quantity: number;
  gift_product?: ProductWithVariants | ProductWithVariants[];
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  promotion_type: PromotionType;
  discount_value: number;
  min_subtotal: number;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
  promotion_products?: { product_id: string }[];
}

export interface VariantWithSerials extends ProductVariant {
  phone_serials: PhoneSerial[];
}

export interface Customer {
  id: string;
  identification: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  user_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  user_id: string | null;
  subtotal_base_0: number;
  subtotal_base_15: number;
  iva_amount: number;
  total_amount: number;
  discount_amount: number;
  promotion_code: string | null;
  status: OrderStatus;
  payment_method: string;
  tracking_number: string | null;
  internal_notes: string | null;
  delivery_observations: string | null;
  pagoplux_transaction_id: string | null;
  pagoplux_response_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_gift?: boolean;
  promotion_id?: string | null;
}

export interface AdminOrder extends Order {
  customer: Customer;
}

export interface AdminOrderItem extends OrderItem {
  product: Pick<Product, "id" | "brand" | "model" | "image_url">;
  variant: Pick<ProductVariant, "id" | "capacity" | "color">;
}

export interface AdminOrderDetail extends AdminOrder {
  items: AdminOrderItem[];
}
