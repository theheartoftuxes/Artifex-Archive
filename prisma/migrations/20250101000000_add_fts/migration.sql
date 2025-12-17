-- Create the generated column for full-text search with optimal weighting
-- Weight A (highest) for title, B for description, C for aiModelUsed, D (lowest) for promptSummary
ALTER TABLE "media_items" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce("aiModelUsed", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("promptSummary", '')), 'D')
) STORED;

-- Create GIST index for faster full-text searches
CREATE INDEX "media_items_searchVector_idx" ON "media_items" USING GIST ("searchVector");

