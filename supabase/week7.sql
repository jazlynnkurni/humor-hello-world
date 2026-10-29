-- Week 7: more observability. Everything the admin area reads or edits now lives
-- in tables: the model roster, the prompt chains the app picks from, the Columbia
-- vocabulary and the examples those prompts use, every raw model reply, who may
-- sign up, and the images uploaded through the admin.
--
-- Config tables are readable by everyone (they hold no secrets; a provider row
-- names an environment variable, never its value). Superadmins write them.
-- Raw replies, the signup lists and the image ledger are superadmin-only.

-- ---------------------------------------------------------------- providers + models
create table if not exists public.llm_providers (
  id bigint generated always as identity primary key,
  slug text not null unique,            -- "google", "openai"
  name text not null,                   -- "Google AI Studio"
  env_key text,                         -- which env var holds the key (its NAME, never its value)
  base_url text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.llm_models (
  id bigint generated always as identity primary key,
  provider_id bigint not null references public.llm_providers (id) on delete cascade,
  model_id text not null,               -- "gemini-3-flash-preview"
  label text,
  priority int not null default 100,    -- lower tries first
  timeout_ms int not null default 12000,
  max_output_tokens int not null default 1200,
  temperature numeric(3,2) not null default 0.90,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (provider_id, model_id)
);

-- ---------------------------------------------------------------- prompt chains
-- A chain is an ordered list of steps; each step is one call to the model. The
-- mix is how traffic splits between enabled chains (weights, shown as percent).
create table if not exists public.prompt_chains (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  mix_weight int not null default 0 check (mix_weight >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id bigint generated always as identity primary key,
  chain_id bigint not null references public.prompt_chains (id) on delete cascade,
  position int not null,
  name text not null,
  template text not null,               -- {{setup}} {{terms}} {{banned}} {{examples}} {{previous}}
  created_at timestamptz not null default now(),
  unique (chain_id, position)
);

-- ---------------------------------------------------------------- vocabulary + examples
create table if not exists public.terms (
  id bigint generated always as identity primary key,
  term text not null,
  kind text not null default 'flavor' check (kind in ('flavor', 'banned')),
  note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_examples (
  id bigint generated always as identity primary key,
  setup text not null,
  punchline text not null,
  note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- raw replies
alter table public.generations add column if not exists chain_id bigint references public.prompt_chains (id) on delete set null;

create table if not exists public.llm_responses (
  id bigint generated always as identity primary key,
  generation_id bigint references public.generations (id) on delete cascade,
  chain_id bigint references public.prompt_chains (id) on delete set null,
  step_name text,
  provider text,
  model text not null,
  status text not null check (status in ('ok', 'error')),
  latency_ms int,
  prompt text,
  raw_text text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists llm_responses_generation_idx on public.llm_responses (generation_id);

-- ---------------------------------------------------------------- who may sign up
create table if not exists public.allowed_signup_domains (
  id bigint generated always as identity primary key,
  domain text not null unique,
  note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.whitelisted_emails (
  id bigint generated always as identity primary key,
  email text not null unique,
  note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- true when the lists are empty, when the address is listed, when its domain is
-- listed, or when the caller is already a superadmin. Security definer so the
-- lists themselves stay superadmin-only.
create or replace function public.signup_allowed(addr text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    coalesce((select is_superadmin from public.profiles where id = auth.uid()), false)
    or not exists (select 1 from public.allowed_signup_domains where enabled)
       and not exists (select 1 from public.whitelisted_emails where enabled)
    or exists (select 1 from public.whitelisted_emails where enabled and lower(email) = lower(addr))
    or exists (select 1 from public.allowed_signup_domains where enabled and lower(domain) = lower(split_part(addr, '@', 2)))
$$;
grant execute on function public.signup_allowed(text) to authenticated;

-- ---------------------------------------------------------------- images
create table if not exists public.images (
  id bigint generated always as identity primary key,
  bucket text not null default 'images',
  path text not null,
  url text not null,
  alt text,
  size_bytes int,
  content_type text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------- RLS
alter table public.llm_providers enable row level security;
alter table public.llm_models enable row level security;
alter table public.prompt_chains enable row level security;
alter table public.prompt_chain_steps enable row level security;
alter table public.terms enable row level security;
alter table public.generation_examples enable row level security;
alter table public.llm_responses enable row level security;
alter table public.allowed_signup_domains enable row level security;
alter table public.whitelisted_emails enable row level security;
alter table public.images enable row level security;

do $$
declare t text;
begin
  -- config: anyone reads, superadmins write
  foreach t in array array['llm_providers','llm_models','prompt_chains','prompt_chain_steps','terms','generation_examples','images'] loop
    execute format('drop policy if exists "Anyone reads %1$s" on public.%1$I', t);
    execute format('create policy "Anyone reads %1$s" on public.%1$I for select using (true)', t);
  end loop;
  -- superadmins do everything on every new table
  foreach t in array array['llm_providers','llm_models','prompt_chains','prompt_chain_steps','terms','generation_examples','llm_responses','allowed_signup_domains','whitelisted_emails','images'] loop
    execute format('drop policy if exists "Superadmins manage %1$s" on public.%1$I', t);
    execute format('create policy "Superadmins manage %1$s" on public.%1$I for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin())', t);
  end loop;
end $$;

-- a member may log the replies behind their own generation (never read them back)
drop policy if exists "Members log own responses" on public.llm_responses;
create policy "Members log own responses" on public.llm_responses
  for insert to authenticated
  with check (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()));

-- superadmins may also fix a profile (clear a removed avatar)
drop policy if exists "Superadmins update profiles" on public.profiles;
create policy "Superadmins update profiles" on public.profiles
  for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- storage: images bucket is public to read, superadmins write; superadmins may also remove avatars
drop policy if exists "Images are publicly readable" on storage.objects;
create policy "Images are publicly readable" on storage.objects for select using (bucket_id = 'images');
drop policy if exists "Superadmins manage image objects" on storage.objects;
create policy "Superadmins manage image objects" on storage.objects
  for all to authenticated
  using (bucket_id in ('images', 'avatars') and public.is_superadmin())
  with check (bucket_id in ('images', 'avatars') and public.is_superadmin());

-- ---------------------------------------------------------------- seeds (idempotent)
insert into public.llm_providers (slug, name, env_key, base_url, notes) values
  ('google', 'Google AI Studio', 'GOOGLE_GENERATIVE_AI_API_KEY', null, 'Gemini, called directly with the key in Vercel env. Leave base URL empty for the default endpoint.')
on conflict (slug) do nothing;

insert into public.llm_models (provider_id, model_id, label, priority, notes)
select p.id, m.model_id, m.label, m.priority, m.notes
from public.llm_providers p, (values
  ('gemini-3-flash-preview', 'Gemini 3 Flash (preview)', 10, 'First choice.'),
  ('gemini-3.5-flash', 'Gemini 3.5 Flash', 20, null),
  ('gemini-3.7-flash', 'Gemini 3.7 Flash', 30, null),
  ('gemini-3.6-flash', 'Gemini 3.6 Flash', 40, null),
  ('gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite', 50, 'Cheapest fallback.'),
  ('gemini-flash-latest', 'Gemini Flash (latest alias)', 60, 'Whatever Google points this at.')
) as m(model_id, label, priority, notes)
where p.slug = 'google'
on conflict (provider_id, model_id) do nothing;

insert into public.prompt_chains (name, description, mix_weight) values
  ('Straight to three', 'One call. The model writes three punchlines and returns them.', 100),
  ('Draft, then edit', 'Two calls. The model drafts six, then a second pass keeps the three sharpest and tightens them.', 0)
on conflict (name) do nothing;

insert into public.prompt_chain_steps (chain_id, position, name, template)
select c.id, s.position, s.name, s.template
from public.prompt_chains c, (values
  ('Straight to three', 1, 'Write', E'You write punchlines for Columbia Laughs, a humor site for Columbia University students in New York.\nThe reader is a junior, new to the city, living in the dorms, exploring on weekends, chronically online.\nThings they know: {{terms}}.\nNever mention: {{banned}}.\nExamples of the tone:\n{{examples}}\nSetup: "{{setup}}"\nWrite exactly 3 different punchlines about the setup.\nRules: each is a complete sentence that reads on its own, since it is shown as a card under the setup. Do not start mid-sentence. Each under 22 words. Specific to Columbia or New York. Dry, not corny. No hashtags, no emoji, no slurs, nothing cruel about a real person. PG-13.\nReturn ONLY a JSON array of 3 strings.'),
  ('Draft, then edit', 1, 'Draft', E'You write punchlines for Columbia Laughs, a humor site for Columbia University students in New York.\nThings they know: {{terms}}.\nNever mention: {{banned}}.\nExamples of the tone:\n{{examples}}\nSetup: "{{setup}}"\nWrite 6 different punchlines about the setup, each a complete sentence under 22 words, specific to Columbia or New York, dry, PG-13.\nReturn ONLY a JSON array of 6 strings.'),
  ('Draft, then edit', 2, 'Edit', E'You are the editor of Columbia Laughs.\nSetup: "{{setup}}"\nHere are six draft punchlines:\n{{previous}}\nKeep the three that land hardest. Tighten each so it reads on its own as a complete sentence under 20 words. Cut anything corny, anything cruel about a real person, and anything that mentions: {{banned}}.\nReturn ONLY a JSON array of 3 strings.')
) as s(chain, position, name, template)
where c.name = s.chain
on conflict (chain_id, position) do nothing;

insert into public.terms (term, kind, note)
select * from (values
  ('Butler Library', 'flavor', 'Where everyone pretends to study'),
  ('JJ''s Place', 'flavor', 'Late-night dining hall'),
  ('1020', 'flavor', 'The bar'),
  ('the Core', 'flavor', 'Core Curriculum'),
  ('Ferris', 'flavor', 'Ferris Booth dining hall'),
  ('Low Steps', 'flavor', 'The steps in front of Low Library'),
  ('Koronet', 'flavor', 'Giant pizza slices'),
  ('the 1 train', 'flavor', '116th Street station'),
  ('Lerner', 'flavor', 'Student centre with the ramps'),
  ('Hamilton Deli', 'flavor', 'Sandwich line at noon'),
  ('Barnard', 'flavor', 'Across Broadway'),
  ('NYU', 'flavor', 'Fair game, gently'),
  ('specific professors by name', 'banned', 'No real people'),
  ('suicide', 'banned', 'Not a joke'),
  ('sexual assault', 'banned', 'Not a joke')
) as v(term, kind, note)
where not exists (select 1 from public.terms);

insert into public.generation_examples (setup, punchline, note)
select * from (values
  ('The Butler elevator at 11:58pm', 'Everyone inside is going to the sixth floor to sit in the same chair they left at dinner.', 'Dry, specific, complete sentence'),
  ('A freshman asks where the gym is', 'Dodge is under the ground because that is where cardio belongs at this school.', 'Campus geography as the joke'),
  ('Koronet at 2am', 'The slice is bigger than my dorm and has a better view of Broadway.', 'New York scale')
) as v(setup, punchline, note)
where not exists (select 1 from public.generation_examples);

insert into public.allowed_signup_domains (domain, note) values
  ('columbia.edu', 'Students and staff'),
  ('barnard.edu', 'Barnard'),
  ('gmail.com', 'Open while the class tests the app. Disable to go Columbia-only.')
on conflict (domain) do nothing;

insert into public.whitelisted_emails (email, note) values
  ('jazkurnz06@gmail.com', 'Owner')
on conflict (email) do nothing;

notify pgrst, 'reload schema';
