drop policy messages_envoi on public.messages;

create policy messages_envoi on public.messages for insert to authenticated
with check (
    data->>'de' = (select auth.uid())::text
    and length(coalesce(data->>'texte', '')) <= 500
    and (
        length(coalesce(data->>'texte', '')) >= 1
        or coalesce(data->>'audio', '') like 'https://%'
        or coalesce(data->'fichier'->>'url', '') like 'https://%'
    )
);

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
        'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'
    ]
where id = 'photos';
