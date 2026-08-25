create or replace function public.notify_owners_of_question()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'needs_owner' and new.escalated = true then
    insert into public.notifications (organization_id, user_id, type, title, body, link)
    select new.organization_id, om.user_id, 'owner_question', 'A teammate needs your answer', new.question, '/app/knowledge-gaps?question=' || new.id::text
    from public.organization_members om
    where om.organization_id = new.organization_id and om.permission_level in ('owner', 'admin');
  end if;
  return new;
end;
$$;

create trigger employee_question_notification
after insert on public.employee_questions
for each row execute function public.notify_owners_of_question();
