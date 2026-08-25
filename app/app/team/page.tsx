import { PageHeading } from "@/components/app/page-heading";
import { TeamManager } from "@/components/app/team-manager";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function TeamPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [
    { data: roles },
    { data: members },
    { data: invites },
    { data: training },
  ] = await Promise.all([
    supabase
      .from("roles")
      .select("id,name")
      .eq("organization_id", context.organization.id)
      .order("name"),
    supabase
      .from("organization_members")
      .select(
        "id,user_id,permission_level,role_id,joined_at,profiles!organization_members_user_id_fkey(full_name,email)",
      )
      .eq("organization_id", context.organization.id)
      .order("joined_at"),
    supabase
      .from("organization_invites")
      .select("id,email,status,expires_at,roles(name)")
      .eq("organization_id", context.organization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("training_assignments")
      .select("user_id,status")
      .eq("organization_id", context.organization.id),
  ]);
  const shaped = (members ?? []).map((member) => {
    const raw = member.profiles as unknown;
    const profile = (Array.isArray(raw) ? raw[0] : raw) as {
      full_name: string | null;
      email: string;
    } | null;
    const assigned = (training ?? []).filter(
      (item) => item.user_id === member.user_id,
    );
    return {
      ...member,
      profile,
      training: {
        total: assigned.length,
        done: assigned.filter((item) => item.status === "completed").length,
      },
    };
  });
  const shapedInvites = (invites ?? []).map((invite) => {
    const raw = invite.roles as unknown;
    return {
      ...invite,
      role: (Array.isArray(raw) ? raw[0] : raw) as { name: string } | null,
    };
  });
  return (
    <>
      <PageHeading
        title="Team"
        description="Invite employees, assign their role, and see onboarding progress."
      />
      <TeamManager
        roles={roles ?? []}
        members={shaped}
        invites={shapedInvites}
        currentUserId={context.user.id}
      />
    </>
  );
}
