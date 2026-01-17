-- Create a secure function to get product contact information
-- This requires authentication and only returns contact info for a specific product
CREATE OR REPLACE FUNCTION public.get_product_contact(product_uuid uuid)
RETURNS TABLE (whatsapp text, seller_name text, seller_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to view contact information';
  END IF;

  -- Return contact info for the specific product
  RETURN QUERY
  SELECT 
    p.whatsapp,
    pr.full_name as seller_name,
    pr.phone as seller_phone
  FROM products p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.id = product_uuid
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_product_contact(uuid) TO authenticated;