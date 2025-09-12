-- 013_functions.sql
-- Get changes since timestamp for user (simplified)
CREATE OR REPLACE FUNCTION get_changes_since(ts timestamptz) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  products jsonb;
  orders jsonb;
BEGIN
  SELECT jsonb_agg(to_jsonb(p) - 'search_document') INTO products FROM products p WHERE p.updated_at > ts;
  SELECT jsonb_agg(to_jsonb(o)) INTO orders FROM orders o WHERE o.updated_at > ts;
  RETURN jsonb_build_object('products', coalesce(products, '[]'::jsonb), 'orders', coalesce(orders, '[]'::jsonb));
END;
$$;

-- Simple cache cleanup job
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM cache_kv WHERE ttl IS NOT NULL AND ttl < now();
END;
$$;
