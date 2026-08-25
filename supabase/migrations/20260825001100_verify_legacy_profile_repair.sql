-- Reproduce the legacy-account condition that caused onboarding to fail, then
-- prove create_organization repairs it before inserting foreign-keyed data.
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '10000000-0000-4000-8000-000000000010',
  'legacy-profile-test@opryn.invalid',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{"full_name":"Legacy Profile Test"}'::jsonb,
  now(),
  now()
);

delete from public.profiles where id = '10000000-0000-4000-8000-000000000010';

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000010', true);
set role authenticated;
select public.create_organization('Legacy Repair Test', 'Testing', 1, 'Owner');
set role postgres;

do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '10000000-0000-4000-8000-000000000010'
  ) then
    raise exception 'Legacy profile repair regression: profile was not restored';
  end if;
  if not exists (
    select 1 from public.organizations
    where created_by = '10000000-0000-4000-8000-000000000010'
  ) then
    raise exception 'Legacy profile repair regression: organization was not created';
  end if;
end;
$$;

delete from public.organizations
where created_by = '10000000-0000-4000-8000-000000000010';
delete from auth.users
where id = '10000000-0000-4000-8000-000000000010';
