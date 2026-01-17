-- Fix security definer view issue
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles WITH (security_invoker=true) AS
SELECT id, full_name, avatar_url, bio, username, location
FROM profiles;