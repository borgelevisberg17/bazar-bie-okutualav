-- Add support for multiple images in products
ALTER TABLE products ADD COLUMN images text[] DEFAULT ARRAY[]::text[];

-- Update existing products to use the new images array column
UPDATE products SET images = ARRAY[image_url]::text[] WHERE image_url IS NOT NULL;

-- Add index for better performance
CREATE INDEX idx_products_images ON products USING GIN(images);

-- Add columns to profiles for more complete social media profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_count integer DEFAULT 0;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update public_profiles view to include new fields
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT id, full_name, avatar_url, bio, username, location
FROM profiles;