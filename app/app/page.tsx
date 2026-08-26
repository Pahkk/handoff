import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  FileText,
  GraduationCap,
  MessageCircleQuestion,
  MessageSquareText,
  Target,
  Video,
  PhoneCall,
} from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationPlan } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/plans";

export default async function DashboardPage() {
  const context = await requireAppContext();
  const supabase = await createClient();
  const week = new Date();
  week.setDate(week.getDate() - 7);
  const org = context.organization.id;
  const [
    processes,
    rules,
    gaps,
    asked,
    answered,
    escalated,
    training,
    recentQuestions,
    recentProcesses,
    subscription,
    learningMedia,
    calls,
  ] = await Promise.all([
    supabase
      .from("processes")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .eq("status", "approved"),
    supabase
      .from("process_rules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .eq("status", "approved"),
    supabase
      .from("employee_questions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .eq("status", "needs_owner"),
    supabase
      .from("employee_questions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .gte("created_at", week.toISOString()),
    supabase
      .from("employee_questions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .eq("answered_by_opryn", true)
      .gte("created_at", week.toISOString()),
    supabase
      .from("employee_questions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org)
      .eq("escalated", true)
      .gte("created_at", week.toISOString()),
    supabase
      .from("training_assignments")
      .select("id,status", { count: "exact" })
      .eq("organization_id", org),
    supabase
      .from("employee_questions")
      .select(
        "id, question, status, created_at, profiles!employee_questions_asked_by_fkey(full_name,email)",
      )
      .eq("organization_id", org)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("processes")
      .select("id,title,status,created_at")
      .eq("organization_id", org)
      .order("created_at", { ascending: false })
      .limit(4),
    getOrganizationPlan(supabase, org),
    supabase
      .from("media_uploads")
      .select("mime_type")
      .eq("organization_id", org),
    supabase
      .from("call_recordings")
      .select("id,status")
      .eq("organization_id", org),
  ]);
  const askedCount = asked.count ?? 0;
  const answeredCount = answered.count ?? 0;
  const reduction = askedCount
    ? Math.round((answeredCount / askedCount) * 100)
    : 0;
  const completed =
    training.data?.filter((item) => item.status === "completed").length ?? 0;
  const totalTraining = training.data?.length ?? 0;
  const processCoverage = Math.min(100, (processes.count ?? 0) * 12);
  const trainingCoverage = totalTraining
    ? Math.round((completed / totalTraining) * 100)
    : 0;
  const gapPenalty = Math.min(35, (gaps.count ?? 0) * 7);
  const score = Math.max(
    0,
    Math.round(
      processCoverage * 0.45 +
        reduction * 0.35 +
        trainingCoverage * 0.2 -
        gapPenalty,
    ),
  );
  const firstName = context.user.fullName.split(" ")[0];
  const nextMove = getNextOwnerMove({
    processes: processes.count ?? 0,
    gaps: gaps.count ?? 0,
    totalTraining,
  });
  if (!context.isAdmin)
    return (
      <EmployeeHome
        context={context}
        supabase={supabase}
        completed={completed}
        total={totalTraining}
      />
    );
  return (
    <>
      <header className="owner-dashboard-heading mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="status-pulse size-2 rounded-full bg-[#1b8b69]" />
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#5f6d82]">
              {context.organization.name} · Owner view
            </p>
          </div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
            Good {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69758a]">
            Here&apos;s what your team can handle—and where you can remove
            yourself next.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/app/ask"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e0ea] bg-white px-4 text-sm font-semibold text-[#354156] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c4cfdd]"
          >
            <MessageSquareText className="size-4 text-[#3158d8]" />
            Ask Opryn
          </Link>
          <Link
            href="/app/processes/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3158d8] px-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(49,88,216,.2)] transition hover:-translate-y-0.5 hover:bg-[#284abf]"
          >
            <FileText className="size-4" />
            Teach Opryn
          </Link>
        </div>
      </header>
      <section className="owner-command-card relative overflow-hidden rounded-[24px] bg-[#101d34] p-5 text-white shadow-[0_24px_70px_rgba(16,29,52,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-32 size-[340px] rounded-full bg-[#3158d8]/30 blur-[90px]" />
        <div className="relative grid gap-7 xl:grid-cols-[.95fr_1.05fr] xl:items-center">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className="grid size-32 shrink-0 place-items-center rounded-full p-[9px]"
              style={{
                background:
                  "conic-gradient(#6f8ef0 " +
                  score +
                  "%, rgba(255,255,255,.1) 0)",
              }}
            >
              <div className="grid size-full place-items-center rounded-full bg-[#101d34]">
                <div className="text-center">
                  <strong className="metric block text-4xl font-semibold">
                    {score}
                  </strong>
                  <span className="text-[10px] font-bold uppercase tracking-[.13em] text-[#93a2ba]">
                    out of 100
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8fa6fa]">
                Owner independence
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">
                {independenceHeadline(score)}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#b5c0d2]">
                Opryn uses approved knowledge, answered questions, and training
                coverage to estimate how much can run without you.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <CommandScore
              label="Process coverage"
              value={processCoverage}
              detail={(processes.count ?? 0) + " approved"}
            />
            <CommandScore
              label="Questions handled"
              value={reduction}
              detail={answeredCount + " this week"}
            />
            <CommandScore
              label="Training coverage"
              value={trainingCoverage}
              detail={completed + " of " + totalTraining}
            />
          </div>
        </div>
        <p className="relative mt-6 border-t border-white/10 pt-4 text-[10px] leading-5 text-[#8391a7]">
          This is a directional estimate based on the knowledge currently
          captured in Opryn.
        </p>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<FileText />}
          label="Approved Processes"
          value={processes.count ?? 0}
          href="/app/processes"
        />
        <Metric
          icon={<BookOpenCheck />}
          label="Approved Rules"
          value={rules.count ?? 0}
          href="/app/knowledge-gaps"
        />
        <Metric
          icon={<CircleHelp />}
          label="Knowledge Gaps"
          value={gaps.count ?? 0}
          alert={Boolean(gaps.count)}
          href="/app/knowledge-gaps"
        />
        <Metric
          icon={<GraduationCap />}
          label="Training Complete"
          value={completed}
          helper={"of " + totalTraining + " assignments"}
          href="/app/training"
        />
      </div>
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="dashboard-panel min-w-0 rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#718095]">
                Employee Questions · This week
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Interruption Reduction
              </h2>
            </div>
            <div className="flex items-end gap-2">
              <strong className="text-4xl font-semibold tracking-[-.05em] text-[#3158d8]">
                {reduction}%
              </strong>
              <span className="mb-1 text-xs font-medium text-[#8490a1]">
                handled without you
              </span>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#edf0f4]">
            <div
              className="h-full rounded-full bg-[#3158d8]"
              style={{ width: `${reduction}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#647185]">
            Opryn handled{" "}
            <strong className="text-[#263348]">
              {answeredCount} questions
            </strong>{" "}
            your team otherwise may have needed to ask you.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#edf0f4] pt-5">
            <Mini label="Asked" value={askedCount} />
            <Mini label="Answered" value={answeredCount} />
            <Mini label="Asked owner" value={escalated.count ?? 0} />
          </div>
        </section>
        <section className="next-move-card relative min-w-0 overflow-hidden rounded-2xl border border-[#dce6e1] bg-[#f3faf7] p-5 sm:p-6">
          <div className="absolute right-0 top-0 size-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#caebdd]/55" />
          <span className="relative grid size-10 place-items-center rounded-xl bg-[#dff3ea] text-[#177257]">
            <Target className="size-5" />
          </span>
          <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.13em] text-[#177257]">
            Your next best move
          </p>
          <h2 className="relative mt-2 text-xl font-semibold tracking-[-.025em] text-[#20352f]">
            {nextMove.title}
          </h2>
          <p className="relative mt-2 text-sm leading-6 text-[#60766e]">
            {nextMove.description}
          </p>
          <Link
            href={nextMove.href}
            className="relative mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#177257] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#12634b]"
          >
            {nextMove.action} <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
      {!hasFeature(subscription.plan, "advancedAnalytics") ? (
        <section className="mt-5 flex flex-col gap-5 overflow-hidden rounded-2xl border border-[#dce6e1] bg-[#f3faf7] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="rounded-full bg-[#dff3ea] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.09em] text-[#177257]">
              Premium
            </span>
            <h2 className="mt-3 text-lg font-semibold">
              Opryn could learn more automatically.
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#60766e]">
              Let Opryn learn from videos, screen recordings, and authorized
              business calls.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#177257] px-5 text-sm font-semibold text-white"
          >
            Explore Premium <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <section className="mt-5 rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#177257]">
                Premium learning sources
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                How Opryn is learning
              </h2>
            </div>
            <Link
              href="/app/calls"
              className="text-xs font-semibold text-[#3158d8]"
            >
              Open calls
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric
              icon={<FileText />}
              label="Audio explanations"
              value={
                (learningMedia.data ?? []).filter((item) =>
                  item.mime_type.startsWith("audio/"),
                ).length
              }
            />
            <Metric
              icon={<Video />}
              label="Videos"
              value={
                (learningMedia.data ?? []).filter((item) =>
                  item.mime_type.startsWith("video/"),
                ).length
              }
            />
            <Metric
              icon={<PhoneCall />}
              label="Calls"
              value={
                (calls.data ?? []).filter(
                  (item) =>
                    item.status === "needs_review" ||
                    item.status === "approved",
                ).length
              }
            />
          </div>
        </section>
      )}
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="dashboard-panel min-w-0 rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8090a5]">
                Live workspace
              </p>
              <h2 className="mt-1 font-semibold">Recent activity</h2>
            </div>
          </div>
          {!recentQuestions.data?.length && !recentProcesses.data?.length ? (
            <p className="mt-6 rounded-xl bg-[#f8fafc] p-5 text-sm text-[#718095]">
              Activity will appear as your team captures processes and asks
              questions.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#edf0f4]">
              {[
                ...(recentQuestions.data ?? []).map((item) => ({
                  key: item.id,
                  text: `A teammate asked “${item.question}”`,
                  date: item.created_at,
                  icon: <MessageCircleQuestion />,
                })),
                ...(recentProcesses.data ?? []).map((item) => ({
                  key: item.id,
                  text: `Process ${item.status === "approved" ? "approved" : "created"}: ${item.title}`,
                  date: item.created_at,
                  icon: <FileText />,
                })),
              ]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .slice(0, 5)
                .map((item) => (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-[#3158d8] [&>svg]:size-4">
                      {item.icon}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm">
                      {item.text}
                    </p>
                    <span className="text-[11px] text-[#8b95a4]">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
        <section className="dashboard-panel min-w-0 rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#b26e18]">
                Owner inbox
              </p>
              <h2 className="mt-1 font-semibold">Questions waiting for you</h2>
            </div>
            <Link
              href="/app/knowledge-gaps"
              className="text-xs font-semibold text-[#3158d8]"
            >
              View all
            </Link>
          </div>
          {!gaps.count ? (
            <EmptyState
              icon={<CircleHelp className="size-5" />}
              title="Your team is covered"
              description="New unanswered questions will appear here."
            />
          ) : (
            <div className="mt-5">
              <p className="text-3xl font-semibold tracking-[-.04em]">
                {gaps.count}
              </p>
              <p className="mt-1 text-sm text-[#718095]">
                knowledge {gaps.count === 1 ? "gap needs" : "gaps need"} your
                answer
              </p>
              <Link
                href="/app/knowledge-gaps"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3158d8]"
              >
                Answer questions <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
async function EmployeeHome({
  context,
  supabase,
  completed,
  total,
}: {
  context: Awaited<ReturnType<typeof requireAppContext>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  completed: number;
  total: number;
}) {
  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("id,status,process_id")
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .order("created_at");
  const processIds = (assignments ?? []).map(
    (assignment) => assignment.process_id,
  );
  const { data: assignedProcesses } = processIds.length
    ? await supabase
        .from("processes")
        .select("id,title,summary")
        .eq("organization_id", context.organization.id)
        .in("id", processIds)
    : { data: [] };
  const processesById = new Map(
    (assignedProcesses ?? []).map((process) => [process.id, process]),
  );
  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title={`Good ${greeting()}, ${context.user.fullName.split(" ")[0]}`}
        description="Find the process you need or ask Opryn a company question."
      />
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#718095]">
              Your Training
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {completed} of {total} processes complete
            </h2>
          </div>
          <span className="grid size-11 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
            <BookOpenCheck className="size-5" />
          </span>
        </div>
        <div className="mt-5 h-2 rounded-full bg-[#edf0f4]">
          <div
            className="h-full rounded-full bg-[#3158d8]"
            style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
          />
        </div>
        {!assignments?.length ? (
          <p className="mt-5 text-sm text-[#718095]">
            No training has been assigned yet.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-[#edf0f4]">
            {assignments.map((assignment) => {
              const process = processesById.get(assignment.process_id);
              return process ? (
                <Link
                  key={assignment.id}
                  href={`/app/processes/${process.id}`}
                  className="flex items-center justify-between py-3 text-sm font-medium hover:text-[#3158d8]"
                >
                  {process.title}
                  <span className="text-xs capitalize text-[#7a8698]">
                    {assignment.status}
                  </span>
                </Link>
              ) : null;
            })}
          </div>
        )}
      </section>
      <Link
        href="/app/ask"
        className="mt-5 flex items-center justify-between rounded-2xl bg-[#3158d8] p-5 text-white"
      >
        <div>
          <p className="text-lg font-semibold">Ask Opryn</p>
          <p className="mt-1 text-sm text-[#d5def8]">
            Get an answer from approved company knowledge.
          </p>
        </div>
        <ArrowRight />
      </Link>
    </>
  );
}
function Metric({
  icon,
  label,
  value,
  alert,
  helper,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
  helper?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={
            "grid size-9 place-items-center rounded-xl [&>svg]:size-4 " +
            (alert
              ? "bg-[#fff4df] text-[#a46b18]"
              : "bg-[#edf2ff] text-[#3158d8]")
          }
        >
          {icon}
        </div>
        {href ? (
          <ArrowRight className="size-4 text-[#a1aab7] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3158d8]" />
        ) : null}
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-sm text-[#718095]">{label}</p>
      {helper ? (
        <p className="mt-1 text-[10px] font-medium text-[#96a0ae]">{helper}</p>
      ) : null}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="dashboard-metric group rounded-2xl border border-[#dfe5ed] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#cbd6e4] hover:shadow-[0_12px_30px_rgba(24,39,66,.07)]"
    >
      {content}
    </Link>
  ) : (
    <div className="dashboard-metric rounded-2xl border border-[#dfe5ed] bg-white p-5">
      {content}
    </div>
  );
}
function CommandScore({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4 backdrop-blur">
      <div className="flex items-end justify-between gap-2">
        <strong className="metric text-2xl font-semibold">{value}%</strong>
        <span className="text-[9px] text-[#8796ae]">{detail}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#6f8ef0]"
          style={{ width: value + "%" }}
        />
      </div>
      <p className="mt-3 text-[10px] font-semibold text-[#bac5d7]">{label}</p>
    </div>
  );
}
function getNextOwnerMove({
  processes,
  gaps,
  totalTraining,
}: {
  processes: number;
  gaps: number;
  totalTraining: number;
}) {
  if (processes === 0) {
    return {
      title: "Capture your first process",
      description:
        "Start with one task you want someone else to handle. Explain it naturally and Opryn will structure it.",
      href: "/app/processes/new",
      action: "Teach first process",
    };
  }
  if (gaps > 0) {
    return {
      title:
        "Answer " +
        gaps +
        " waiting " +
        (gaps === 1 ? "question" : "questions"),
      description:
        "Your answers close knowledge gaps and help Opryn handle the same questions automatically next time.",
      href: "/app/knowledge-gaps",
      action: "Open owner inbox",
    };
  }
  if (totalTraining === 0) {
    return {
      title: "Assign the first training",
      description:
        "Turn an approved process into clear onboarding for the employee who needs it.",
      href: "/app/training",
      action: "Set up training",
    };
  }
  return {
    title: "Capture the next owner-only task",
    description:
      "Choose one recurring task or decision that still depends on you and teach it to Opryn.",
    href: "/app/processes/new",
    action: "Teach Opryn",
  };
}
function independenceHeadline(score: number) {
  if (score < 20) return "Start getting your business out of your head.";
  if (score < 60) return "Your business is learning to run without you.";
  return "Your business is becoming easier to hand off.";
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong className="text-xl font-semibold">{value}</strong>
      <p className="mt-1 text-[11px] text-[#7b8798]">{label}</p>
    </div>
  );
}
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}
