create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  topic text not null,
  created_at timestamp with time zone default now(),
  unique (user_id, topic)
);
