-- Bazar Universal - Initial Database Schema
-- This file consolidates all previous migrations into a single, authoritative schema.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned');
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending','confirmed','released','refunded');
CREATE TYPE transaction_type AS ENUM ('debit','credit','fee');

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  email text UNIQUE,
  name text,
  phone text,
  password_hash text,
  role user_role DEFAULT 'customer',
  status user_status DEFAULT 'active',
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: stores
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  logo_url text,
  cover_url text,
  status store_status DEFAULT 'pending',
  rating numeric(2,1) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id),
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  price numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  stock integer DEFAULT 0,
  status product_status DEFAULT 'active',
  images jsonb DEFAULT '[]'::jsonb,
  attributes jsonb DEFAULT '{}'::jsonb,
  rating numeric(2,1) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  search_document tsvector
);

-- Table: product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Table: uploads
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  file_name text,
  mime text,
  size bigint,
  provider text DEFAULT 'cloudinary',
  provider_id text,
  url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: carts
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer DEFAULT 1,
  price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_amount numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  shipping_address jsonb,
  billing_address jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_snapshot jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  method text,
  amount numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  status payment_status DEFAULT 'pending',
  provider_payload jsonb,
  receipt_upload_id uuid REFERENCES uploads(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  type transaction_type,
  amount numeric(12,2),
  currency varchar(8) DEFAULT 'AOA',
  balance_after numeric(12,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id),
  to_user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: cache_kv
CREATE TABLE IF NOT EXISTS cache_kv (
  k text PRIMARY KEY,
  v jsonb,
  ttl timestamptz
);

-- Table: sync_checkpoints
CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  last_synced_at timestamptz DEFAULT '1970-01-01'::timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Materialized View: product_feed
CREATE MATERIALIZED VIEW IF NOT EXISTS product_feed AS
SELECT p.id, p.name, p.slug, p.price, p.currency, p.stock, p.images, p.rating, p.reviews_count, s.id as store_id, s.name as store_name, s.slug as store_slug
FROM products p JOIN stores s ON p.store_id = s.id WHERE p.status = 'active';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_read ON messages(to_user_id, read);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_id, created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION refresh_product_feed() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_feed;
END;
$$;

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

CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM cache_kv WHERE ttl IS NOT NULL AND ttl < now();
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_timestamp') THEN
    CREATE TRIGGER users_set_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stores_set_timestamp') THEN
    CREATE TRIGGER stores_set_timestamp BEFORE UPDATE ON stores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_set_timestamp') THEN
    CREATE TRIGGER products_set_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_timestamp') THEN
    CREATE TRIGGER orders_set_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END$$;

CREATE OR REPLACE FUNCTION products_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_document := to_tsvector('portuguese', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_search_vector') THEN
    CREATE TRIGGER products_search_vector BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE products_tsv_trigger();
  END IF;
END$$;

CREATE OR REPLACE FUNCTION notify_meili() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload = json_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', NEW.id);
  PERFORM pg_notify('meili', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_notify_meili') THEN
    CREATE TRIGGER products_notify_meili AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE PROCEDURE notify_meili();
  END IF;
END$$;
