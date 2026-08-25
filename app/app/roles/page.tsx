import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { CreateRole } from "@/components/app/create-role";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function RolesPage() {
  const context = await requireAppContext();
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("roles")
    .select(
      "id,name,description,responsibilities,organization_members(count),process_role_assignments(count)",
    )
    .eq("organization_id", context.organization.id)
    .order("name");
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
                <span>
                  {role.process_role_assignments?.[0]?.count ?? 0} processes
                </span>
                <span>
                  {role.organization_members?.[0]?.count ?? 0} team members
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
