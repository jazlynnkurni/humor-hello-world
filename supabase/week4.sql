-- Week 4: members generate punchlines with AI and everyone signed in votes on them.
-- RLS on everything, as strict as the app allows.

-- A generation is one call to the model: the setup, the exact prompt sent, the model, the day.
create table if not exists public.generations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  setup text not null,
  prompt text not null,
  model text not null,
  day date not null default ((now() at time zone 'America/New_York')::date),
  created_at timestamptz not null default now()
);
create index if not exists generations_day_idx on public.generations (day desc);

-- The candidates the model returned for that generation.
create table if not exists public.candidates (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  punchline text not null,
  created_at timestamptz not null default now()
);
create index if not exists candidates_generation_idx on public.candidates (generation_id);

-- One vote per member per candidate. Voting again flips or removes it.
create table if not exists public.votes (
  candidate_id bigint not null references public.candidates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (candidate_id, user_id)
);

alter table public.generations enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Generations are public" on public.generations;
create policy "Generations are public" on public.generations for select using (true);
drop policy if exists "Members generate as themselves" on public.generations;
create policy "Members generate as themselves" on public.generations
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members delete own generations" on public.generations;
create policy "Members delete own generations" on public.generations
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Candidates are public" on public.candidates;
create policy "Candidates are public" on public.candidates for select using (true);
drop policy if exists "Candidates belong to own generation" on public.candidates;
create policy "Candidates belong to own generation" on public.candidates
  for insert to authenticated
  with check (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()));

drop policy if exists "Votes are public" on public.votes;
create policy "Votes are public" on public.votes for select using (true);
drop policy if exists "Members vote as themselves" on public.votes;
create policy "Members vote as themselves" on public.votes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members change own vote" on public.votes;
create policy "Members change own vote" on public.votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Members take own vote back" on public.votes;
create policy "Members take own vote back" on public.votes
  for delete to authenticated using (user_id = auth.uid());

-- Make sure every table has RLS on (the earlier ones already do; this is belt and braces).
alter table public.profiles enable row level security;
alter table public.jokes enable row level security;
alter table public.laughs enable row level security;

notify pgrst, 'reload schema';
