-- Add photos_limit column to seller_subscriptions table
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS photos_limit integer NOT NULL DEFAULT 1;

-- Add is_featured column to products for VIP sellers
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Add subscription_payment_receipt_url column to seller_subscriptions for payment verification
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_notes text;
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_submitted_at timestamp with time zone;
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_approved_at timestamp with time zone;
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_rejected_at timestamp with time zone;
ALTER TABLE public.seller_subscriptions ADD COLUMN IF NOT EXISTS payment_rejection_reason text;

-- Update existing subscription records to have proper photo limits based on plan
UPDATE public.seller_subscriptions SET photos_limit = 1 WHERE plan = 'basic' AND photos_limit = 0;
UPDATE public.seller_subscriptions SET photos_limit = 5 WHERE plan = 'pro';
UPDATE public.seller_subscriptions SET photos_limit = 10 WHERE plan = 'enterprise';