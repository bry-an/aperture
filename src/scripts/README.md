# Database Scripts

This directory contains utility scripts for managing the Aperture database.

## Scripts

### `seed-content-sources.ts`

Seeds the `content_sources` table with data from `resources/content_sources.csv`.

**Features:**
- Reads content sources from CSV file
- Generates embeddings for each source using the format: `${name}. ${description} (${url})`
- Inserts all sources with their embeddings into the database
- Sets the `type` field to 'rss' for all current sources
- Provides detailed logging of the seeding process

**Usage:**
```bash
npm run seed:content-sources
```

### `verify-content-sources.ts`

Verifies that content sources were properly seeded in the database.

**Features:**
- Fetches all content sources from the database
- Displays source details including name, URL, type, description, and embedding status
- Orders results alphabetically by name

**Usage:**
```bash
npm run verify:content-sources
```

## Database Schema

The `content_sources` table has the following structure:

- `id`: UUID primary key
- `name`: Text (required)
- `description`: Text (optional)
- `url`: Text (required)
- `type`: Enum ('rss', 'web', 'youtube', 'podcast') - defaults to 'rss'
- `embedding`: Vector(1536) (optional)

**Constraints:**
- Unique constraint on `(type, url)` combination to prevent duplicate sources

## CSV Format

The `resources/content_sources.csv` file should have the following columns:

- `name`: The name of the content source
- `url`: The RSS feed URL
- `description`: A brief description of the content source

Example:
```csv
name,url,description
The Medical Futurist,https://medicalfuturist.com/feed,Covers digital health and AI in medicine.
JAMA,https://jamanetwork.com/rss/site_1/0.xml,Highly regarded academic medical journal.
```

**Note:** Currently, all sources are treated as RSS feeds. Future versions may support different source types.

## Environment Requirements

Make sure you have the following environment variables set:
- `OPENAI_API_KEY`: For generating embeddings
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Notes

- The seeding script will generate embeddings for all content sources in a single batch for efficiency
- If you need to re-seed, you may want to clear the existing data first
- The verification script is useful for confirming successful seeding and debugging issues
- The unique constraint on `(type, url)` prevents duplicate sources of the same type 