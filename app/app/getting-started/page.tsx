import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Target } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

export default async function GettingStartedPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: recommendations, error }, { data: discovery }] =
    await Promise.all([
      supabase
        .from("process_recommendations")
        .select("id,title,reason,suggested_prompt,priority,status,process_id")
        .eq("organization_id", context.organization.id)
        .neq("status", "dismissed")
        .order("priority"),
      supabase
        .from("organization_discovery")
        .select("owner_goal")
        .eq("organization_id", context.organization.id)
        .maybeSingle(),
    ]);
  if (error) {
    console.error("Unable to load starting plan", { code: error.code });
    throw new Error("Unable to load your starting plan.");
  }
  const remaining = (recommendations ?? []).filter(
    (item) => item.status === "recommended",
  ).length;

  return (
    <>
      <PageHeading
        eyebrow="Your starting plan"
        title="Teach Opryn the work that matters first."
        description="These recommendations are based on how you described your business, the work that repeats, and what is hardest to hand off."
        actions={
          recommendations?.length ? (
            <Link
              href="/app/getting-started/learn"
              className="inline-flex min-h-11 items-center rounded-xl border border-[#d6deea] bg-white px-4 text-sm font-semibold text-[#53627a] hover:bg-[#f7f9fc]"
            >
              Update starting plan
            </Link>
          ) : undefined
        }
      />
      {discovery?.owner_goal ? (
        <section className="mb-5 flex items-start gap-3 rounded-2xl border border-[#dce4f2] bg-[#f5f8ff] p-4 text-sm text-[#53627a] sm:p-5">
          <Target className="mt-0.5 size-5 shrink-0 text-[#3158d8]" />
          <div>
            <p className="font-semibold text-[#25344b]">
              What you are building toward
            </p>
            <p className="mt-1 leading-6">{discovery.owner_goal}</p>
          </div>
        </section>
      ) : null}
      {!recommendations?.length ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="Start with the work you repeat most."
          description="Capture one task you want someone else to handle. Opryn will turn it into a process your team can use."
          action={
            <Link
              href="/app/getting-started/learn"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#3158d8] px-4 text-sm font-semibold text-white"
            >
              Tell Opryn about the business <ArrowRight className="size-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((recommendation, index) => {
            const started = recommendation.status === "started";
            const href =
              started && recommendation.process_id
                ? `/app/processes/${recommendation.process_id}?returnTo=${encodeURIComponent("/app/getting-started")}`
                : `/app/processes/new?recommendation=${recommendation.id}&returnTo=${encodeURIComponent("/app/getting-started")}`;
            return (
              <article
                key={recommendation.id}
                className="flex min-h-[255px] flex-col rounded-2xl border border-[#dfe5ed] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid size-10 place-items-center rounded-xl text-sm font-bold ${started ? "bg-[#eaf7f1] text-[#177257]" : "bg-[#edf2ff] text-[#3158d8]"}`}
                  >
                    {started ? <CheckCircle2 className="size-5" /> : index + 1}
                  </span>
                  <span className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-[11px] font-semibold text-[#667184]">
                    {started
                      ? "Started"
                      : index === 0
                        ? "Start here"
                        : "Recommended"}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-[-.025em]">
                  {recommendation.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6b788b]">
                  {recommendation.reason}
                </p>
                <div className="mt-auto pt-5">
                  <Link
                    href={href}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#edf2ff] px-4 text-sm font-semibold text-[#3158d8] hover:bg-[#e3eaff]"
                  >
                    {started ? "Continue process" : "Teach Opryn"}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {recommendations?.length ? (
        <p className="mt-5 text-sm text-[#718095]">
          {remaining
            ? `${remaining} recommended ${remaining === 1 ? "process" : "processes"} left to start.`
            : "You have started every process in your initial plan."}
        </p>
      ) : null}
    </>
  );
}
