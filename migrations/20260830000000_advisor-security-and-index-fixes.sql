-- ============================================================
-- Advisor remediation: SECURITY DEFINER mutator hardening + indexes
-- ============================================================
-- Scope: resolves the real critical issues flagged by the InsForge
-- Backend Advisor. False positives are intentionally left untouched
-- (documented in the PR).
--
-- CRITICAL: reserve_variant_stock, release_variant_stock and
-- increment_promotion_use are SECURITY DEFINER and were callable by
-- anon + authenticated via the default PUBLIC EXECUTE grant. They
-- mutate stock / usage counters. They are invoked ONLY server-side
-- through the service_role admin client (src/lib/insforge-admin.ts),
-- so client roles (anon/authenticated) never need EXECUTE.
--
-- Revoke from client roles + PUBLIC, and re-grant to project_admin
-- (the server-side role used by insforge-admin.ts) so the payment
-- callback keeps working.

REVOKE EXECUTE ON FUNCTION public.reserve_variant_stock(p_variant_id UUID, p_quantity INTEGER) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_variant_stock(p_variant_id UUID, p_quantity INTEGER) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promotion_use(p_promotion_id UUID) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_variant_stock(p_variant_id UUID, p_quantity INTEGER) TO project_admin;
GRANT EXECUTE ON FUNCTION public.release_variant_stock(p_variant_id UUID, p_quantity INTEGER) TO project_admin;
GRANT EXECUTE ON FUNCTION public.increment_promotion_use(p_promotion_id UUID) TO project_admin;

-- Harden search_path on the remaining SECURITY DEFINER helpers that
-- must stay callable by client roles for RLS/realtime/ticket lookup.
-- current_user_role(), can_access_ticket_channel() and
-- lookup_ticket_by_code() already set search_path; enforce an empty
-- search_path on the mutators so a hijacked schema can never shadow
-- objects referenced inside them.
ALTER FUNCTION public.reserve_variant_stock(p_variant_id UUID, p_quantity INTEGER) SET search_path = pg_catalog;
ALTER FUNCTION public.release_variant_stock(p_variant_id UUID, p_quantity INTEGER) SET search_path = pg_catalog;
ALTER FUNCTION public.increment_promotion_use(p_promotion_id UUID) SET search_path = pg_catalog;

-- ============================================================
-- Performance: missing foreign-key indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS order_items_variant_id_idx ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS order_items_promotion_id_idx ON public.order_items(promotion_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS product_gifts_gift_product_id_idx ON public.product_gifts(gift_product_id);
CREATE INDEX IF NOT EXISTS dataweb_payment_attempts_customer_id_idx ON public.dataweb_payment_attempts(customer_id);
CREATE INDEX IF NOT EXISTS ticket_messages_sender_id_idx ON public.ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS promotion_products_product_id_idx ON public.promotion_products(product_id);
CREATE INDEX IF NOT EXISTS phone_serials_variant_id_idx ON public.phone_serials(variant_id);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);

-- ============================================================
-- Performance: missing RLS-policy column indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS credit_card_rates_active_idx ON public.credit_card_rates(active);
CREATE INDEX IF NOT EXISTS product_variants_stock_idx ON public.product_variants(stock);
CREATE INDEX IF NOT EXISTS ticket_messages_sender_role_idx ON public.ticket_messages(sender_role);
