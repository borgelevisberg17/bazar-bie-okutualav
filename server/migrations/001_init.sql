CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  name text,
  email text,
  role text DEFAULT 'customer',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES users(id),
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  currency varchar(8) DEFAULT 'AOA',
  image_url text,
  stock integer DEFAULT 0,
  tag text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id),
  total_amount numeric(12,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  buyer_id uuid REFERENCES users(id),
  seller_id uuid REFERENCES users(id),
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'pending',
  receipt_url text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
