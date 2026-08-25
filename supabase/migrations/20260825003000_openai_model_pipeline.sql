alter type public.media_status add value if not exists 'extracting_audio';
alter type public.media_status add value if not exists 'transcribed';
alter type public.media_status add value if not exists 'generating_process';
alter type public.media_status add value if not exists 'needs_review';

alter table public.transcripts
  add column if not exists transcription_model text;

alter table public.processes
  add column if not exists transcript_id uuid,
  add column if not exists generation_model text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transcripts_id_org_unique'
      and conrelid = 'public.transcripts'::regclass
  ) then
    alter table public.transcripts
      add constraint transcripts_id_org_unique unique (id, organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'processes_transcript_same_org'
      and conrelid = 'public.processes'::regclass
  ) then
    alter table public.processes
      add constraint processes_transcript_same_org
      foreign key (transcript_id, organization_id)
      references public.transcripts(id, organization_id)
      on delete set null (transcript_id);
  end if;
end $$;

create index if not exists transcripts_media_created_idx
  on public.transcripts (organization_id, media_upload_id, created_at desc);

comment on column public.transcripts.transcription_model is
  'OpenAI speech-to-text model used for this transcript. Null indicates a legacy record.';
comment on column public.processes.generation_model is
  'OpenAI text reasoning model used for the latest generated process. Null indicates a legacy or manually created record.';
