create extension if not exists vector;

create table content_sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  url text not null,
  embedding vector(1536)
); 