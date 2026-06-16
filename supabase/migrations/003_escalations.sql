-- Escalations: Human Escalation button
-- Users can escalate AI responses to compliance team for human review

create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid, -- reference to the message that was escalated (optional)
  question text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Indexes
create index if not exists escalations_user_id_idx on public.escalations(user_id);
create index if not exists escalations_status_idx on public.escalations(status);

-- RLS
alter table public.escalations enable row level security;

-- Users can view their own escalations
create policy "Users view own escalations"
  on public.escalations for select to authenticated
  using (auth.uid() = user_id);

-- Users can create escalations
create policy "Users create escalations"
  on public.escalations for insert to authenticated
  with check (auth.uid() = user_id);

-- Service role has full access (for admin review)
grant all on public.escalations to service_role;
grant select, insert on public.escalations to authenticated;
