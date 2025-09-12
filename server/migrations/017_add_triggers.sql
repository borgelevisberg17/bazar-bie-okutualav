-- Trigger para atualizar campo de busca em products

CREATE FUNCTION products_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_document :=
    to_tsvector('simple', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON products;

CREATE TRIGGER tsvectorupdate
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_update();