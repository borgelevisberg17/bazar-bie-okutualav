-- Adicionar política para permitir leitura pública dos campos básicos do perfil
-- Isso permite que a view public_profiles funcione corretamente

-- Criar política que permite leitura pública de todos os perfis
-- (a view já filtra os campos sensíveis)
CREATE POLICY "Public can read profiles via secure view"
ON public.profiles
FOR SELECT
USING (true);