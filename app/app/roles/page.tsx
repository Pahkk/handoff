import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { CreateRole } from "@/components/app/create-role";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function RolesPage() {
  const context = await requireAppContext();
  const supabase = await createClient();
  const [rolesResult, membersResult, assignmentsResult] = await Promise.all([
    supabase
      .from("roles")
      .select("id,name,description,responsibilities")
      .eq("organization_id", context.organization.id)
      .order("name"),
    supabase
      .from("organization_members")
      .select("role_id")
      .eq("organization_id", context.organization.id)
      .not("role_id", "is", null),
    supabase
      .from("process_role_assignments")
      .select("role_id")
      .eq("organization_id", context.organization.id),
  ]);
  const loadError = [
    rolesResult.error,
    membersResult.error,
    assignmentsResult.error,
  ].find(Boolean);
  if (loadError) {
    console.error("Unable to load roles", { code: loadError.code });
    throw new Error("Unable to load roles.");
  }
  const roles = rolesResult.data ?? [];
  const memberCount = countByRole(membersResult.data ?? []);
  const processCount = countByRole(assignmentsResult.data ?? []);
  return (
    <>
      <PageHeading
        title="Roles"
        description="Train people for the job they actually need to do—not a folder of documents."
        actions={context.isAdmin ? <CreateRole /> : undefined}
      />
      {!roles?.length ? (
        <EmptyState
          icon={<BookOpenCheck className="size-5" />}
          title="Build your first role"
          description="Group responsibilities and processes around what one person needs to know."
          action={context.isAdmin ? <CreateRole /> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Link
              key={role.id}
              href={`/app/roles/${role.id}`}
              className="rounded-2xl border border-[#dfe5ed] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
                <BookOpenCheck className="size-5" />
              </span>
              <h2 className="mt-5 font-semibold">{role.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-5 text-[#718095]">
                {role.description ||
                  "Add responsibilities and assigned processes."}
              </p>
              <div className="mt-5 flex gap-4 border-t border-[#edf0f4] pt-4 text-xs text-[#7a8698]">
                <span>{processCount.get(role.id) ?? 0} processes</span>
                <span>{memberCount.get(role.id) ?? 0} team members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function countByRole(rows: Array<{ role_id: string | null }>) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.role_id)
      counts.set(row.role_id, (counts.get(row.role_id) ?? 0) + 1);
  }
  return counts;
}
