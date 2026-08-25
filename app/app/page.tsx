import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  FileText,
  MessageCircleQuestion,
} from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

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
      <PageHeading
        eyebrow="Owner dashboard"
        title={`Good ${greeting()}, ${firstName}`}
        description="See what your team can handle—and what still depends on you."
        actions={
          <Link
            href="/app/processes/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3158d8] px-4 text-sm font-semibold text-white"
          >
            <FileText className="size-4" />
            Teach Opryn
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<FileText />}
          label="Approved Processes"
          value={processes.count ?? 0}
        />
        <Metric
          icon={<BookOpenCheck />}
          label="Approved Rules"
          value={rules.count ?? 0}
        />
        <Metric
          icon={<CircleHelp />}
          label="Knowledge Gaps"
          value={gaps.count ?? 0}
          alert={Boolean(gaps.count)}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#718095]">
                Employee Questions · This week
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Interruption Reduction
              </h2>
            </div>
            <strong className="text-4xl font-semibold tracking-[-.05em] text-[#3158d8]">
              {reduction}%
            </strong>
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
        <section className="rounded-2xl border border-[#dfe5ed] bg-[#111d34] p-5 text-white sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#aebbd2]">
                Owner Independence
              </p>
              <p className="mt-2 text-sm text-[#c7d0e0]">V1 estimate</p>
            </div>
            <strong className="text-4xl font-semibold tracking-[-.05em]">
              {score}
              <span className="text-lg text-[#8796b0]"> / 100</span>
            </strong>
          </div>
          <div className="mt-7 space-y-4">
            <ScoreRow label="Process coverage" value={processCoverage} />
            <ScoreRow label="Questions handled" value={reduction} />
            <ScoreRow label="Role training coverage" value={trainingCoverage} />
          </div>
          <p className="mt-6 text-[11px] leading-5 text-[#9facc2]">
            This is an estimate based on the knowledge currently captured in
            Opryn.
          </p>
        </section>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
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
        <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Questions waiting for you</h2>
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
    .select("id,status,processes(id,title,summary)")
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .order("created_at");
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
              const raw = assignment.processes as unknown;
              const process = (Array.isArray(raw) ? raw[0] : raw) as {
                id: string;
                title: string;
              } | null;
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5ed] bg-white p-5">
      <div
        className={`grid size-9 place-items-center rounded-xl [&>svg]:size-4 ${alert ? "bg-[#fff4df] text-[#a46b18]" : "bg-[#edf2ff] text-[#3158d8]"}`}
      >
        {icon}
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-sm text-[#718095]">{label}</p>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong className="text-xl font-semibold">{value}</strong>
      <p className="mt-1 text-[11px] text-[#7b8798]">{label}</p>
    </div>
  );
}
function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-[#c3cde0]">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#6f8ef0]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}
