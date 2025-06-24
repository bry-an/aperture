create or replace function match_sources(
  query_embedding vector,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  url text,
  similarity float
)
language sql
as $$
  select
    cs.id,
    cs.name,
    cs.description,
    cs.url,
    1 - (cs.embedding <=> query_embedding) as similarity
  from content_sources cs
  where cs.embedding <=> query_embedding < match_threshold
  order by cs.embedding <=> query_embedding
  limit match_count;
$$; 