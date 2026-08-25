-- Executable tenant-isolation assertions for onboarding discovery and recommendations.
-- All verification data is removed before this migration completes.
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000004', 'recommendation-owner-a@opryn.invalid', 'authenticated', 'authenticated', '{}'::jsonb, '{"full_name":"Recommendation Owner A"}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000005', 'recommendation-owner-b@opryn.invalid', 'authenticated', 'authenticated', '{}'::jsonb, '{"full_name":"Recommendation Owner B"}'::jsonb, now(), now());

insert into public.organizations (id, name, industry, employee_count, created_by)
values
  ('20000000-0000-4000-8000-000000000004', 'Recommendation Company A', 'Testing', 1, '10000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000005', 'Recommendation Company B', 'Testing', 1, '10000000-0000-4000-8000-000000000005');
insert into public.organization_members (organization_id, user_id, permission_level)
values
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'owner'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'owner');
insert into public.organization_discovery (
  organization_id, business_description, repeated_work, hardest_to_handoff, created_by
)
values
  ('20000000-0000-4000-8000-000000000004', 'Company A description', 'Company A work', 'Company A handoff', '10000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000005', 'Company B description', 'Company B work', 'Company B handoff', '10000000-0000-4000-8000-000000000005');
insert into public.process_recommendations (
  organization_id, title, reason, suggested_prompt, priority, created_by
)
values
  ('20000000-0000-4000-8000-000000000004', 'Company A recommendation', 'Company A reason', 'Company A prompt', 1, '10000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000005', 'Company B recommendation', 'Company B reason', 'Company B prompt', 1, '10000000-0000-4000-8000-000000000005');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set role authenticated;
do $$
declare visible_count integer; blocked boolean := false;
begin
  select count(*) into visible_count from public.organization_discovery
  where organization_id = '20000000-0000-4000-8000-000000000005';
  if visible_count <> 0 then
    raise exception 'RLS regression: Company A can read Company B discovery';
  end if;
  select count(*) into visible_count from public.process_recommendations
  where organization_id = '20000000-0000-4000-8000-000000000005';
  if visible_count <> 0 then
    raise exception 'RLS regression: Company A can read Company B recommendations';
  end if;
  begin
    insert into public.process_recommendations (
      organization_id, title, reason, suggested_prompt, priority, created_by
    ) values (
      '20000000-0000-4000-8000-000000000005', 'Cross-tenant recommendation',
      'Must be blocked', 'Must be blocked', 2,
      '10000000-0000-4000-8000-000000000004'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS regression: Company A can write Company B recommendations';
  end if;
end;
$$;
set role postgres;

delete from public.organizations
where id in (
  '20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005'
);
delete from auth.users
where id in (
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005'
);
