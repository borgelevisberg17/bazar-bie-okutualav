

-- Categorias demo
INSERT INTO categories (name,slug) VALUES ('Geral','geral') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Moda','moda') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Casa','casa') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Tecnologia','tecnologia') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Alimentação','alimentacao') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Beleza','beleza') ON CONFLICT DO NOTHING;

-- Produtos demo
INSERT INTO products (store_id, name, slug, description, price, currency, stock, images, category_id)
VALUES (
  (SELECT id FROM stores WHERE slug='loja-demo'),
  'Camiseta Okutuala', 'camiseta-okutuala',
  'Camiseta confortável do Bié',
  2500.00, 'AOA', 30,
  '[{"url":"/assets/images/placeholders/camiseta.png","alt":"Camiseta"}]',
  (SELECT id FROM categories WHERE slug='moda')
) ON CONFLICT DO NOTHING;

INSERT INTO products (store_id, name, slug, description, price, currency, stock, images, category_id)
VALUES (
  (SELECT id FROM stores WHERE slug='loja-demo'),
  'Smartphone Demo X', 'smartphone-demo-x',
  'Smartphone moderno com excelente performance',
  150000.00, 'AOA', 10,
  '[{"url":"/assets/images/placeholders/smartphone.png","alt":"Smartphone"}]',
  (SELECT id FROM categories WHERE slug='tecnologia')
) ON CONFLICT DO NOTHING;

INSERT INTO products (store_id, name, slug, description, price, currency, stock, images, category_id)
VALUES (
  (SELECT id FROM stores WHERE slug='loja-demo'),
  'Mesa de Madeira', 'mesa-madeira',
  'Mesa robusta para sala de jantar',
  45000.00, 'AOA', 5,
  '[{"url":"/assets/images/placeholders/mesa.png","alt":"Mesa"}]',
  (SELECT id FROM categories WHERE slug='casa')
) ON CONFLICT DO NOTHING;

INSERT INTO products (store_id, name, slug, description, price, currency, stock, images, category_id)
VALUES (
  (SELECT id FROM stores WHERE slug='loja-demo'),
  'Kit de Maquiagem', 'kit-maquiagem',
  'Kit completo de maquiagem profissional',
  12000.00, 'AOA', 20,
  '[{"url":"/assets/images/placeholders/maquiagem.png","alt":"Kit Maquiagem"}]',
  (SELECT id FROM categories WHERE slug='beleza')
) ON CONFLICT DO NOTHING;

INSERT INTO products (store_id, name, slug, description, price, currency, stock, images, category_id)
VALUES (
  (SELECT id FROM stores WHERE slug='loja-demo'),
  'Pacote de Café Bié', 'cafe-bie',
  'Café tradicional cultivado no Bié',
  2500.00, 'AOA', 50,
  '[{"url":"/assets/images/placeholders/cafe.png","alt":"Café"}]',
  (SELECT id FROM categories WHERE slug='alimentacao')
) ON CONFLICT DO NOTHING;
