-- CORRIGIR: A política anterior expõe dados sensíveis
-- Remover a política que permite leitura pública de todos os campos

DROP POLICY IF EXISTS "Public can read profiles via secure view" ON public.profiles;

-- Recriar a view SEM security_invoker para permitir acesso público apenas aos campos selecionados
-- A view age como uma camada de segurança que filtra os campos sensíveis

DROP VIEW IF EXISTS public.public_profiles;

-- Criar view SEM security_invoker - ela filtra os campos e não aplica RLS
CREATE VIEW public.public_profiles AS
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

-- Garantir que a view está acessível publicamente
GRANT SELECT ON public.public_profiles TO anon, authenticated;