import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
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
    .select(
      "id, title, description, summary, status, updated_at, created_by, process_steps(count), process_role_assignments(roles(name)), profiles!processes_created_by_fkey(full_name, email)",
    )
    .eq("organization_id", context.organization.id)
    .order("updated_at", { ascending: false });
  if (filters.q) query = query.ilike("title", `%${filters.q.slice(0, 100)}%`);
  if (["draft", "needs_review", "approved"].includes(filters.status ?? ""))
    query = query.eq("status", filters.status!);
  const { data: processes } = await query;
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
            const creatorRaw = process.profiles as unknown;
            const creator = (
              Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw
            ) as { full_name: string | null; email: string } | null;
            const roles = (
              process.process_role_assignments as unknown as Array<{
                roles: { name: string } | { name: string }[] | null;
              }>
            ).flatMap((item) => {
              const role = Array.isArray(item.roles)
                ? item.roles[0]
                : item.roles;
              return role ? [role.name] : [];
            });
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
                  <span>{process.process_steps?.[0]?.count ?? 0} steps</span>
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
    </>
  );
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
