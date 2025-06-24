-- Add unique constraint on type and url combination
ALTER TABLE content_sources
ADD CONSTRAINT unique_source_type_url UNIQUE (type, url);
