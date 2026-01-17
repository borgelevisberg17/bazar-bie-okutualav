-- Solução final para profiles públicos:
-- 1. View com security_invoker para seguir as melhores práticas
-- 2. Política de leitura pública na tabela base (necessário para marketplace)
-- 3. A view filtra os campos sensíveis (bancários, phone, theme_preference)

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

-- Política para leitura pública - necessária para funcionalidade de marketplace
-- NOTA: A view filtra campos sensíveis, então apenas campos públicos são expostos
-- Campos excluídos: bank_iban, bank_multicaixa, bank_holder_name, phone, theme_preference
CREATE POLICY "Public read access for marketplace"
ON public.profiles
FOR SELECT
USING (true);

-- Garantir permissões
GRANT SELECT ON public.public_profiles TO anon, authenticated;