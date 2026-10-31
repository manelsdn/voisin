drop policy users_lecture on public.users;

create policy users_lecture on public.users for select to authenticated
using (id = (select auth.uid())::text or data->>'accompagnantId' = (select auth.uid())::text);

revoke select on public.users from anon;
