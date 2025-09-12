-- Users demo
INSERT INTO users (firebase_uid, email, name, role)
VALUES ('uid_demo_manager','gestor@okutuala.test','Gestor','admin')
ON CONFLICT DO NOTHING;

INSERT INTO users (firebase_uid, email, name, role)
VALUES ('uid_demo_seller','vendedor@okutuala.test','Vendedor Demo','seller')
ON CONFLICT DO NOTHING;

INSERT INTO users (firebase_uid, email, name, role)
VALUES ('uid_demo_customer','cliente@okutuala.test','Cliente Demo','customer')
ON CONFLICT DO NOTHING;

-- Loja demo (status = approved para ficar ativa)
INSERT INTO stores (owner_id, name, slug, status)
VALUES (
  (SELECT id FROM users WHERE firebase_uid='uid_demo_seller'),
  'Loja Demo',
  'loja-demo',
  'approved'
) ON CONFLICT DO NOTHING;
