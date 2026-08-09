-- ============================================================
-- Migration 004: Add image_key to products + private image bucket wiring
-- ============================================================
-- The product-images bucket is created out-of-band via the InsForge CLI:
--   npx @insforge/cli storage create-bucket product-images --private
--
-- With zero policies on storage.objects (verified at install time), the
-- authenticated and anon roles cannot read or write any storage row.
-- Admin/service_role bypasses RLS, so all server actions that touch the
-- bucket must go through the admin client (insforgeAdmin.storage...).
--
-- Public catalog images are served through the Next.js route handler at
-- /api/images/[...key], which validates the key against products.image_key
-- and streams the blob from InsForge via the admin client.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_key TEXT;
