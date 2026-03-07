create table if not exists records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  amount integer not null default 0,
  category text not null default '其他',
  created_at timestamptz default now()
);

alter table records enable row level security;

create policy "Users can manage their own records"
  on records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
