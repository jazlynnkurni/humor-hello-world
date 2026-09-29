-- Redesign: members write their own jokes, and anyone signed in can laugh at one.

alter table public.jokes
  add column if not exists author_id uuid references public.profiles (id) on delete set null;

drop policy if exists "Members write jokes" on public.jokes;
create policy "Members write jokes" on public.jokes
  for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists "Members edit own jokes" on public.jokes;
create policy "Members edit own jokes" on public.jokes
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "Members delete own jokes" on public.jokes;
create policy "Members delete own jokes" on public.jokes
  for delete to authenticated
  using (author_id = auth.uid());

-- One laugh per person per joke.
create table if not exists public.laughs (
  joke_id bigint not null references public.jokes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (joke_id, user_id)
);
alter table public.laughs enable row level security;
drop policy if exists "Laughs are public" on public.laughs;
create policy "Laughs are public" on public.laughs for select using (true);
drop policy if exists "Members laugh" on public.laughs;
create policy "Members laugh" on public.laughs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members take a laugh back" on public.laughs;
create policy "Members take a laugh back" on public.laughs for delete to authenticated using (user_id = auth.uid());

-- Bylines without exposing emails: a view over profiles with only the public columns.
create or replace view public.authors as
  select id, first_name, last_name, avatar_url from public.profiles;
grant select on public.authors to anon, authenticated;

notify pgrst, 'reload schema';
