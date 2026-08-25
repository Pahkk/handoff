import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
import { embedKnowledge } from "@/lib/ai/services";
const schema = z.object({
  answerId: z.string().uuid(),
  action: z.enum(["approve", "answer_only"]),
  title: z.string().trim().max(200).optional(),
  rule: z.string().trim().max(10000).optional(),
});
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
      { error: "The answer could not be approved." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  const { data: answer } = await supabase
    .from("question_answers")
    .select("id, answer, proposed_rule")
    .eq("id", parsed.data.answerId)
    .eq("question_id", id)
    .eq("organization_id", membership.organization_id)
    .eq("answer_type", "owner")
    .maybeSingle();
  if (!answer)
    return NextResponse.json(
      { error: "Owner answer not found." },
      { status: 404 },
    );
  try {
    if (parsed.data.action === "approve") {
      const ruleText = parsed.data.rule || answer.proposed_rule;
      if (!ruleText)
        return NextResponse.json(
          { error: "Add a reusable rule before approving." },
          { status: 400 },
        );
      const { data: rule, error: ruleError } = await supabase
        .from("process_rules")
        .insert({
          organization_id: membership.organization_id,
          process_id: null,
          title: parsed.data.title || "Owner guidance",
          text: ruleText,
          status: "approved",
          created_by: user.id,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (ruleError) throw ruleError;
      const [embedding] = await embedKnowledge([
        `${parsed.data.title || "Owner guidance"}: ${ruleText}`,
      ]);
      const { error: knowledgeError } = await supabase
        .from("knowledge_chunks")
        .insert({
          organization_id: membership.organization_id,
          content: `${parsed.data.title || "Owner guidance"}: ${ruleText}`,
          embedding,
          source_type: "owner_answer",
          source_id: answer.id,
          rule_id: rule.id,
          approved: true,
        });
      if (knowledgeError) throw knowledgeError;
      await supabase
        .from("question_answers")
        .update({ approved_as_knowledge: true, proposed_rule: ruleText })
        .eq("id", answer.id);
    }
    const { error: questionError } = await supabase
      .from("employee_questions")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", membership.organization_id);
    if (questionError) throw questionError;
    return NextResponse.json({
      ok: true,
      learned: parsed.data.action === "approve",
    });
  } catch (error) {
    return apiError(error, "Unable to finish saving this answer.");
  }
}
