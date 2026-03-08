create table if not exists expenses (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  amount      integer     not null,
  category    text        not null,
  input_method text       check (input_method in ('text', 'voice', 'camera')),
  created_at  timestamptz default now(),
  user_id     uuid
);

alter table expenses enable row level security;

-- 尚未啟用帳號功能：允許所有人讀寫（user_id 為 null 時）
-- 之後加上帳號後可改為 auth.uid() = user_id
create policy "Allow all access for now"
  on expenses for all
  using (true)
  with check (true);
