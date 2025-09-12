-- Índices para performance

-- Produtos: busca rápida por loja e status
CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status);

-- Pedidos: histórico por usuário
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Mensagens: inbox rápida
CREATE INDEX IF NOT EXISTS idx_messages_to_read ON messages(to_user_id, read);

-- Avaliações: acesso rápido por produto
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Logs: filtro rápido por actor
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_id, created_at DESC);