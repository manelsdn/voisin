delete from public.commentaires where id not like '%\_%';

drop policy commentaires_creation on public.commentaires;
drop policy commentaires_modification on public.commentaires;

create policy commentaires_creation on public.commentaires for insert to authenticated
with check (
    data->>'auteurId' = (select auth.uid())::text
    and id = (data->>'jeuneId') || '_' || (select auth.uid())::text
    and (data->>'note')::int between 1 and 5
    and length(coalesce(data->>'texte', '')) <= 300
);

create policy commentaires_modification on public.commentaires for update to authenticated
using (data->>'auteurId' = (select auth.uid())::text)
with check (
    data->>'auteurId' = (select auth.uid())::text
    and id = (data->>'jeuneId') || '_' || (select auth.uid())::text
    and (data->>'note')::int between 1 and 5
    and length(coalesce(data->>'texte', '')) <= 300
);
