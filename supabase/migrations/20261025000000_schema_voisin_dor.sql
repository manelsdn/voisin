create table public.users (id text primary key, data jsonb not null default '{}'::jsonb, cree_le timestamptz not null default now());
create table public.demandes (id text primary key, data jsonb not null default '{}'::jsonb, cree_le timestamptz not null default now());
create table public.rendez_vous (id text primary key, data jsonb not null default '{}'::jsonb, cree_le timestamptz not null default now());
create table public.messages (id text primary key, data jsonb not null default '{}'::jsonb, cree_le timestamptz not null default now());

create index users_role_idx on public.users ((data->>'role'));
create index users_email_idx on public.users ((data->>'email'));
create index users_accompagnant_idx on public.users ((data->>'accompagnantId'));
create index demandes_demandeur_idx on public.demandes ((data->>'demandeurId'));
create index demandes_jeune_idx on public.demandes ((data->>'jeuneId'));
create index rdv_jeune_idx on public.rendez_vous ((data->>'jeuneId'));
create index rdv_demandeur_idx on public.rendez_vous ((data->>'demandeurId'));
create index messages_de_idx on public.messages ((data->>'de'));
create index messages_a_idx on public.messages ((data->>'a'));

alter table public.users enable row level security;
alter table public.demandes enable row level security;
alter table public.rendez_vous enable row level security;
alter table public.messages enable row level security;

grant select on public.users to anon;
grant select, insert, update, delete on public.users, public.demandes, public.rendez_vous, public.messages to authenticated;
grant select, insert, update, delete on public.users, public.demandes, public.rendez_vous, public.messages to service_role;

create policy users_lecture on public.users for select to anon, authenticated using (true);
create policy users_creation on public.users for insert to authenticated
  with check (id = (select auth.uid())::text or data->>'accompagnantId' = (select auth.uid())::text);
create policy users_modification on public.users for update to authenticated
  using (id = (select auth.uid())::text or data->>'accompagnantId' = (select auth.uid())::text)
  with check (id = (select auth.uid())::text or data->>'accompagnantId' = (select auth.uid())::text);

create policy demandes_lecture on public.demandes for select to authenticated
  using (data->>'demandeurId' = (select auth.uid())::text or data->>'jeuneId' = (select auth.uid())::text);
create policy demandes_creation on public.demandes for insert to authenticated
  with check (data->>'demandeurId' = (select auth.uid())::text and data->>'statut' = 'ENVOYEE');
create policy demandes_reponse on public.demandes for update to authenticated
  using (data->>'statut' = 'ENVOYEE' and (data->>'jeuneId' = (select auth.uid())::text or data->>'demandeurId' = (select auth.uid())::text))
  with check (
    (data->>'jeuneId' = (select auth.uid())::text and data->>'statut' in ('ACCEPTEE', 'REFUSEE'))
    or (data->>'demandeurId' = (select auth.uid())::text and data->>'statut' = 'ANNULEE')
  );

create policy rdv_lecture on public.rendez_vous for select to authenticated
  using (data->>'jeuneId' = (select auth.uid())::text or data->>'demandeurId' = (select auth.uid())::text);
create policy rdv_creation on public.rendez_vous for insert to authenticated
  with check (data->>'jeuneId' = (select auth.uid())::text);

create policy messages_lecture on public.messages for select to authenticated
  using (data->>'de' = (select auth.uid())::text or data->>'a' = (select auth.uid())::text);
create policy messages_envoi on public.messages for insert to authenticated
  with check (data->>'de' = (select auth.uid())::text and length(coalesce(data->>'texte', '')) between 1 and 500);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

create policy photos_ajout on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and name = 'profil/' || (select auth.uid())::text);
create policy photos_remplacement on storage.objects for update to authenticated
  using (bucket_id = 'photos' and name = 'profil/' || (select auth.uid())::text)
  with check (bucket_id = 'photos' and name = 'profil/' || (select auth.uid())::text);
create policy photos_lecture_proprio on storage.objects for select to authenticated
  using (bucket_id = 'photos' and name = 'profil/' || (select auth.uid())::text);
