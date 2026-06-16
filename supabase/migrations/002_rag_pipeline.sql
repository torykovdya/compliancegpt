-- RAG Pipeline: document_chunks table with pgvector
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

-- Enable pgvector extension (if not already enabled)
create extension if not exists vector;

-- Document chunks table
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536) not null
);

-- Vector search index (IVFFlat for cosine similarity)
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for fast lookup by document
create index if not exists document_chunks_document_id_idx
  on public.document_chunks(document_id);

-- Vector search function
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float default 0.3,
  match_count int default 5
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
  where d.user_id = match_user_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Grant permissions
grant select, insert, delete on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;
alter table public.document_chunks enable row level security;
create policy "Users manage own chunks"
  on public.document_chunks for all to authenticated
  using (
    document_id in (
      select id from public.documents where user_id = auth.uid()
    )
  );
