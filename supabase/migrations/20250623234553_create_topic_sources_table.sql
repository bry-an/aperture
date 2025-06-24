create table topic_sources (
  topic_id uuid references topics(id) on delete cascade,
  source_id uuid references content_sources(id) on delete cascade,
  primary key (topic_id, source_id)
); 