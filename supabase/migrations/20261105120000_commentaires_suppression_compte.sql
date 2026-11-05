create table if not exists public.commentaires (
    id text primary key,
    data jsonb not null default '{}'::jsonb,
    cree_le timestamptz not null default now()
);

create index if not exists commentaires_jeune_idx on public.commentaires ((data->>'jeuneId'));

alter table public.commentaires enable row level security;

grant select, insert, update, delete on public.commentaires to authenticated;

create policy commentaires_lecture on public.commentaires for select to authenticated using (true);

create policy commentaires_creation on public.commentaires for insert to authenticated
with check (
    data->>'auteurId' = (select auth.uid())::text
    and length(coalesce(data->>'texte', '')) between 1 and 300
);

create policy commentaires_modification on public.commentaires for update to authenticated
using (data->>'auteurId' = (select auth.uid())::text)
with check (
    data->>'auteurId' = (select auth.uid())::text
    and length(coalesce(data->>'texte', '')) between 1 and 300
);

create policy commentaires_suppression on public.commentaires for delete to authenticated
using (data->>'auteurId' = (select auth.uid())::text);

create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    moi text := (select auth.uid())::text;
    proches text[];
begin
    if moi is null then
        raise exception 'Non connecté';
    end if;
    select coalesce(array_agg(id), '{}') into proches from public.users where data->>'accompagnantId' = moi;
    delete from public.commentaires where data->>'auteurId' = moi or data->>'jeuneId' = moi;
    delete from public.likes where data->>'userId' = moi or data->>'jeuneId' = moi;
    delete from public.propositions where data->>'auteurId' = moi or data->>'jeuneId' = moi;
    delete from public.besoins where data->>'auteurId' = moi or data->>'beneficiaireId' = any(proches);
    delete from public.avis where data->>'auteurId' = moi or data->>'jeuneId' = moi;
    delete from public.rendez_vous where data->>'jeuneId' = moi or data->>'demandeurId' = moi;
    delete from public.demandes where data->>'jeuneId' = moi or data->>'demandeurId' = moi;
    delete from public.messages where data->>'de' = moi or data->>'a' = moi;
    delete from public.users where id = moi or id = any(proches);
    delete from auth.users where id = moi::uuid;
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;

create policy photos_suppression on storage.objects for delete to authenticated
using (bucket_id = 'photos' and name = 'profil/' || (select auth.uid())::text);
