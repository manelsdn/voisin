create table public.besoins (
    id text primary key,
    data jsonb not null,
    cree_le timestamptz not null default now()
);

create table public.propositions (
    id text primary key,
    data jsonb not null,
    cree_le timestamptz not null default now()
);

create index besoins_statut on public.besoins ((data->>'statut'));
create index besoins_auteur on public.besoins ((data->>'auteurId'));
create index propositions_besoin on public.propositions ((data->>'besoinId'));

alter table public.besoins enable row level security;
alter table public.propositions enable row level security;

grant select, insert, update on public.besoins to authenticated;
grant select, insert on public.propositions to authenticated;
grant select, insert, update, delete on public.besoins, public.propositions to service_role;

create policy besoins_lecture on public.besoins for select to authenticated
using (data->>'statut' = 'OUVERTE' or data->>'auteurId' = (select auth.uid())::text or data->>'jeuneId' = (select auth.uid())::text);

create policy besoins_creation on public.besoins for insert to authenticated
with check (
    data->>'auteurId' = (select auth.uid())::text
    and data->>'statut' = 'OUVERTE'
    and length(coalesce(data->>'description', '')) between 1 and 300
    and not (data ? 'adresse') and not (data ? 'telephone')
);

create policy besoins_modification on public.besoins for update to authenticated
using (data->>'auteurId' = (select auth.uid())::text)
with check (data->>'auteurId' = (select auth.uid())::text and data->>'statut' in ('OUVERTE', 'POURVUE', 'FERMEE'));

create policy propositions_lecture on public.propositions for select to authenticated
using (data->>'jeuneId' = (select auth.uid())::text or data->>'auteurId' = (select auth.uid())::text);

create policy propositions_creation on public.propositions for insert to authenticated
with check (
    data->>'jeuneId' = (select auth.uid())::text
    and id = (data->>'besoinId') || '_' || (select auth.uid())::text
    and length(coalesce(data->>'message', '')) between 1 and 300
    and exists (select 1 from public.users u where u.id = (select auth.uid())::text and u.data->>'role' = 'JEUNE')
    and exists (
        select 1 from public.besoins b
        where b.id = propositions.data->>'besoinId'
          and b.data->>'statut' = 'OUVERTE'
          and b.data->>'auteurId' = propositions.data->>'auteurId'
    )
);
