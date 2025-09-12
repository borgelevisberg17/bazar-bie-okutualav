-- 014_seed.sql
INSERT INTO users (firebase_uid, email, name, role) VALUES ('uid_demo_manager','gestor@okutuala.test','Gestor','manager') ON CONFLICT DO NOTHING;
INSERT INTO users (firebase_uid, email, name, role) VALUES ('uid_demo_seller','vendedor@okutuala.test','Vendedor Demo','seller') ON CONFLICT DO NOTHING;
INSERT INTO users (firebase_uid, email, name, role) VALUES ('uid_demo_customer','cliente@okutuala.test','Cliente Demo','customer') ON CONFLICT DO NOTHING;

INSERT INTO stores (owner_id, name, slug, status) VALUES (
 (SELECT id FROM users WHERE firebase_uid='uid_demo_seller'), 'Loja Demo', 'loja-demo', 'active') ON CONFLICT DO NOTHING;

INSERT INTO categories (name,slug) VALUES ('Moda','moda') ON CONFLICT DO NOTHING;
INSERT INTO categories (name,slug) VALUES ('Casa','casa') ON CONFLICT DO NOTHING;

-- sample product
INSERT INTO products (store_id, name, slug, description, price, currency, stock, images) VALUES (
 (SELECT id FROM stores WHERE slug='loja-demo'), 'Camiseta Okutuala', 'camiseta-okutuala', 'Camiseta confortável do Bié', 2500.00, 'AOA', 30, '[{"url":"/assets/images/placeholders/product.png","alt":"camiseta"}]'
) ON CONFLICT DO NOTHING;
