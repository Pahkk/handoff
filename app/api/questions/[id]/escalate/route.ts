import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/api";
export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const { id } = await params;
  const { data, error } = await context.supabase.rpc("escalate_my_question", {
    target_question_id: id,
  });
  if (error || !data)
    return NextResponse.json(
      { error: "This question could not be sent to the owner." },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}
