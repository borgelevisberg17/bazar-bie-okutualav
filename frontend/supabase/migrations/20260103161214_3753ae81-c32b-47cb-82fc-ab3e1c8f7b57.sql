-- Criar bucket para comprovantes de pagamento (PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-receipts', 
    'payment-receipts', 
    false, 
    5242880, -- 5MB limit
    ARRAY['application/pdf']
);

-- Políticas de storage para comprovantes
CREATE POLICY "Users can upload own payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'payment-receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own payment receipts"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'payment-receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins podem ver todos os comprovantes (será implementado via service role)