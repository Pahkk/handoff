create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

create type public.member_permission as enum ('owner', 'admin', 'employee');
create type public.process_status as enum ('draft', 'needs_review', 'approved');
create type public.rule_status as enum ('draft', 'approved', 'rejected');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.question_status as enum ('answered', 'needs_owner', 'resolved', 'dismissed');
create type public.training_status as enum ('assigned', 'started', 'completed');
create type public.media_status as enum ('uploaded', 'transcribing', 'extracting', 'ready', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  industry text not null check (char_length(industry) between 1 and 100),
  employee_count integer not null check (employee_count between 0 and 100000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  responsibilities jsonb not null default '{"every_morning":[],"every_customer":[],"requires_approval":[]}'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_level public.member_permission not null default 'employee',
  role_id uuid references public.roles(id) on delete set null,
  owner_role text,
  joined_at timestamptz not null default now(),
  last_active_at timestamptz,
  unique (organization_id, user_id)
);

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  employees_can_ask boolean not null default true,
  allow_escalations boolean not null default true,
  confidence_threshold real not null default 0.72 check (confidence_threshold between 0.5 and 0.95),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  role_id uuid references public.roles(id) on delete set null,
  permission_level public.member_permission not null default 'employee',
  token_hash text not null unique,
  status public.invite_status not null default 'pending',
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 3000),
  summary text not null default '' check (char_length(summary) <= 5000),
  purpose text not null default '' check (char_length(purpose) <= 5000),
  status public.process_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.process_steps (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  title text not null check (char_length(title) between 1 and 300),
  description text not null default '' check (char_length(description) <= 10000),
  unique (process_id, step_order)
);

create table public.process_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid references public.processes(id) on delete cascade,
  title text not null default 'Company rule' check (char_length(title) between 1 and 200),
  text text not null check (char_length(text) between 1 and 10000),
  status public.rule_status not null default 'draft',
  confidence real check (confidence is null or confidence between 0 and 1),
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.process_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.process_role_assignments (
  process_id uuid not null references public.processes(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (process_id, role_id)
);

create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text,
  original_name text not null check (char_length(original_name) between 1 and 500),
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0 and size_bytes <= 524288000),
  status public.media_status not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  media_upload_id uuid references public.media_uploads(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  transcript_text text not null,
  segments jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.clarification_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 2000),
  answer text,
  suggested_rule text,
  status text not null default 'open' check (status in ('open', 'answered', 'approved', 'ignored')),
  answered_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 20000),
  embedding extensions.vector(1536),
  source_type text not null check (source_type in ('process_summary', 'process_step', 'rule', 'exception', 'owner_answer', 'role_instruction')),
  source_id uuid not null,
  process_id uuid references public.processes(id) on delete cascade,
  rule_id uuid references public.process_rules(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asked_by uuid not null references public.profiles(id),
  question text not null check (char_length(question) between 1 and 4000),
  status public.question_status not null,
  answered_by_opryn boolean not null default false,
  escalated boolean not null default false,
  related_process_id uuid references public.processes(id) on delete set null,
  relevance_score real,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question_id uuid not null references public.employee_questions(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 10000),
  answered_by uuid references public.profiles(id),
  answer_type text not null check (answer_type in ('opryn', 'owner')),
  proposed_rule text,
  approved_as_knowledge boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.question_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question_id uuid not null references public.employee_questions(id) on delete cascade,
  knowledge_chunk_id uuid not null references public.knowledge_chunks(id) on delete cascade,
  similarity real,
  created_at timestamptz not null default now(),
  unique (question_id, knowledge_chunk_id)
);

create table public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  status public.training_status not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, process_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null check (char_length(title) between 1 and 250),
  body text not null default '' check (char_length(body) <= 4000),
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members(user_id, organization_id);
create index process_org_status_idx on public.processes(organization_id, status, updated_at desc);
create index process_steps_process_idx on public.process_steps(process_id, step_order);
create index rules_org_status_idx on public.process_rules(organization_id, status);
create index questions_org_status_idx on public.employee_questions(organization_id, status, created_at desc);
create index knowledge_org_approved_idx on public.knowledge_chunks(organization_id, approved);
create index knowledge_embedding_idx on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);
create index training_user_idx on public.training_assignments(organization_id, user_id, status);
create index notifications_user_idx on public.notifications(user_id, read, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_updated before update on public.organizations for each row execute function public.set_updated_at();
create trigger roles_updated before update on public.roles for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.organization_settings for each row execute function public.set_updated_at();
create trigger processes_updated before update on public.processes for each row execute function public.set_updated_at();
create trigger rules_updated before update on public.process_rules for each row execute function public.set_updated_at();
create trigger media_updated before update on public.media_uploads for each row execute function public.set_updated_at();
create trigger clarifications_updated before update on public.clarification_questions for each row execute function public.set_updated_at();
create trigger knowledge_updated before update on public.knowledge_chunks for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org
      and user_id = (select auth.uid())
      and permission_level in ('owner', 'admin')
  );
$$;

