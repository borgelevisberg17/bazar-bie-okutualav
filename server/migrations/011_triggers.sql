-- 011_triggers.sql
-- update timestamp function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: set updated_at on many tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_timestamp') THEN
    CREATE TRIGGER users_set_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stores_set_timestamp') THEN
    CREATE TRIGGER stores_set_timestamp BEFORE UPDATE ON stores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_set_timestamp') THEN
    CREATE TRIGGER products_set_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_timestamp') THEN
    CREATE TRIGGER orders_set_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END$$;

-- Full text search: update tsvector column on products
CREATE OR REPLACE FUNCTION products_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_document := to_tsvector('portuguese', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_search_vector') THEN
    CREATE TRIGGER products_search_vector BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE products_tsv_trigger();
  END IF;
END$$;

-- Notify channel for external indexer (meilisearch)
CREATE OR REPLACE FUNCTION notify_meili() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload = json_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', NEW.id);
  PERFORM pg_notify('meili', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach notify trigger to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_notify_meili') THEN
    CREATE TRIGGER products_notify_meili AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE PROCEDURE notify_meili();
  END IF;
END$$;
