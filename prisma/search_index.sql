-- Create GIN index on searchVector using expression
CREATE INDEX IF NOT EXISTS posts_search_vector_gin_idx ON posts USING GIN (to_tsvector('portuguese', COALESCE("searchVector", '')));

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_post_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector on insert/update
DROP TRIGGER IF EXISTS posts_search_vector_update ON posts;
CREATE TRIGGER posts_search_vector_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Backfill existing posts
UPDATE posts SET "searchVector" = 
  setweight(to_tsvector('portuguese', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(content, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(array_to_string(tags, ' '), '')), 'B');