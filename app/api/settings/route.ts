import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
const schema = z.object({
  name: z.string().trim().min(1).max(160),
  industry: z.string().trim().min(1).max(100),
  employeeCount: z.coerce.number().int().min(0).max(100000),
  employeesCanAsk: z.boolean(),
  allowEscalations: z.boolean(),
  confidenceThreshold: z.number().min(0.5).max(0.95),
});
export async function PATCH(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Review the business settings." },
      { status: 400 },
    );
  const { error } = await context.supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      industry: parsed.data.industry,
      employee_count: parsed.data.employeeCount,
    })
    .eq("id", context.membership.organization_id);
  if (error) return apiError(error, "Unable to update business settings.");
  const { error: settingsError } = await context.supabase
    .from("organization_settings")
    .update({
      employees_can_ask: parsed.data.employeesCanAsk,
      allow_escalations: parsed.data.allowEscalations,
      confidence_threshold: parsed.data.confidenceThreshold,
    })
    .eq("organization_id", context.membership.organization_id);
  return settingsError
    ? apiError(settingsError, "Unable to update knowledge settings.")
    : NextResponse.json({ ok: true });
}
export async function DELETE(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const body = (await request.json().catch(() => null)) as {
    confirmation?: string;
  } | null;
  const { data: org } = await context.supabase
    .from("organizations")
    .select("name")
    .eq("id", context.membership.organization_id)
    .single();
  if (!org || body?.confirmation !== org.name)
    return NextResponse.json(
      { error: "Type the exact business name to confirm." },
      { status: 400 },
    );
  const { data: membership } = await context.supabase
    .from("organization_members")
    .select("permission_level")
    .eq("id", context.membership.id)
    .single();
  if (membership?.permission_level !== "owner")
    return NextResponse.json(
      { error: "Only the workspace owner can delete it." },
      { status: 403 },
    );
  const { error } = await context.supabase
    .from("organizations")
    .delete()
    .eq("id", context.membership.organization_id);
  return error
    ? apiError(error, "Unable to delete the workspace.")
    : NextResponse.json({ ok: true });
}
