-- Recreate public_profiles view with security_invoker = true to avoid security definer issues
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    username,
    avatar_url,
    bio,
    location,
    website,
    followers_count,
    following_count
FROM public.profiles;