import { notFound } from "next/navigation";
import { Calendar, CheckCircle2, PlayCircle, UserRound } from "lucide-react";
import { ProcessReview } from "@/components/app/process-review";
import { PageHeading } from "@/components/app/page-heading";
import { TrainingButton } from "@/components/app/training-button";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireAppContext();
  const supabase = await createClient();
  const { data: process } = await supabase
    .from("processes")
    .select(
      "*, profiles!processes_created_by_fkey(full_name, email), process_steps(*), process_rules(*), process_exceptions(*), clarification_questions(*), process_role_assignments(roles(id,name)), media_uploads(id,original_name,storage_path,status,mime_type)",
    )
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .maybeSingle();
  if (!process) notFound();
  type StepRow = {
    id: string;
    step_order: number;
    title: string;
    description: string;
  };
  type RuleRow = {
    id: string;
    title: string;
    text: string;
    confidence: number | null;
    status: string;
  };
  type ExceptionRow = { text: string };
  type ClarificationRow = {
    id: string;
    question: string;
    answer: string | null;
    suggested_rule: string | null;
  };
  const steps = ([...(process.process_steps ?? [])] as StepRow[]).sort(
    (a, b) => a.step_order - b.step_order,
  );
  const rules = (process.process_rules ?? ([] as RuleRow[])).filter(
    (rule: RuleRow) => context.isAdmin || rule.status === "approved",
  ) as RuleRow[];
  const creatorRaw = process.profiles as unknown;
  const creator = (Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw) as {
    full_name: string | null;
    email: string;
  } | null;
  const media = process.media_uploads?.[0];
  let mediaUrl: string | null = null;
  if (media?.storage_path) {
    const { data } = await supabase.storage
      .from("process-media")
      .createSignedUrl(media.storage_path, 3600);
    mediaUrl = data?.signedUrl ?? null;
  }
  if (context.isAdmin)
    return (
      <>
        <PageHeading
          eyebrow={
            process.status === "approved" ? "Approved process" : "Owner review"
          }
          title={process.title}
          description="Check every step and rule before this becomes trusted company knowledge."
        />
        <ProcessReview
          initial={{
            id: process.id,
            title: process.title,
            summary: process.summary,
            purpose: process.purpose,
            status: process.status,
            steps: steps.map((step) => ({
              id: step.id,
              title: step.title,
              description: step.description,
            })),
            rules: rules.map((rule) => ({
              id: rule.id,
              title: rule.title,
              text: rule.text,
              confidence: rule.confidence,
            })),
            exceptions: (
              process.process_exceptions ?? ([] as ExceptionRow[])
            ).map((item: ExceptionRow) => ({ text: item.text })),
            clarifications: (
              process.clarification_questions ?? ([] as ClarificationRow[])
            ).map((item: ClarificationRow) => ({
              id: item.id,
              question: item.question,
              answer: item.answer ?? "",
              suggestedRule: item.suggested_rule ?? "",
            })),
          }}
        />
      </>
    );
  const { data: training } = await supabase
    .from("training_assignments")
    .select("status")
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .eq("process_id", id)
    .maybeSingle();
  return (
    <article className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="Company process"
        title={process.title}
        description={process.summary}
        actions={
          training ? (
            <TrainingButton processId={id} status={training.status} />
          ) : undefined
        }
      />
      <div className="mb-6 flex flex-wrap gap-3 text-xs text-[#6e7a8d]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
          <UserRound className="size-3.5" />
          {creator?.full_name ?? creator?.email ?? "Company owner"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
          <Calendar className="size-3.5" />
          Updated {new Date(process.updated_at).toLocaleDateString()}
        </span>
      </div>
      {mediaUrl ? (
        <section className="mb-6 rounded-2xl border border-[#dfe5ed] bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <PlayCircle className="size-5 text-[#3158d8]" />
            Source recording
          </h2>
          <video
            controls
            preload="metadata"
            className="mt-4 max-h-[420px] w-full rounded-xl bg-[#0d1729]"
            src={mediaUrl}
          >
            Your browser does not support video playback.
          </video>
        </section>
      ) : null}
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-8">
        <h2 className="text-lg font-semibold">Purpose</h2>
        <p className="mt-2 text-sm leading-6 text-[#657286]">
          {process.purpose}
        </p>
        <div className="mt-8 space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="grid grid-cols-[36px_1fr] gap-4">
              <span className="grid size-9 place-items-center rounded-xl bg-[#edf2ff] text-xs font-bold text-[#3158d8]">
                {step.step_order}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#657286]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        {rules.length ? (
          <div className="mt-9 border-t border-[#e7ebf0] pt-7">
            <h2 className="text-lg font-semibold">Company rules</h2>
            <div className="mt-4 space-y-3">
              {rules.map((rule: RuleRow) => (
                <div
                  key={rule.id}
                  className="flex gap-3 rounded-xl bg-[#f3f7ff] p-4"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3158d8]" />
                  <div>
                    <h3 className="text-sm font-semibold">{rule.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-[#5f6d82]">
                      {rule.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </article>
  );
}
