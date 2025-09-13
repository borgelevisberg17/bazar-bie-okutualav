-- 010_full_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (core identity). Note: passwords optional if using Firebase Auth.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  email text UNIQUE,
  name text,
  phone text,
  password_hash text,
  role text DEFAULT 'customer',
  status text DEFAULT 'active',
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stores (shops)
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  logo_url text,
  cover_url text,
  status text DEFAULT 'pending',
  rating numeric(2,1) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories (hierarchical)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products
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
  status text DEFAULT 'active',
  images jsonb DEFAULT '[]'::jsonb, -- array of image objects {url, public_id, alt}
  attributes jsonb DEFAULT '{}'::jsonb,
  rating numeric(2,1) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  search_document tsvector -- populated by trigger
);

-- Product <-> Category (many-to-many)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Uploads (files, receipts, etc)
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

-- Carts and items (temporary)
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer DEFAULT 1,
  price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Orders and items
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  total_amount numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  shipping_address jsonb,
  billing_address jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_snapshot jsonb, -- keeps product data at purchase time
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Payments (escrow style)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  method text, -- e.g., local_transfer, card, wallet
  amount numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  status text DEFAULT 'pending', -- pending, confirmed, released, refunded
  provider_payload jsonb,
  receipt_upload_id uuid REFERENCES uploads(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions (ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  type text, -- debit/credit/fee
  amount numeric(12,2),
  currency varchar(8) DEFAULT 'AOA',
  balance_after numeric(12,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Reviews
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

-- Messages (chat)
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

-- Activity / audit log
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Simple key-value cache table (mini cache)
CREATE TABLE IF NOT EXISTS cache_kv (
  k text PRIMARY KEY,
  v jsonb,
  ttl timestamptz -- expiry timestamp
);

-- Sync checkpoints for localStorage / offline sync
CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  last_synced_at timestamptz DEFAULT '1970-01-01'::timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Materialized view for product feed (fast reads)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_feed AS
SELECT p.id, p.name, p.slug, p.price, p.currency, p.stock, p.images, p.rating, p.reviews_count, s.id as store_id, s.name as store_name, s.slug as store_slug
FROM products p JOIN stores s ON p.store_id = s.id WHERE p.status = 'active';

