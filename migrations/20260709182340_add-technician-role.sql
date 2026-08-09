-- ============================================================
-- Migration: Role-based RLS for technician + admin panel
-- ============================================================
-- NOTE: the 'technician' value was added to the user_role enum out-of-band
-- because ALTER TYPE ... ADD VALUE cannot run inside a transaction and
-- migrations are executed transactionally. This migration wires up the
-- policies and helper that depend on that value.

-- 1. Helper: returns the current authenticated user's app role.
--    SECURITY DEFINER is required because user_profiles has RLS enabled;
--    without it, the lookup would re-enter RLS and risk recursion.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 2. User profiles: restrict full access to admins.
--    Own-read/update policies are left untouched.
DROP POLICY IF EXISTS "Admin full access profiles" ON public.user_profiles;

CREATE POLICY "Admin full access profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 3. Technical service tickets
--    - Public lookup by ticket_id stays untouched (existing policy).
--    - Technicians and admins can view, create, update and delete tickets.
DROP POLICY IF EXISTS "Admin full access tickets" ON public.technical_service;

CREATE POLICY "Admin and technician manage tickets"
  ON public.technical_service
  FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'technician'))
  WITH CHECK (public.current_user_role() IN ('admin', 'technician'));

-- 4. Admin-only modules: products, variants, serials and credit-card rates.
--    Replace the old service_role policies with app-role checks so that
--    full access is restricted to admin users.
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
DROP POLICY IF EXISTS "Admin full access variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin full access serials" ON public.phone_serials;
DROP POLICY IF EXISTS "Admin full access credit card rates" ON public.credit_card_rates;

CREATE POLICY "Admin full access products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin full access variants"
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin full access serials"
  ON public.phone_serials
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin full access credit card rates"
  ON public.credit_card_rates
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 5. Runtime privileges so the policies above can be reached.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_service TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_serials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
