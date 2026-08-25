create table public.organization_discovery (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  business_description text not null check (char_length(business_description) between 1 and 5000),
  repeated_work text not null check (char_length(repeated_work) between 1 and 5000),
  hardest_to_handoff text not null check (char_length(hardest_to_handoff) between 1 and 5000),
  common_questions text not null default '' check (char_length(common_questions) <= 5000),
  owner_goal text not null default '' check (char_length(owner_goal) <= 2000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.process_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  reason text not null check (char_length(reason) between 1 and 2000),
  suggested_prompt text not null check (char_length(suggested_prompt) between 1 and 5000),
  priority integer not null check (priority between 1 and 10),
  status text not null default 'recommended' check (status in ('recommended', 'started', 'dismissed')),
  process_id uuid,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, title),
  constraint recommendation_process_same_org
    foreign key (process_id, organization_id)
    references public.processes(id, organization_id)
    on delete set null (process_id)
);

create index process_recommendations_org_priority_idx
  on public.process_recommendations(organization_id, status, priority);

create trigger organization_discovery_updated
  before update on public.organization_discovery
  for each row execute function public.set_updated_at();
create trigger process_recommendations_updated
  before update on public.process_recommendations
  for each row execute function public.set_updated_at();

alter table public.organization_discovery enable row level security;
alter table public.process_recommendations enable row level security;

create policy discovery_admin_read on public.organization_discovery
  for select to authenticated using (public.is_org_admin(organization_id));
create policy discovery_admin_all on public.organization_discovery
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy recommendations_read on public.process_recommendations
  for select to authenticated using (public.is_org_member(organization_id));
create policy recommendations_admin_all on public.process_recommendations
  for all to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

grant select, insert, update, delete on public.organization_discovery to authenticated;
grant select, insert, update, delete on public.process_recommendations to authenticated;

comment on table public.organization_discovery is
  'Owner-provided business context used to personalize the Opryn starting plan.';
comment on table public.process_recommendations is
  'Organization-scoped processes Opryn recommends the owner capture next.';
