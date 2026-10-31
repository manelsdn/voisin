create or replace function public.profils_filtres(p_ids text[] default null, p_champ text default null, p_valeur text default null)
returns table (id text, data jsonb)
language sql
stable
security definer
set search_path = ''
as $$
    with moi as (select (select auth.uid())::text as uid)
    select
        u.id,
        case
            when m.uid is null then '{}'::jsonb
            when u.id = m.uid
                or u.data->>'accompagnantId' = m.uid
                or exists (
                    select 1 from public.demandes d
                    where d.data->>'statut' in ('ACCEPTEE', 'TERMINEE')
                      and (
                          (d.data->>'jeuneId' = m.uid and u.id in (d.data->>'demandeurId', d.data->>'beneficiaireId'))
                          or (d.data->>'demandeurId' = m.uid and u.id = d.data->>'jeuneId')
                      )
                )
            then u.data
            else (
                (case when jsonb_typeof(u.data->'email') = 'string' then u.data - 'email' else u.data end)
                - 'telephone' - 'adresse' - 'codePostal' - 'favoris' - 'charteAccepteeAt' - 'roleChangeAt'
            ) || jsonb_build_object(
                'latitude', round((u.data->>'latitude')::numeric, 3),
                'longitude', round((u.data->>'longitude')::numeric, 3)
            )
        end
    from public.users u, moi m
    where (p_ids is null or u.id = any (p_ids))
      and (p_champ is null or u.data->>p_champ = p_valeur)
      and (p_ids is not null or p_champ in ('email', 'role', 'accompagnantId'))
      and (m.uid is not null or p_champ = 'email')
$$;

revoke all on function public.profils_filtres(text[], text, text) from public;
grant execute on function public.profils_filtres(text[], text, text) to anon, authenticated, service_role;
