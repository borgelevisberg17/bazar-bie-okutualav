-- 012_indexes.sql
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores (owner_id);

-- Refresh materialized view helper
CREATE OR REPLACE FUNCTION refresh_product_feed() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_feed;
END;
$$;
