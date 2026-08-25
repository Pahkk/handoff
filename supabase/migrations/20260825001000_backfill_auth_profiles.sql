-- Accounts created before the Opryn product schema did not pass through the
-- profile synchronization trigger. Backfill them before any organization or
-- membership foreign key references public.profiles.
insert into public.profiles (id, full_name, email, avatar_url)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  coalesce(users.email, ''),
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do update
set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  email = excluded.email,
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

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
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
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

  insert into public.profiles (id, full_name, email, avatar_url)
  select
    users.id,
    coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
    coalesce(users.email, ''),
    users.raw_user_meta_data ->> 'avatar_url'
  from auth.users as users
  where users.id = auth.uid()
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Unable to synchronize the signed-in account';
  end if;

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

  insert into public.profiles (id, full_name, email, avatar_url)
  select
    users.id,
    coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
    coalesce(users.email, ''),
    users.raw_user_meta_data ->> 'avatar_url'
  from auth.users as users
  where users.id = auth.uid()
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

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
