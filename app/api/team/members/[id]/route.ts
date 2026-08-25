import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
const schema = z.object({
  roleId: z.string().uuid().nullable(),
  permissionLevel: z.enum(["owner", "admin", "employee"]),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid member update." },
      { status: 400 },
    );
  const { data: member } = await context.supabase
    .from("organization_members")
    .select("user_id,permission_level,role_id")
    .eq("id", id)
    .eq("organization_id", context.membership.organization_id)
    .maybeSingle();
  if (!member)
    return NextResponse.json(
      { error: "Team member not found." },
      { status: 404 },
    );
  const isOwner = member.permission_level === "owner";
  const requestsOwner = parsed.data.permissionLevel === "owner";
  if (isOwner !== requestsOwner)
    return NextResponse.json(
      { error: "The workspace owner's access level cannot be changed here." },
      { status: 400 },
    );
  if (parsed.data.roleId) {
    const { data: role } = await context.supabase
      .from("roles")
      .select("id")
      .eq("id", parsed.data.roleId)
      .eq("organization_id", context.membership.organization_id)
      .maybeSingle();
    if (!role)
      return NextResponse.json(
        { error: "Choose a role from this workspace." },
        { status: 400 },
      );
  }
  const { error } = await context.supabase
    .from("organization_members")
    .update({
      role_id: parsed.data.roleId,
      permission_level: parsed.data.permissionLevel,
    })
    .eq("id", id)
    .eq("organization_id", context.membership.organization_id);
  if (error) return apiError(error, "Unable to update this member.");
  if (parsed.data.roleId) {
    const { data: assignments } = await context.supabase
      .from("process_role_assignments")
      .select("process_id")
      .eq("organization_id", context.membership.organization_id)
      .eq("role_id", parsed.data.roleId);
    if (assignments?.length)
      await context.supabase.from("training_assignments").upsert(
        assignments.map((item) => ({
          organization_id: context.membership.organization_id,
          user_id: member.user_id,
          process_id: item.process_id,
          status: "assigned",
        })),
        { onConflict: "user_id,process_id", ignoreDuplicates: true },
      );
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const { data: member } = await context.supabase
    .from("organization_members")
    .select("permission_level")
    .eq("id", id)
    .eq("organization_id", context.membership.organization_id)
    .maybeSingle();
  if (!member || member.permission_level === "owner")
    return NextResponse.json(
      { error: "The workspace owner cannot be removed." },
      { status: 400 },
    );
  const { error } = await context.supabase
    .from("organization_members")
    .delete()
    .eq("id", id);
  return error
    ? apiError(error, "Unable to remove this member.")
    : NextResponse.json({ ok: true });
}
