
-- Add theme_preference to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light';

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlists
CREATE POLICY "Users can view own wishlists" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public wishlists" ON public.wishlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own wishlists" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlists" ON public.wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlists" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for wishlist_items
CREATE POLICY "Users can view own wishlist items" ON public.wishlist_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid()));
CREATE POLICY "Users can view public wishlist items" ON public.wishlist_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.is_public = true));
CREATE POLICY "Users can insert own wishlist items" ON public.wishlist_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid()));
CREATE POLICY "Users can delete own wishlist items" ON public.wishlist_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid()));

-- Create product_views table for analytics
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewer_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT
);

-- Enable RLS for product_views
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_views
CREATE POLICY "Anyone can insert product views" ON public.product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Product owners can view their product views" ON public.product_views FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_views.product_id AND products.user_id = auth.uid()));

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := substr(md5(random()::text), 1, 8);
    SELECT EXISTS(SELECT 1 FROM public.wishlists WHERE share_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate share code for public wishlists
CREATE OR REPLACE FUNCTION auto_generate_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND (NEW.share_code IS NULL OR NEW.share_code = '') THEN
    NEW.share_code := generate_share_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_auto_share_code
  BEFORE INSERT OR UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_share_code();

-- Trigger to update updated_at
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
