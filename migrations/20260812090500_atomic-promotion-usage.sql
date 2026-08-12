CREATE OR REPLACE FUNCTION public.increment_promotion_use(p_promotion_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.promotions
    SET used_count = used_count + 1
    WHERE id = p_promotion_id AND (max_uses IS NULL OR used_count < max_uses)
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$$;
