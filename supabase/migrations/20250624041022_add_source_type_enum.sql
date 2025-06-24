-- Create source_type enum
CREATE TYPE source_type AS ENUM ('rss', 'web', 'youtube', 'podcast');

-- Add type column to content_sources table with default value
ALTER TABLE content_sources
ADD COLUMN type source_type NOT NULL DEFAULT 'rss';
