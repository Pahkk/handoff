drop policy if exists organizations_owner_delete on public.organizations;
create policy organizations_owner_delete on public.organizations for delete to authenticated
using (exists (
  select 1 from public.organization_members om
  where om.organization_id = organizations.id
    and om.user_id = (select auth.uid())
    and om.permission_level = 'owner'
));

drop policy if exists members_admin_insert on public.organization_members;
drop policy if exists members_admin_update on public.organization_members;
create policy members_admin_insert on public.organization_members for insert to authenticated
with check (public.is_org_admin(organization_id) and permission_level <> 'owner');
create policy members_admin_update on public.organization_members for update to authenticated
using (public.is_org_admin(organization_id) and permission_level <> 'owner')
with check (public.is_org_admin(organization_id) and permission_level <> 'owner');

drop policy if exists invites_admin_all on public.organization_invites;
create policy invites_admin_all on public.organization_invites for all to authenticated
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id) and permission_level <> 'owner');

alter table public.roles add constraint roles_id_org_unique unique (id, organization_id);
alter table public.organization_members add constraint members_user_org_unique unique (user_id, organization_id);
alter table public.processes add constraint processes_id_org_unique unique (id, organization_id);
alter table public.process_rules add constraint rules_id_org_unique unique (id, organization_id);
alter table public.media_uploads add constraint media_id_org_unique unique (id, organization_id);
alter table public.knowledge_chunks add constraint knowledge_id_org_unique unique (id, organization_id);
alter table public.employee_questions add constraint questions_id_org_unique unique (id, organization_id);

alter table public.organization_members add constraint members_role_same_org
  foreign key (role_id, organization_id) references public.roles(id, organization_id);
alter table public.organization_invites add constraint invites_role_same_org
  foreign key (role_id, organization_id) references public.roles(id, organization_id);
alter table public.process_steps add constraint steps_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.process_rules add constraint rules_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.process_exceptions add constraint exceptions_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.process_role_assignments add constraint assignments_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.process_role_assignments add constraint assignments_role_same_org
  foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete cascade;
alter table public.media_uploads add constraint media_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.transcripts add constraint transcripts_media_same_org
  foreign key (media_upload_id, organization_id) references public.media_uploads(id, organization_id) on delete cascade;
alter table public.transcripts add constraint transcripts_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.clarification_questions add constraint clarifications_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.knowledge_chunks add constraint knowledge_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.knowledge_chunks add constraint knowledge_rule_same_org
  foreign key (rule_id, organization_id) references public.process_rules(id, organization_id) on delete cascade;
alter table public.knowledge_chunks add constraint knowledge_role_same_org
  foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete cascade;
alter table public.employee_questions add constraint questions_process_same_org
  foreign key (related_process_id, organization_id) references public.processes(id, organization_id);
alter table public.question_answers add constraint answers_question_same_org
  foreign key (question_id, organization_id) references public.employee_questions(id, organization_id) on delete cascade;
alter table public.question_sources add constraint sources_question_same_org
  foreign key (question_id, organization_id) references public.employee_questions(id, organization_id) on delete cascade;
alter table public.question_sources add constraint sources_knowledge_same_org
  foreign key (knowledge_chunk_id, organization_id) references public.knowledge_chunks(id, organization_id) on delete cascade;
alter table public.training_assignments add constraint training_process_same_org
  foreign key (process_id, organization_id) references public.processes(id, organization_id) on delete cascade;
alter table public.training_assignments add constraint training_member_same_org
  foreign key (user_id, organization_id) references public.organization_members(user_id, organization_id) on delete cascade;
alter table public.notifications add constraint notifications_member_same_org
  foreign key (user_id, organization_id) references public.organization_members(user_id, organization_id) on delete cascade;
