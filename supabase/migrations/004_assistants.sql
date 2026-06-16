-- Assistants: AI assistant configuration with widget support
-- Each assistant belongs to a user and can have an embeddable widget

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'ComplianceGPT',
  welcome_message text default 'Hi! I am your AI Compliance Assistant. Ask me about your company policies, procedures, or compliance guidelines.',
  theme_color text default '#3b82f6',
  widget_key uuid unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists assistants_user_id_idx on public.assistants(user_id);
create index if not exists assistants_widget_key_idx on public.assistants(widget_key);

-- RLS
alter table public.assistants enable row level security;

-- Users can view their own assistants
create policy "Users view own assistants"
  on public.assistants for select to authenticated
  using (auth.uid() = user_id);

-- Users can create assistants
create policy "Users create assistants"
  on public.assistants for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own assistants
create policy "Users update own assistants"
  on public.assistants for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users can delete their own assistants
create policy "Users delete own assistants"
  on public.assistants for delete to authenticated
  using (auth.uid() = user_id);

-- Service role has full access (for widget reads)
grant all on public.assistants to service_role;
grant select, insert, update, delete on public.assistants to authenticated;

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assistants_updated_at
  before update on public.assistants
  for each row execute function public.handle_updated_at();
