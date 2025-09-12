-- User roles e status
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned');

ALTER TABLE users 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE users 
  ALTER COLUMN role TYPE user_role USING role::user_role,
  ALTER COLUMN status TYPE user_status USING status::user_status;

ALTER TABLE users 
  ALTER COLUMN role SET DEFAULT 'customer',
  ALTER COLUMN status SET DEFAULT 'active';

-- Store status
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'suspended');
ALTER TABLE stores 
  ALTER COLUMN status TYPE store_status USING status::store_status;
ALTER TABLE stores 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Product status
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');
ALTER TABLE products 
  ALTER COLUMN status TYPE product_status USING status::product_status;
ALTER TABLE products 
  ALTER COLUMN status SET DEFAULT 'active';

-- Orders status
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
ALTER TABLE orders 
  ALTER COLUMN status TYPE order_status USING status::order_status;
ALTER TABLE orders 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Payments status
CREATE TYPE payment_status AS ENUM ('pending','confirmed','released','refunded');
ALTER TABLE payments 
  ALTER COLUMN status TYPE payment_status USING status::payment_status;
ALTER TABLE payments 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Transactions type
CREATE TYPE transaction_type AS ENUM ('debit','credit','fee');
ALTER TABLE transactions 
  ALTER COLUMN type TYPE transaction_type USING type::transaction_type;