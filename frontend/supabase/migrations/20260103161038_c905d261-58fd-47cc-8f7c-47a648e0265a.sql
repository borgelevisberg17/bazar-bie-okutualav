-- =============================================
-- FASE 1: SISTEMA DE ASSINATURAS PARA VENDEDORES
-- =============================================

-- Enum para planos de assinatura
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- Tabela de assinaturas de vendedores
CREATE TABLE public.seller_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    price_paid DECIMAL(10, 2) DEFAULT 0,
    products_limit INTEGER NOT NULL DEFAULT 0,
    products_used INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    features JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para assinaturas
ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.seller_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.seller_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
ON public.seller_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FASE 2: CARRINHO DE COMPRAS PERSISTENTE
-- =============================================

CREATE TABLE public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
ON public.cart_items FOR ALL
USING (auth.uid() = user_id);

-- =============================================
-- FASE 3: SISTEMA DE PEDIDOS
-- =============================================

-- Enum para status de pedido
CREATE TYPE public.order_status AS ENUM (
    'pending_payment',
    'payment_analysis', 
    'payment_approved',
    'payment_rejected',
    'processing',
    'shipped',
    'delivered',
    'confirmed_received',
    'paid_to_seller',
    'cancelled',
    'refunded'
);

-- Tabela de pedidos
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    status order_status NOT NULL DEFAULT 'pending_payment',
    subtotal DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    seller_amount DECIMAL(12, 2) NOT NULL,
    
    -- Dados de pagamento
    payment_receipt_url TEXT,
    payment_notes TEXT,
    payment_submitted_at TIMESTAMP WITH TIME ZONE,
    payment_approved_at TIMESTAMP WITH TIME ZONE,
    payment_rejected_at TIMESTAMP WITH TIME ZONE,
    payment_rejection_reason TEXT,
    
    -- Dados de envio
    shipping_address JSONB,
    tracking_code TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    received_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Liberação para vendedor
    seller_paid_at TIMESTAMP WITH TIME ZONE,
    seller_paid_amount DECIMAL(12, 2),
    
    -- Expiração automática
    payment_deadline TIMESTAMP WITH TIME ZONE,
    confirmation_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    buyer_notes TEXT,
    seller_notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_title TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para pedidos
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their products"
ON public.orders FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders"
ON public.orders FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Order items viewable by order participants"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
);

CREATE POLICY "Order items insertable by buyer"
ON public.order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.buyer_id = auth.uid()
    )
);

-- =============================================
-- FASE 4: LOG DE AÇÕES (AUDITORIA)
-- =============================================

CREATE TABLE public.order_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_status order_status,
    new_status order_status,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order logs viewable by participants"
ON public.order_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_logs.order_id 
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
);

CREATE POLICY "Order logs insertable"
ON public.order_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FASE 5: CONFIGURAÇÕES DA PLATAFORMA
-- =============================================

CREATE TABLE public.platform_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Inserir dados bancários fictícios
INSERT INTO public.platform_settings (key, value, description) VALUES
('bank_details', '{
    "iban": "AO06 0000 0000 0000 0000 0000 1",
    "multicaixa_express": "923456789",
    "account_holder": "Bié Okutuala LDA",
    "bank_name": "Banco Angolano de Investimentos (BAI)",
    "swift_bic": "BAAIAOPP"
}', 'Dados bancários da plataforma para transferências'),
('platform_fees', '{
    "percentage": 5,
    "min_amount": 100
}', 'Taxas da plataforma sobre vendas'),
('payment_deadlines', '{
    "payment_hours": 48,
    "confirmation_days": 15
}', 'Prazos para pagamento e confirmação');

-- =============================================
-- FASE 6: AVALIAÇÕES DE PRODUTOS
-- =============================================

CREATE TABLE public.product_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, user_id)
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON public.product_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- FASE 7: ATUALIZAR PERFIS COM CAMPOS DE VENDEDOR
-- =============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_iban TEXT,
ADD COLUMN IF NOT EXISTS bank_multicaixa TEXT,
ADD COLUMN IF NOT EXISTS bank_holder_name TEXT;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_seller_subscriptions_user_id ON public.seller_subscriptions(user_id);
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);

-- =============================================
-- FUNÇÃO PARA GERAR NÚMERO DE PEDIDO
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'BO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$;

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_subscriptions_updated_at
BEFORE UPDATE ON public.seller_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();