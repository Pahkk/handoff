create table public.question_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question_id uuid not null references public.employee_questions(id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 1000),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  original_name text not null default 'case-image',
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2621440),
  created_at timestamptz not null default now(),
  unique (question_id, storage_path)
);

alter table public.question_attachments
  add constraint question_attachments_question_same_org
  foreign key (question_id, organization_id)
  references public.employee_questions(id, organization_id)
  on delete cascade;

create index question_attachments_question_idx
  on public.question_attachments(organization_id, question_id);

alter table public.question_attachments enable row level security;

create policy question_attachments_read
  on public.question_attachments for select to authenticated
  using (
    public.is_org_admin(organization_id)
    or exists (
      select 1 from public.employee_questions q
      where q.id = question_id
        and q.organization_id = organization_id
        and q.asked_by = (select auth.uid())
    )
  );

create policy question_attachments_member_insert
  on public.question_attachments for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.employee_questions q
      where q.id = question_id
        and q.organization_id = organization_id
        and q.asked_by = (select auth.uid())
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ask-images',
  'ask-images',
  false,
  2621440,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy ask_images_read
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ask-images'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy ask_images_member_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ask-images'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy ask_images_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ask-images'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

grant select, insert on public.question_attachments to authenticated;

comment on table public.question_attachments is
  'Private organization-scoped images attached to employee questions for visual troubleshooting and owner escalation.';
