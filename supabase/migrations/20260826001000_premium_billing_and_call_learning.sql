create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'core' check (plan in ('core', 'premium')),
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create table public.call_privacy_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  acknowledged_by uuid not null references public.profiles(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (organization_id, acknowledged_by)
);

create table public.call_recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 200),
  call_type text not null default 'customer' check (call_type in ('customer', 'sales', 'team', 'other')),
  storage_path text not null check (char_length(storage_path) between 1 and 1000),
  original_name text not null check (char_length(original_name) between 1 and 500),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  status text not null default 'uploaded' check (status in ('uploaded', 'extracting_audio', 'transcribing', 'analyzing', 'needs_review', 'approved', 'failed')),
  transcript_text text,
  transcription_model text,
  analysis_model text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.call_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.call_recordings(id) on delete cascade,
  finding_type text not null check (finding_type in ('customer_question', 'sales_objection', 'successful_response', 'company_rule', 'process', 'exception', 'training_example', 'repeated_answer')),
  title text not null check (char_length(title) between 1 and 250),
  content text not null check (char_length(content) between 1 and 10000),
  evidence text not null default '' check (char_length(evidence) <= 4000),
  confidence real check (confidence is null or confidence between 0 and 1),
  status text not null default 'observed' check (status in ('observed', 'approved', 'ignored', 'unknown')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  knowledge_chunk_id uuid references public.knowledge_chunks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.video_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  media_upload_id uuid not null unique references public.media_uploads(id) on delete cascade,
  frame_count integer not null default 0 check (frame_count between 0 and 12),
  observations jsonb not null default '[]'::jsonb,
  analysis_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_chunks drop constraint if exists knowledge_chunks_source_type_check;
alter table public.knowledge_chunks add constraint knowledge_chunks_source_type_check
  check (source_type in ('process_summary', 'process_step', 'rule', 'exception', 'owner_answer', 'role_instruction', 'call_finding'));

create index subscriptions_customer_idx on public.organization_subscriptions(stripe_customer_id);
create index calls_org_created_idx on public.call_recordings(organization_id, created_at desc);
create index call_findings_org_status_idx on public.call_findings(organization_id, status, finding_type);

create trigger subscriptions_updated before update on public.organization_subscriptions
  for each row execute function public.set_updated_at();
create trigger calls_updated before update on public.call_recordings
  for each row execute function public.set_updated_at();
create trigger call_findings_updated before update on public.call_findings
  for each row execute function public.set_updated_at();
create trigger video_analyses_updated before update on public.video_analyses
  for each row execute function public.set_updated_at();

create or replace function public.create_default_subscription()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.organization_subscriptions (organization_id, plan, status)
  values (new.id, 'core', 'active')
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

create trigger organization_default_subscription
  after insert on public.organizations
  for each row execute function public.create_default_subscription();

insert into public.organization_subscriptions (organization_id, plan, status)
select id, 'core', 'active' from public.organizations
on conflict (organization_id) do nothing;

alter table public.organization_subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.call_privacy_acknowledgments enable row level security;
alter table public.call_recordings enable row level security;
alter table public.call_findings enable row level security;
alter table public.video_analyses enable row level security;

create policy subscriptions_member_read on public.organization_subscriptions
  for select to authenticated using (public.is_org_member(organization_id));

create policy call_privacy_admin_all on public.call_privacy_acknowledgments
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id) and acknowledged_by = (select auth.uid()));

create policy calls_admin_all on public.call_recordings
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id) and uploaded_by = (select auth.uid()));

create policy call_findings_admin_all on public.call_findings
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy video_analyses_admin_all on public.video_analyses
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings', 'call-recordings', false, 104857600,
  array['video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a','audio/webm','audio/ogg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy call_recordings_storage_read on storage.objects for select to authenticated
  using (bucket_id = 'call-recordings' and public.is_org_admin((storage.foldername(name))[1]::uuid));
create policy call_recordings_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'call-recordings' and public.is_org_admin((storage.foldername(name))[1]::uuid));
create policy call_recordings_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'call-recordings' and public.is_org_admin((storage.foldername(name))[1]::uuid));
create policy call_recordings_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'call-recordings' and public.is_org_admin((storage.foldername(name))[1]::uuid));

grant select on public.organization_subscriptions to authenticated;
grant select, insert, update, delete on public.call_privacy_acknowledgments to authenticated;
grant select, insert, update, delete on public.call_recordings to authenticated;
grant select, insert, update, delete on public.call_findings to authenticated;
grant select, insert, update, delete on public.video_analyses to authenticated;

comment on table public.organization_subscriptions is 'Webhook-driven organization billing state. Browser redirects never grant feature access.';
comment on table public.call_findings is 'Redacted, owner-reviewable observations from authorized uploaded business calls.';
