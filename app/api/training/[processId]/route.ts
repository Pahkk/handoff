import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api";
const schema = z.object({ status: z.enum(["started", "completed"]) });
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ processId: string }> },
) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const { processId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid training status." },
      { status: 400 },
    );
  const now = new Date().toISOString();
  const payload =
    parsed.data.status === "completed"
      ? { status: "completed", started_at: now, completed_at: now }
      : { status: "started", started_at: now };
  const { error } = await context.supabase
    .from("training_assignments")
    .update(payload)
    .eq("organization_id", context.membership.organization_id)
    .eq("user_id", context.user.id)
    .eq("process_id", processId);
  return error
    ? NextResponse.json(
        { error: "Unable to update training." },
        { status: 400 },
      )
    : NextResponse.json({ ok: true });
}
