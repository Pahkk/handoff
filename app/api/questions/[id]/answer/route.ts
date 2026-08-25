import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
import { suggestRuleFromOwnerAnswer } from "@/lib/ai/services";
const schema = z.object({ answer: z.string().trim().min(1).max(10000) });
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Write an answer before continuing." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  const { data: question } = await supabase
    .from("employee_questions")
    .select("id, question")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .eq("status", "needs_owner")
    .maybeSingle();
  if (!question)
    return NextResponse.json(
      { error: "This question is no longer waiting for an answer." },
      { status: 404 },
    );
  try {
    const { data: answer, error } = await supabase
      .from("question_answers")
      .insert({
        organization_id: membership.organization_id,
        question_id: id,
        answer: parsed.data.answer,
        answered_by: user.id,
        answer_type: "owner",
        proposed_rule: null,
      })
      .select("id")
      .single();
    if (error) throw error;
    let suggested = { title: "Owner guidance", rule: parsed.data.answer };
    try {
      suggested = await suggestRuleFromOwnerAnswer(
        question.question,
        parsed.data.answer,
      );
    } catch (suggestionError) {
      console.error(
        "Rule suggestion failed; preserving the owner's exact answer",
        suggestionError instanceof Error
          ? suggestionError.message
          : "Unknown error",
      );
    }
    await supabase
      .from("question_answers")
      .update({ proposed_rule: suggested.rule })
      .eq("id", answer.id);
    return NextResponse.json({
      answerId: answer.id,
      title: suggested.title,
      rule: suggested.rule,
    });
  } catch (error) {
    return apiError(error, "Unable to save your answer. Please try again.");
  }
}
