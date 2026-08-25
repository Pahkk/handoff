import { CircleHelp, Lightbulb } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { OwnerAnswer } from "@/components/app/owner-answer";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function KnowledgeGapsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("employee_questions")
    .select(
      "id, question, created_at, escalated, profiles!employee_questions_asked_by_fkey(full_name,email)",
    )
    .eq("organization_id", context.organization.id)
    .eq("status", "needs_owner")
    .order("created_at", { ascending: false });
  return (
    <>
      <PageHeading
        title="Knowledge Gaps"
        description="Every unanswered question shows you exactly what Opryn needs to learn next."
      />
      {!questions?.length ? (
        <EmptyState
          icon={<Lightbulb className="size-5" />}
          title="No gaps yet."
          description="As your team asks questions, Opryn will show where your business knowledge is missing."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {questions.map((question) => {
            const raw = question.profiles as unknown;
            const person = (Array.isArray(raw) ? raw[0] : raw) as {
              full_name: string | null;
              email: string;
            } | null;
            return (
              <section
                key={question.id}
                className="rounded-2xl border border-[#dfe5ed] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff4df] text-[#a46b18]">
                    <CircleHelp className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#8a6a2c]">
                      Needs owner answer
                    </p>
                    <h2 className="mt-2 font-semibold leading-6">
                      {question.question}
                    </h2>
                    <p className="mt-2 text-xs text-[#7a8698]">
                      Asked by{" "}
                      {person?.full_name ?? person?.email ?? "a teammate"} ·{" "}
                      {new Date(question.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <OwnerAnswer questionId={question.id} />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
