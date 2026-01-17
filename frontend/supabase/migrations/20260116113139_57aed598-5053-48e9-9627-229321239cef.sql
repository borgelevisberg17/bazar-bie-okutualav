-- PROBLEMA: A política USING(true) expõe dados bancários na tabela profiles
-- SOLUÇÃO: Remover essa política e usar apenas a view sem security_invoker

-- 1. Remover a política problemática que expõe todos os campos
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- 2. Recriar a view SEM security_invoker 
-- Views sem security_invoker usam as permissões do owner (superuser),
-- permitindo acesso aos campos selecionados sem expor a tabela base
DROP VIEW IF EXISTS public.public_profiles;

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

-- 3. Garantir permissões apenas na VIEW (não na tabela base)
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Verificar que as políticas corretas existem na tabela profiles:
-- - Users can view own profile (existe)
-- - Users can update their own profile (existe)
-- - Admins can view all profiles (existe)
-- Não precisa de política pública - a view cuida disso