create or replace function public.controler_demande()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    moi text := (select auth.uid())::text;
    avant text := old.data->>'statut';
    apres text := new.data->>'statut';
begin
    if current_user <> 'authenticated' then
        return new;
    end if;
    if new.data->>'jeuneId' is distinct from old.data->>'jeuneId'
        or new.data->>'demandeurId' is distinct from old.data->>'demandeurId'
        or new.data->>'beneficiaireId' is distinct from old.data->>'beneficiaireId' then
        raise exception 'Modification non autorisée.';
    end if;
    if avant = apres then
        raise exception 'Modification non autorisée.';
    end if;
    if avant = 'ENVOYEE' and apres in ('ACCEPTEE', 'REFUSEE') and old.data->>'jeuneId' = moi then
        return new;
    end if;
    if avant = 'ENVOYEE' and apres = 'ANNULEE' and old.data->>'demandeurId' = moi then
        return new;
    end if;
    if avant = 'ACCEPTEE' and apres = 'TERMINEE' and old.data->>'jeuneId' = moi then
        return new;
    end if;
    raise exception 'Changement de statut non autorisé.';
end;
$$;

create trigger demandes_controle before update on public.demandes
for each row execute function public.controler_demande();

create policy demandes_fin on public.demandes for update to authenticated
using (data->>'statut' = 'ACCEPTEE' and data->>'jeuneId' = (select auth.uid())::text)
with check (data->>'statut' = 'TERMINEE' and data->>'jeuneId' = (select auth.uid())::text);

create table public.avis (
    id text primary key,
    data jsonb not null,
    cree_le timestamptz not null default now()
);

create index avis_jeune on public.avis ((data->>'jeuneId'));

alter table public.avis enable row level security;

grant select, insert on public.avis to authenticated;
grant select, insert, update, delete on public.avis to service_role;

create policy avis_lecture on public.avis for select to authenticated using (true);

create policy avis_creation on public.avis for insert to authenticated
with check (
    data->>'auteurId' = (select auth.uid())::text
    and (data->>'note')::int between 1 and 5
    and length(coalesce(data->>'commentaire', '')) <= 200
    and exists (
        select 1 from public.demandes d
        where d.id = avis.id
          and d.data->>'statut' = 'TERMINEE'
          and d.data->>'demandeurId' = (select auth.uid())::text
          and d.data->>'jeuneId' = avis.data->>'jeuneId'
    )
);

drop policy messages_envoi on public.messages;

create policy messages_envoi on public.messages for insert to authenticated
with check (
    data->>'de' = (select auth.uid())::text
    and (
        length(coalesce(data->>'texte', '')) between 1 and 500
        or (coalesce(data->>'texte', '') = '' and coalesce(data->>'audio', '') like 'https://%')
    )
);

update storage.buckets
set file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/heic', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg']
where id = 'photos';

create policy fichiers_ajout on storage.objects for insert to authenticated
with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in ('demandes', 'messages')
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy fichiers_lecture on storage.objects for select to authenticated
using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in ('demandes', 'messages')
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy fichiers_remplacement on storage.objects for update to authenticated
using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in ('demandes', 'messages')
    and (storage.foldername(name))[2] = (select auth.uid())::text
);
