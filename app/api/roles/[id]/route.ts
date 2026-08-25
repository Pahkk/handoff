import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  responsibilities: z.object({
    every_morning: z.array(z.string().trim().min(1).max(500)).max(50),
    every_customer: z.array(z.string().trim().min(1).max(500)).max(50),
    requires_approval: z.array(z.string().trim().min(1).max(500)).max(50),
  }),
  processIds: z.array(z.string().uuid()).max(200),
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
      { error: "Review the role details." },
      { status: 400 },
    );
  const { supabase, membership } = context;
  try {
    const { error } = await supabase
      .from("roles")
      .update({
        name: parsed.data.name,
        description: parsed.data.description,
        responsibilities: parsed.data.responsibilities,
      })
      .eq("id", id)
      .eq("organization_id", membership.organization_id);
    if (error) throw error;
    await supabase
      .from("process_role_assignments")
      .delete()
      .eq("role_id", id)
      .eq("organization_id", membership.organization_id);
    if (parsed.data.processIds.length) {
      const { error: assignmentError } = await supabase
        .from("process_role_assignments")
        .insert(
          parsed.data.processIds.map((processId) => ({
            organization_id: membership.organization_id,
            role_id: id,
            process_id: processId,
          })),
        );
      if (assignmentError) throw assignmentError;
    }
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", membership.organization_id)
      .eq("role_id", id);
    if (members?.length && parsed.data.processIds.length)
      await supabase.from("training_assignments").upsert(
        members.flatMap((member) =>
          parsed.data.processIds.map((processId) => ({
            organization_id: membership.organization_id,
            user_id: member.user_id,
            process_id: processId,
            status: "assigned",
          })),
        ),
        { onConflict: "user_id,process_id", ignoreDuplicates: true },
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to save this role.");
  }
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const { error } = await context.supabase
    .from("roles")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.membership.organization_id);
  return error
    ? apiError(error, "Unable to delete role.")
    : NextResponse.json({ ok: true });
}
