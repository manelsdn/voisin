alter publication supabase_realtime add table public.messages;

create or replace function public.marquer_lus(p_de text)
returns void
language sql
security definer
set search_path = ''
as $$
    update public.messages
    set data = data || jsonb_build_object('lu', true)
    where data->>'a' = (select auth.uid())::text
      and data->>'de' = p_de
      and coalesce(data->>'lu', '') <> 'true';
$$;

revoke all on function public.marquer_lus(text) from public, anon;
grant execute on function public.marquer_lus(text) to authenticated;
