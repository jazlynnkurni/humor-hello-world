-- Week 2: jokes table, readable by anyone with the anon key.
create table if not exists public.jokes (
  id bigint generated always as identity primary key,
  setup text not null,
  punchline text not null,
  rating int not null default 3 check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.jokes enable row level security;

drop policy if exists "Public can read jokes" on public.jokes;
create policy "Public can read jokes"
  on public.jokes for select
  to anon, authenticated
  using (true);

insert into public.jokes (setup, punchline, rating) values
  ('Why do programmers prefer dark mode?', 'Because light attracts bugs.', 5),
  ('I told my computer I needed a break.', 'It said "No problem, I''ll go to sleep."', 4),
  ('Why did the developer go broke?', 'Because they used up all their cache.', 4),
  ('How many programmers does it take to change a light bulb?', 'None. That''s a hardware problem.', 3),
  ('Why was the JavaScript developer sad?', 'They didn''t Node how to Express themselves.', 3),
  ('What''s a database''s favorite dance?', 'The row-tation.', 2),
  ('I would tell you a UDP joke.', 'But you might not get it.', 5),
  ('Why did the Next.js app go to therapy?', 'Too many unresolved dependencies.', 4);
