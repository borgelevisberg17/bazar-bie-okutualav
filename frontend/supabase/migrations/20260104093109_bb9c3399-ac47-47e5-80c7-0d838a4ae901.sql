-- Add product extras/boosts table
CREATE TABLE public.product_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured_24h', 'featured_7d', 'extra_photo', 'top_boost')),
  price_paid NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_receipt_url TEXT,
  payment_submitted_at TIMESTAMP WITH TIME ZONE,
  payment_approved_at TIMESTAMP WITH TIME ZONE,
  payment_rejected_at TIMESTAMP WITH TIME ZONE,
  payment_rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own boosts" ON public.product_boosts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own boosts" ON public.product_boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boosts" ON public.product_boosts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all boosts" ON public.product_boosts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all boosts" ON public.product_boosts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add storefront fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storefront_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storefront_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storefront_banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storefront_theme TEXT DEFAULT 'default';

-- Trigger for updated_at
CREATE TRIGGER update_product_boosts_updated_at
  BEFORE UPDATE ON public.product_boosts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();