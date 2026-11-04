create table if not exists public.likes (
    id text primary key,
    data jsonb not null default '{}'::jsonb
);

alter table public.likes enable row level security;

create policy likes_lecture on public.likes for select to authenticated using (true);

create policy likes_creation on public.likes for insert to authenticated
with check (
    data->>'userId' = (select auth.uid())::text
    and id = (data->>'jeuneId') || '_' || (select auth.uid())::text
);

create policy likes_modification on public.likes for update to authenticated
using (data->>'userId' = (select auth.uid())::text)
with check (
    data->>'userId' = (select auth.uid())::text
    and id = (data->>'jeuneId') || '_' || (select auth.uid())::text
);
