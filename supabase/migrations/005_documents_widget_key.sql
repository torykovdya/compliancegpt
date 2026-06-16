alter table public.documents
  add column if not exists widget_key uuid;

create index if not exists documents_widget_key_idx
  on public.documents(widget_key);
