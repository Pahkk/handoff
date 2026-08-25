import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import {
  KnowledgeTree,
  ProcessIdeas,
} from "@/components/app/process-intelligence";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const context = await requireAppContext();
  const filters = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("processes")
    .select("id, title, description, summary, status, updated_at, created_by")
    .eq("organization_id", context.organization.id)
    .order("updated_at", { ascending: false });
  if (filters.q) query = query.ilike("title", `%${filters.q.slice(0, 100)}%`);
  if (["draft", "needs_review", "approved"].includes(filters.status ?? ""))
    query = query.eq("status", filters.status!);
  const { data: processes, error: processesError } = await query;
  if (processesError) {
    console.error("Unable to load processes", { code: processesError.code });
    throw new Error("Unable to load processes.");
  }
  const processIds = (processes ?? []).map((process) => process.id);
  const creatorIds = [
    ...new Set((processes ?? []).map((process) => process.created_by)),
  ];
  const [stepsResult, assignmentsResult, rolesResult, creatorsResult] =
    processIds.length
      ? await Promise.all([
          supabase
            .from("process_steps")
            .select("process_id")
            .eq("organization_id", context.organization.id)
            .in("process_id", processIds),
          supabase
            .from("process_role_assignments")
            .select("process_id,role_id")
            .eq("organization_id", context.organization.id)
            .in("process_id", processIds),
          supabase
            .from("roles")
            .select("id,name")
            .eq("organization_id", context.organization.id),
          supabase
            .from("profiles")
            .select("id,full_name,email")
            .in("id", creatorIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];
  const relatedError = [
    stepsResult.error,
    assignmentsResult.error,
    rolesResult.error,
    creatorsResult.error,
  ].find(Boolean);
  if (relatedError) {
    console.error("Unable to load process details", {
      code: relatedError.code,
    });
    throw new Error("Unable to load processes.");
  }
  const stepCounts = countBy(stepsResult.data ?? [], "process_id");
  const roleNames = new Map(
    (rolesResult.data ?? []).map((role) => [role.id, role.name]),
  );
  const processRoles = new Map<string, string[]>();
  for (const assignment of assignmentsResult.data ?? []) {
    const name = roleNames.get(assignment.role_id);
    if (!name) continue;
    processRoles.set(assignment.process_id, [
      ...(processRoles.get(assignment.process_id) ?? []),
      name,
    ]);
  }
  const creators = new Map(
    (creatorsResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const [
    knowledgeProcessesResult,
    knowledgeChunksResult,
    knowledgeAssignmentsResult,
    knowledgeRolesResult,
    recommendationsResult,
  ] = await Promise.all([
    supabase
      .from("processes")
      .select("id,title,summary")
      .eq("organization_id", context.organization.id)
      .eq("status", "approved")
      .order("updated_at", { ascending: false }),
    supabase
      .from("knowledge_chunks")
      .select("id,content,source_type,process_id")
      .eq("organization_id", context.organization.id)
      .eq("approved", true)
      .order("created_at"),
    supabase
      .from("process_role_assignments")
      .select("process_id,role_id")
      .eq("organization_id", context.organization.id),
    supabase
      .from("roles")
      .select("id,name")
      .eq("organization_id", context.organization.id),
    supabase
      .from("process_recommendations")
      .select("id,title,reason,suggested_prompt")
      .eq("organization_id", context.organization.id)
      .eq("status", "recommended")
      .order("priority")
      .limit(4),
  ]);
  const knowledgeError = [
    knowledgeProcessesResult.error,
    knowledgeChunksResult.error,
    knowledgeAssignmentsResult.error,
    knowledgeRolesResult.error,
    recommendationsResult.error,
  ].find(Boolean);
  if (knowledgeError) {
    console.error("Unable to load process intelligence", {
      code: knowledgeError.code,
    });
    throw new Error("Unable to load company knowledge.");
  }
  const knowledgeRoleNames = new Map(
    (knowledgeRolesResult.data ?? []).map((role) => [role.id, role.name]),
  );
  const knowledgeProcesses = [
    ...(knowledgeProcessesResult.data ?? []).map((process) => ({
      ...process,
      chunks: (knowledgeChunksResult.data ?? []).filter(
        (chunk) => chunk.process_id === process.id,
      ),
      roles: (knowledgeAssignmentsResult.data ?? [])
        .filter((assignment) => assignment.process_id === process.id)
        .map((assignment) => knowledgeRoleNames.get(assignment.role_id))
        .filter((name): name is string => Boolean(name)),
    })),
    ...((knowledgeChunksResult.data ?? []).some((chunk) => !chunk.process_id)
      ? [
          {
            id: "owner-guidance",
            title: "Rules learned from owner answers",
            summary:
              "Reusable company knowledge captured when the owner answered a team question.",
            href: "/app/knowledge-gaps",
            roles: [] as string[],
            chunks: (knowledgeChunksResult.data ?? []).filter(
              (chunk) => !chunk.process_id,
            ),
          },
        ]
      : []),
  ];
  return (
    <>
      <PageHeading
        title="Processes"
        description={
          context.isAdmin
            ? "Capture, review, and approve how your company gets work done."
            : "Everything you need to do your job, in one place."
        }
        actions={
          context.isAdmin ? (
            <Link
              href="/app/processes/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3158d8] px-4 text-sm font-semibold text-white hover:bg-[#2446b8]"
            >
              <Plus className="size-4" />
              Capture Process
            </Link>
          ) : undefined
        }
      />
      <ProcessIdeas
        organizationName={context.organization.name}
        recommendations={recommendationsResult.data ?? []}
        processTitles={(knowledgeProcessesResult.data ?? []).map(
          (process) => process.title,
        )}
      />
      <form className="mb-5 flex flex-col gap-3 rounded-xl border border-[#e0e5ec] bg-white p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b95a4]" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search processes"
            className="h-10 w-full rounded-lg border border-[#e0e5ec] pl-9 pr-3 text-sm outline-none focus:border-[#8299df]"
          />
        </label>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="h-10 rounded-lg border border-[#e0e5ec] bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="needs_review">Needs review</option>
          <option value="approved">Approved</option>
        </select>
        <button className="h-10 rounded-lg bg-[#f0f3f7] px-4 text-sm font-semibold">
          Filter
        </button>
      </form>
      {!processes?.length ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title={
            filters.q
              ? "No processes found"
              : "Your business still lives in your head."
          }
          description={
            filters.q
              ? "Try a different search or clear the filters."
              : "Capture the first process you want someone else to handle."
          }
          action={
            context.isAdmin && !filters.q ? (
              <Link
                href="/app/processes/new"
                className="inline-flex min-h-10 items-center rounded-lg bg-[#3158d8] px-4 text-sm font-semibold text-white"
              >
                Capture First Process
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {processes.map((process) => {
            const creator = creators.get(process.created_by);
            const roles = processRoles.get(process.id) ?? [];
            return (
              <Link
                key={process.id}
                href={`/app/processes/${process.id}`}
                className="group rounded-2xl border border-[#dfe5ed] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c7d2e1] hover:shadow-[0_14px_35px_rgba(24,39,75,.07)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
                    <FileText className="size-[18px]" />
                  </span>
                  <Status value={process.status} />
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-[-.025em] group-hover:text-[#3158d8]">
                  {process.title}
                </h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#718095]">
                  {process.summary ||
                    process.description ||
                    "Waiting for process details."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#edf0f4] pt-4 text-xs text-[#7a8698]">
                  <span>{stepCounts.get(process.id) ?? 0} steps</span>
                  <span>{roles.length ? roles.join(", ") : "All roles"}</span>
                  <span className="ml-auto">
                    {creator?.full_name ?? creator?.email ?? "Owner"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <KnowledgeTree
        organizationName={context.organization.name}
        processes={knowledgeProcesses}
      />
    </>
  );
}

function countBy<T extends Record<K, string>, K extends keyof T>(
  rows: T[],
  key: K,
) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function Status({ value }: { value: string }) {
  const copy: Record<string, [string, string]> = {
    draft: ["Draft", "bg-[#f1f3f6] text-[#667184]"],
    needs_review: ["Needs Review", "bg-[#fff4df] text-[#9b6417]"],
    approved: ["Approved", "bg-[#eaf7f1] text-[#177257]"],
  };
  const [label, classes] = copy[value] ?? copy.draft;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
