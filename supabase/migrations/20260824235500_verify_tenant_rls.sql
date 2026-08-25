-- Executable security assertions. This migration leaves no seed data and a
-- fresh setup fails immediately if tenant isolation regresses.
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'rls-owner-a@opryn.invalid', 'authenticated', 'authenticated', '{}'::jsonb, '{"full_name":"RLS Owner A"}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'rls-owner-b@opryn.invalid', 'authenticated', 'authenticated', '{}'::jsonb, '{"full_name":"RLS Owner B"}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'rls-admin-a@opryn.invalid', 'authenticated', 'authenticated', '{}'::jsonb, '{"full_name":"RLS Admin A"}'::jsonb, now(), now());

insert into public.organizations (id, name, industry, employee_count, created_by)
values
  ('20000000-0000-4000-8000-000000000001', 'RLS Company A', 'Testing', 2, '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'RLS Company B', 'Testing', 1, '10000000-0000-4000-8000-000000000002');
insert into public.organization_members (organization_id, user_id, permission_level)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'owner'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'admin');
insert into public.organization_settings (organization_id)
values ('20000000-0000-4000-8000-000000000001'), ('20000000-0000-4000-8000-000000000002');
insert into public.processes (organization_id, title, status, created_by)
values
  ('20000000-0000-4000-8000-000000000001', 'Company A process', 'approved', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Company B process', 'approved', '10000000-0000-4000-8000-000000000002');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set role authenticated;
do $$
declare visible_count integer; blocked boolean := false;
begin
  select count(*) into visible_count from public.processes
  where organization_id = '20000000-0000-4000-8000-000000000002';
  if visible_count <> 0 then raise exception 'RLS regression: Company A can read Company B processes'; end if;
  begin
    insert into public.processes (organization_id, title, created_by)
    values ('20000000-0000-4000-8000-000000000002', 'Cross-tenant write', '10000000-0000-4000-8000-000000000001');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'RLS regression: Company A can write Company B processes'; end if;
end;
$$;
set role postgres;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set role authenticated;
do $$
declare blocked boolean := false;
begin
  begin
    update public.organization_members set permission_level = 'owner'
    where organization_id = '20000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000003';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'RLS regression: admin can promote itself to owner'; end if;
end;
$$;
set role postgres;

delete from public.organizations where id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');
delete from auth.users where id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003');
