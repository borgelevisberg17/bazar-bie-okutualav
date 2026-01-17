-- 1. Criar view segura para perfis públicos (substituir a existente)
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

-- 2. Remover política antiga que permite leitura pública total
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. Criar política que permite:
-- - Usuário ver todos os dados do próprio perfil
-- - Outros usuários verem apenas campos públicos (forçar uso da view)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Criar política para admins verem todos os perfis (incluindo dados bancários)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Atualizar políticas do platform_settings
-- Remover política antiga que permite leitura pública
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;

-- 6. Criar política para dados públicos do platform_settings (apenas algumas chaves)
CREATE POLICY "Public can view non-sensitive settings"
ON public.platform_settings
FOR SELECT
USING (
  key IN ('platform_fees', 'support_email', 'support_whatsapp', 'contact_info')
);

-- 7. Criar política para dados de checkout (usuários autenticados podem ver bank_details)
CREATE POLICY "Authenticated users can view bank details for checkout"
ON public.platform_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND key = 'bank_details'
);

-- 8. Criar política para admins verem tudo no platform_settings
CREATE POLICY "Admins can view all platform settings"
ON public.platform_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));