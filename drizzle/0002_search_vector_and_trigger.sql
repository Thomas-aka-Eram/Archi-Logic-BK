ALTER TABLE blocks ADD COLUMN search_vector tsvector;
UPDATE blocks SET search_vector = to_tsvector('english', coalesce(content,''));
CREATE INDEX blocks_search_gin_idx ON blocks USING GIN(search_vector);

CREATE OR REPLACE FUNCTION blocks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blocks_search_vector_update_trigger
BEFORE INSERT OR UPDATE ON blocks
FOR EACH ROW EXECUTE FUNCTION blocks_search_vector_update();

CREATE OR REPLACE FUNCTION update_blocks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.blocks_search_vector = to_tsvector('english', coalesce(NEW.content,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blocks_search_vector_update
BEFORE INSERT OR UPDATE ON blocks
FOR EACH ROW
EXECUTE FUNCTION update_blocks_search_vector();
