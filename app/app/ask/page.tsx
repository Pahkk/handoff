import { AskOpryn } from "@/components/app/ask-opryn";
import { PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await requireAppContext();
  const supabase = await createClient();
  const [{ count }, { data: processes }, { data: roles }, { data: discovery }] =
    await Promise.all([
      supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization.id)
        .eq("approved", true),
      supabase
        .from("processes")
        .select("id,title")
        .eq("organization_id", context.organization.id)
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("roles")
        .select("name")
        .eq("organization_id", context.organization.id)
        .order("name")
        .limit(6),
      context.isAdmin
        ? supabase
            .from("organization_discovery")
            .select("common_questions,hardest_to_handoff")
            .eq("organization_id", context.organization.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const prompts = buildPrompts({
    processes: processes ?? [],
    roles: roles ?? [],
    industry: context.organization.industry,
    commonQuestions: discovery?.common_questions ?? "",
    hardestToHandoff: discovery?.hardest_to_handoff ?? "",
  });
  return (
    <>
      <PageHeading
        title="Ask Opryn"
        description="Ask anything about how your company works."
      />
      <AskOpryn
        hasKnowledge={Boolean(count)}
        prompts={prompts}
        initialQuestion={q?.slice(0, 4000) ?? ""}
      />
    </>
  );
}

function buildPrompts(input: {
  processes: Array<{ id: string; title: string }>;
  roles: Array<{ name: string }>;
  industry: string;
  commonQuestions: string;
  hardestToHandoff: string;
}) {
  const processPrompts = input.processes.flatMap((process) => [
    { category: "Process", text: `Walk me through ${process.title}.` },
    {
      category: "Watch out for",
      text: `What mistakes or exceptions should I watch for during ${process.title}?`,
    },
  ]);
  const rolePrompts = input.roles.flatMap((role) => [
    {
      category: "My role",
      text: `What should a ${role.name} learn first?`,
    },
    {
      category: "Approvals",
      text: `Which decisions should a ${role.name} send for approval?`,
    },
  ]);
  const general = [
    { category: "Today", text: "What should I work on first today?" },
    {
      category: "Decisions",
      text: "Which decisions can I make without asking the owner?",
    },
    {
      category: "Quality",
      text: "What should I double-check before I finish a task?",
    },
    {
      category: "Training",
      text: "What company knowledge should I learn next?",
    },
    {
      category: input.industry || "Company",
      text: `What are the most important customer rules for our ${input.industry || "business"}?`,
    },
    {
      category: "Escalation",
      text: "When should I stop and ask someone for help?",
    },
  ];
  const discovery = [input.commonQuestions, input.hardestToHandoff]
    .filter(Boolean)
    .map((text, index) => ({
      category: index ? "Handoff" : "Common question",
      text: text.length > 140 ? `${text.slice(0, 137)}…` : text,
    }));
  const unique = new Map<string, { category: string; text: string }>();
  for (const prompt of [
    ...processPrompts,
    ...rolePrompts,
    ...discovery,
    ...general,
  ]) {
    const key = prompt.text.trim().toLowerCase();
    if (prompt.text.trim() && !unique.has(key)) unique.set(key, prompt);
  }
  return [...unique.values()].slice(0, 20);
}
