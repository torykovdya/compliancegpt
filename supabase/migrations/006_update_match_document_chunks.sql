-- Update match_document_chunks to support widget_key-based search
-- This allows the embeddable widget to search documents without user auth

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_user_id uuid default null,
  match_threshold float default 0.3,
  match_count int default 5,
  match_widget_key uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where
    (
      -- Widget search: match documents by widget_key (no user restriction)
      (match_widget_key is not null and d.widget_key = match_widget_key)
      -- OR user search: match documents by user_id (existing behavior)
      or (match_widget_key is null and match_user_id is not null and d.user_id = match_user_id)
    )
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
