-- Week 8: the prompt chain tool. Steps keep a unique (chain_id, position), so a
-- reorder is done in one transaction by a function: park every position below
-- zero, then write the new order. Superadmin only, checked inside.

create or replace function public.reorder_steps(p_chain bigint, p_ids bigint[])
returns void
language plpgsql security definer set search_path = public
as $$
declare i int;
begin
  if not (public.is_superadmin() or auth.role() = 'service_role') then raise exception 'superadmin only'; end if;
  if (select count(*) from public.prompt_chain_steps where chain_id = p_chain) <> coalesce(array_length(p_ids, 1), 0)
     or exists (select 1 from unnest(p_ids) u(id) where not exists (select 1 from public.prompt_chain_steps s where s.id = u.id and s.chain_id = p_chain)) then
    raise exception 'the order must name every step of this chain exactly once';
  end if;
  update public.prompt_chain_steps set position = -position where chain_id = p_chain;
  for i in 1 .. array_length(p_ids, 1) loop
    update public.prompt_chain_steps set position = i where id = p_ids[i];
  end loop;
end $$;
grant execute on function public.reorder_steps(bigint, bigint[]) to authenticated;

-- a chain may take an image as its input as well as a setup line
alter table public.generations add column if not exists image_url text;

notify pgrst, 'reload schema';
