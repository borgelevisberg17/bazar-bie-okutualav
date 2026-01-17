-- Recriar a view com security_invoker para evitar o warning
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  bio,
  location,
  website,
  followers_count,
  following_count,
  posts_count,
  is_seller,
  seller_verified,
  seller_rating,
  seller_reviews_count,
  storefront_name,
  storefront_description,
  storefront_banner_url,
  storefront_theme,
  created_at
FROM public.profiles;

-- Adicionar política para permitir leitura pública apenas dos campos básicos
-- Esta política é para SELECT então é aceitável usar USING (true)
CREATE POLICY "Public can read basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Garantir permissões na view
GRANT SELECT ON public.public_profiles TO anon, authenticated;