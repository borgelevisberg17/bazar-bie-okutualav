-- Create legal_pages table for editable legal content
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pages
INSERT INTO public.legal_pages (slug, title, content) VALUES
('terms', 'Termos de Uso', ''),
('privacy', 'Política de Privacidade', ''),
('help', 'Ajuda', '');

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read legal pages
CREATE POLICY "Anyone can read legal pages"
ON public.legal_pages
FOR SELECT
USING (true);

-- Only admins can update legal pages (using has_role function with correct argument order)
CREATE POLICY "Admins can update legal pages"
ON public.legal_pages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_legal_pages_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();