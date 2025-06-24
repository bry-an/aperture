create index on content_sources using ivfflat (embedding vector_cosine_ops)
  with (lists = 100); 