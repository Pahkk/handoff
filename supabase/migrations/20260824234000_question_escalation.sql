drop trigger if exists employee_question_notification on public.employee_questions;
create or replace function public.notify_owners_of_question()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'needs_owner' and new.escalated = true
    and (tg_op = 'INSERT' or coalesce(old.escalated, false) = false) then
    insert into public.notifications (organization_id, user_id, type, title, body, link)
    select new.organization_id, om.user_id, 'owner_question', 'A teammate needs your answer', new.question, '/app/knowledge-gaps?question=' || new.id::text
    from public.organization_members om
    where om.organization_id = new.organization_id and om.permission_level in ('owner', 'admin');
  end if;
  return new;
end;
$$;
create trigger employee_question_notification
after insert or update of escalated on public.employee_questions
for each row
execute function public.notify_owners_of_question();

create or replace function public.escalate_my_question(target_question_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare target_org uuid;
begin
  update public.employee_questions
  set escalated = true
  where id = target_question_id
    and asked_by = auth.uid()
    and status = 'needs_owner'
    and escalated = false
  returning organization_id into target_org;
  return target_org is not null;
end;
$$;
revoke all on function public.escalate_my_question(uuid) from public;
grant execute on function public.escalate_my_question(uuid) to authenticated;
