-- Create seller_reviews table for rating sellers
CREATE TABLE public.seller_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, buyer_id)
);

-- Enable RLS
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view seller reviews"
ON public.seller_reviews
FOR SELECT
USING (true);

CREATE POLICY "Buyers can create reviews for their orders"
ON public.seller_reviews
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own reviews"
ON public.seller_reviews
FOR UPDATE
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.seller_reviews
FOR DELETE
USING (auth.uid() = buyer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_seller_reviews_updated_at
BEFORE UPDATE ON public.seller_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add seller rating columns to profiles for caching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_reviews_count INTEGER DEFAULT 0;