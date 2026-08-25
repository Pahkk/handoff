import { PageHeading } from "@/components/app/page-heading";
import { TrainingManager } from "@/components/app/training-manager";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

export default async function TrainingPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const organizationId = context.organization.id;
  const [processes, members, assignments, roles, processRoles] =
    await Promise.all([
      supabase
        .from("processes")
        .select("id,title,summary")
        .eq("organization_id", organizationId)
        .eq("status", "approved")
        .order("approved_at", { ascending: false }),
      supabase
        .from("organization_members")
        .select(
          "user_id,role_id,permission_level,profiles!organization_members_user_id_fkey(full_name,email)",
        )
        .eq("organization_id", organizationId)
        .neq("permission_level", "owner"),
      supabase
        .from("training_assignments")
        .select("id,user_id,process_id,status,completed_at")
        .eq("organization_id", organizationId),
      supabase
        .from("roles")
        .select("id,name")
        .eq("organization_id", organizationId),
      supabase
        .from("process_role_assignments")
        .select("process_id,role_id")
        .eq("organization_id", organizationId),
    ]);
  const error = [
    processes.error,
    members.error,
    assignments.error,
    roles.error,
    processRoles.error,
  ].find(Boolean);
  if (error) {
    console.error("Unable to load training", { code: error.code });
    throw new Error("Unable to load training assignments.");
  }
  const roleNames = new Map(
    (roles.data ?? []).map((role) => [role.id, role.name]),
  );
  const people = (members.data ?? []).map((member) => {
    const raw = member.profiles as unknown;
    const profile = (Array.isArray(raw) ? raw[0] : raw) as {
      full_name: string | null;
      email: string;
    } | null;
    return {
      id: member.user_id,
      name: profile?.full_name || profile?.email || "Team member",
      email: profile?.email ?? "",
      roleName: member.role_id ? (roleNames.get(member.role_id) ?? null) : null,
    };
  });
  return (
    <>
      <PageHeading
        eyebrow="Owner training center"
        title="Turn every new process into team training."
        description="Choose who needs to learn each approved process, then track who has started and completed it."
      />
      <TrainingManager
        people={people}
        initialAssignments={
          (assignments.data ?? []) as Array<{
            id: string;
            user_id: string;
            process_id: string;
            status: "assigned" | "started" | "completed";
            completed_at: string | null;
          }>
        }
        processes={(processes.data ?? []).map((process) => ({
          id: process.id,
          title: process.title,
          summary: process.summary,
          roleNames: (processRoles.data ?? [])
            .filter((item) => item.process_id === process.id)
            .map((item) => roleNames.get(item.role_id))
            .filter((name): name is string => Boolean(name)),
        }))}
      />
    </>
  );
}