create or replace function public.create_organization(
  business_name text,
  business_industry text,
  business_employee_count integer,
  owner_job_title text default 'Owner'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare new_org_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(business_name), '') is null then raise exception 'Business name is required'; end if;
  if nullif(trim(business_industry), '') is null then raise exception 'Industry is required'; end if;
  if business_employee_count < 0 or business_employee_count > 100000 then raise exception 'Invalid employee count'; end if;

  insert into public.organizations (name, industry, employee_count, created_by)
  values (trim(business_name), trim(business_industry), business_employee_count, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, permission_level, owner_role)
  values (new_org_id, auth.uid(), 'owner', nullif(trim(owner_job_title), ''));
  insert into public.organization_settings (organization_id) values (new_org_id);
  return new_org_id;
end;
$$;

create or replace function public.accept_organization_invite(raw_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare matching_invite public.organization_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into matching_invite
  from public.organization_invites
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and status = 'pending'
  for update;

  if not found or matching_invite.expires_at <= now() then raise exception 'Invite is invalid or expired'; end if;
  if lower(matching_invite.email) <> lower(coalesce((select email from auth.users where id = auth.uid()), '')) then
    raise exception 'Sign in with the email address that was invited';
  end if;

  insert into public.organization_members (organization_id, user_id, permission_level, role_id)
  values (matching_invite.organization_id, auth.uid(), matching_invite.permission_level, matching_invite.role_id)
  on conflict (organization_id, user_id) do update
    set permission_level = excluded.permission_level, role_id = excluded.role_id;

  update public.organization_invites
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = matching_invite.id;
  return matching_invite.organization_id;
end;
$$;

create or replace function public.match_knowledge(
  target_organization_id uuid,
  query_embedding extensions.vector(1536),
  target_role_id uuid default null,
  match_threshold real default 0.72,
  match_count integer default 8
)
returns table (
  id uuid, content text, source_type text, source_id uuid, process_id uuid,
  rule_id uuid, role_id uuid, similarity real
)
language sql stable security invoker set search_path = ''
as $$
  select k.id, k.content, k.source_type, k.source_id, k.process_id, k.rule_id, k.role_id,
    (1 - (k.embedding operator(extensions.<=>) query_embedding))::real as similarity
  from public.knowledge_chunks k
  where k.organization_id = target_organization_id
    and public.is_org_member(target_organization_id)
    and k.approved = true
    and k.embedding is not null
    and (k.role_id is null or k.role_id = target_role_id or public.is_org_admin(target_organization_id))
    and 1 - (k.embedding operator(extensions.<=>) query_embedding) >= match_threshold
  order by k.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.create_organization(text, text, integer, text) from public;
revoke all on function public.accept_organization_invite(text) from public;
revoke all on function public.match_knowledge(uuid, extensions.vector, uuid, real, integer) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.create_organization(text, text, integer, text) to authenticated;
grant execute on function public.accept_organization_invite(text) to authenticated;
grant execute on function public.match_knowledge(uuid, extensions.vector, uuid, real, integer) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_invites enable row level security;
alter table public.roles enable row level security;
alter table public.processes enable row level security;
alter table public.process_steps enable row level security;
alter table public.process_rules enable row level security;
alter table public.process_exceptions enable row level security;
alter table public.process_role_assignments enable row level security;
alter table public.media_uploads enable row level security;
alter table public.transcripts enable row level security;
alter table public.clarification_questions enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.employee_questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_sources enable row level security;
alter table public.training_assignments enable row level security;
alter table public.notifications enable row level security;

create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or exists (
  select 1 from public.organization_members mine
  join public.organization_members theirs on theirs.organization_id = mine.organization_id
  where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_read on public.organizations for select to authenticated using (public.is_org_member(id));
create policy organizations_admin_update on public.organizations for update to authenticated
using (public.is_org_admin(id)) with check (public.is_org_admin(id));
create policy organizations_owner_delete on public.organizations for delete to authenticated
using (exists (select 1 from public.organization_members where organization_id = id and user_id = (select auth.uid()) and permission_level = 'owner'));

create policy members_read on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy members_admin_insert on public.organization_members for insert to authenticated with check (public.is_org_admin(organization_id));
create policy members_admin_update on public.organization_members for update to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy members_admin_delete on public.organization_members for delete to authenticated
using (public.is_org_admin(organization_id) and permission_level <> 'owner');

create policy settings_read on public.organization_settings for select to authenticated using (public.is_org_member(organization_id));
create policy settings_admin_update on public.organization_settings for update to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy invites_admin_all on public.organization_invites for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy roles_read on public.roles for select to authenticated using (public.is_org_member(organization_id));
create policy roles_admin_all on public.roles for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy processes_read on public.processes for select to authenticated
using (public.is_org_admin(organization_id) or (
  public.is_org_member(organization_id) and status = 'approved' and (
    not exists (select 1 from public.process_role_assignments pra where pra.process_id = processes.id)
    or exists (
      select 1 from public.process_role_assignments pra
      join public.organization_members om on om.role_id = pra.role_id
      where pra.process_id = processes.id and om.user_id = (select auth.uid()) and om.organization_id = processes.organization_id
    )
  )
));
create policy processes_admin_all on public.processes for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy steps_read on public.process_steps for select to authenticated
using (exists (select 1 from public.processes p where p.id = process_id));
create policy steps_admin_all on public.process_steps for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy rules_read on public.process_rules for select to authenticated
using (public.is_org_admin(organization_id) or (public.is_org_member(organization_id) and status = 'approved'));
create policy rules_admin_all on public.process_rules for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy exceptions_read on public.process_exceptions for select to authenticated
using (exists (select 1 from public.processes p where p.id = process_id));
create policy exceptions_admin_all on public.process_exceptions for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy assignments_read on public.process_role_assignments for select to authenticated using (public.is_org_member(organization_id));
create policy assignments_admin_all on public.process_role_assignments for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy media_read on public.media_uploads for select to authenticated using (public.is_org_member(organization_id));
create policy media_admin_all on public.media_uploads for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy transcripts_admin_read on public.transcripts for select to authenticated using (public.is_org_admin(organization_id));
create policy transcripts_admin_all on public.transcripts for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy clarifications_admin_all on public.clarification_questions for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy knowledge_read on public.knowledge_chunks for select to authenticated
using (approved and public.is_org_member(organization_id) and (
  role_id is null or public.is_org_admin(organization_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = knowledge_chunks.organization_id and om.user_id = (select auth.uid()) and om.role_id = knowledge_chunks.role_id
  )
));
create policy knowledge_admin_all on public.knowledge_chunks for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy questions_read on public.employee_questions for select to authenticated
using (public.is_org_admin(organization_id) or (public.is_org_member(organization_id) and asked_by = (select auth.uid())));
create policy questions_member_insert on public.employee_questions for insert to authenticated
with check (public.is_org_member(organization_id) and asked_by = (select auth.uid()));
create policy questions_admin_update on public.employee_questions for update to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

create policy answers_read on public.question_answers for select to authenticated
using (public.is_org_admin(organization_id) or exists (
  select 1 from public.employee_questions q where q.id = question_id and q.asked_by = (select auth.uid())
));
create policy answers_admin_all on public.question_answers for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy answers_opryn_insert on public.question_answers for insert to authenticated
with check (public.is_org_member(organization_id) and answer_type = 'opryn' and answered_by is null and exists (
  select 1 from public.employee_questions q where q.id = question_id and q.asked_by = (select auth.uid())
));

create policy sources_read on public.question_sources for select to authenticated
using (public.is_org_admin(organization_id) or exists (
  select 1 from public.employee_questions q where q.id = question_id and q.asked_by = (select auth.uid())
));
create policy sources_member_insert on public.question_sources for insert to authenticated
with check (public.is_org_member(organization_id) and exists (
  select 1 from public.employee_questions q where q.id = question_id and q.asked_by = (select auth.uid())
));

create policy training_read on public.training_assignments for select to authenticated
using (public.is_org_admin(organization_id) or user_id = (select auth.uid()));
create policy training_admin_all on public.training_assignments for all to authenticated
using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy training_employee_update on public.training_assignments for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy notifications_read on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_admin_insert on public.notifications for insert to authenticated
with check (public.is_org_admin(organization_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'process-media', 'process-media', false, 524288000,
  array['video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a','audio/webm','audio/ogg']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy process_media_read on storage.objects for select to authenticated
using (bucket_id = 'process-media' and public.is_org_member((storage.foldername(name))[1]::uuid));
create policy process_media_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'process-media' and public.is_org_admin((storage.foldername(name))[1]::uuid));
create policy process_media_admin_update on storage.objects for update to authenticated
using (bucket_id = 'process-media' and public.is_org_admin((storage.foldername(name))[1]::uuid));
create policy process_media_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'process-media' and public.is_org_admin((storage.foldername(name))[1]::uuid));

grant select, update on public.profiles to authenticated;
grant select, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, update on public.organization_settings to authenticated;
grant select, insert, update, delete on public.organization_invites to authenticated;
grant select, insert, update, delete on public.roles to authenticated;
grant select, insert, update, delete on public.processes to authenticated;
grant select, insert, update, delete on public.process_steps to authenticated;
grant select, insert, update, delete on public.process_rules to authenticated;
grant select, insert, update, delete on public.process_exceptions to authenticated;
grant select, insert, update, delete on public.process_role_assignments to authenticated;
grant select, insert, update, delete on public.media_uploads to authenticated;
grant select, insert, update, delete on public.transcripts to authenticated;
grant select, insert, update, delete on public.clarification_questions to authenticated;
grant select, insert, update, delete on public.knowledge_chunks to authenticated;
grant select, insert, update on public.employee_questions to authenticated;
grant select, insert, update on public.question_answers to authenticated;
grant select, insert on public.question_sources to authenticated;
grant select, insert, update, delete on public.training_assignments to authenticated;
grant select, insert, update on public.notifications to authenticated;

comment on table public.knowledge_chunks is 'Approved, organization-isolated units used to answer company-specific questions.';
comment on function public.match_knowledge is 'Retrieves approved knowledge only within the signed-in member organization and role.';
