-- Week 6: the admin area. A superadmin flag on profiles, a helper that reads it,
-- and policies that let superadmins read everyone and manage the AI media.

alter table public.profiles add column if not exists is_superadmin boolean not null default false;

-- security definer so the check does not itself trip the profiles policy
create or replace function public.is_superadmin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select is_superadmin from public.profiles where id = auth.uid()), false) $$;
grant execute on function public.is_superadmin() to authenticated;

-- profiles: superadmins read every row (members still read only their own)
drop policy if exists "Superadmins read all profiles" on public.profiles;
create policy "Superadmins read all profiles" on public.profiles
  for select to authenticated using (public.is_superadmin());

-- AI media: superadmins may insert, update and delete any generation and candidate
drop policy if exists "Superadmins manage generations" on public.generations;
create policy "Superadmins manage generations" on public.generations
  for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "Superadmins manage candidates" on public.candidates;
create policy "Superadmins manage candidates" on public.candidates
  for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- votes and laughs are already readable by everyone; superadmins may also remove abuse
drop policy if exists "Superadmins delete votes" on public.votes;
create policy "Superadmins delete votes" on public.votes
  for delete to authenticated using (public.is_superadmin());

-- the lock-out answer: the first superadmin is set here, by hand, with the database
-- connection the dashboard gives the project owner. The app cannot grant it to anyone.
update public.profiles set is_superadmin = true where email = 'jazkurnz06@gmail.com';

notify pgrst, 'reload schema';
