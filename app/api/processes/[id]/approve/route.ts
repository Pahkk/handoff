import { NextResponse } from "next/server";
import { getRequestContext, apiError } from "@/lib/api";
import { embedKnowledge } from "@/lib/ai/services";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const { supabase, user, membership } = context;
  const [
    processResult,
    stepsResult,
    rulesResult,
    exceptionsResult,
    rolesResult,
  ] = await Promise.all([
    supabase
      .from("processes")
      .select("id, title, summary, purpose")
      .eq("id", id)
      .eq("organization_id", membership.organization_id)
      .maybeSingle(),
    supabase
      .from("process_steps")
      .select("id, step_order, title, description")
      .eq("process_id", id)
      .order("step_order"),
    supabase
      .from("process_rules")
      .select("id, title, text")
      .eq("process_id", id),
    supabase.from("process_exceptions").select("id, text").eq("process_id", id),
    supabase
      .from("process_role_assignments")
      .select("role_id")
      .eq("process_id", id),
  ]);
  if (!processResult.data)
    return NextResponse.json({ error: "Process not found." }, { status: 404 });
  const process = processResult.data;
  const roleId =
    rolesResult.data?.length === 1 ? rolesResult.data[0].role_id : null;
  const chunks = [
    {
      content: `${process.title}. ${process.summary}\nPurpose: ${process.purpose}`,
      source_type: "process_summary",
      source_id: process.id,
      process_id: id,
      rule_id: null,
    },
    ...(stepsResult.data ?? []).map((step) => ({
      content: `${process.title}, step ${step.step_order}: ${step.title}. ${step.description}`,
      source_type: "process_step",
      source_id: step.id,
      process_id: id,
      rule_id: null,
    })),
    ...(rulesResult.data ?? []).map((rule) => ({
      content: `${rule.title}: ${rule.text}`,
      source_type: "rule",
      source_id: rule.id,
      process_id: id,
      rule_id: rule.id,
    })),
    ...(exceptionsResult.data ?? []).map((item) => ({
      content: `${process.title} exception: ${item.text}`,
      source_type: "exception",
      source_id: item.id,
      process_id: id,
      rule_id: null,
    })),
  ];
  try {
    const embeddings = await embedKnowledge(
      chunks.map((chunk) => chunk.content),
    );
    await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("process_id", id)
      .eq("organization_id", membership.organization_id);
    const { error: knowledgeError } = await supabase
      .from("knowledge_chunks")
      .insert(
        chunks.map((chunk, index) => ({
          ...chunk,
          organization_id: membership.organization_id,
          role_id: roleId,
          approved: true,
          embedding: embeddings[index],
        })),
      );
    if (knowledgeError) throw knowledgeError;
    const now = new Date().toISOString();
    const { error: processError } = await supabase
      .from("processes")
      .update({ status: "approved", approved_by: user.id, approved_at: now })
      .eq("id", id);
    if (processError) throw processError;
    const { error: ruleError } = await supabase
      .from("process_rules")
      .update({ status: "approved", approved_by: user.id, approved_at: now })
      .eq("process_id", id);
    if (ruleError) throw ruleError;
    let memberQuery = supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", membership.organization_id)
      .eq("permission_level", "employee");
    if (roleId) memberQuery = memberQuery.eq("role_id", roleId);
    const { data: members } = await memberQuery;
    if (members?.length) {
      const { error: trainingError } = await supabase
        .from("training_assignments")
        .upsert(
          members.map((member) => ({
            organization_id: membership.organization_id,
            user_id: member.user_id,
            process_id: id,
            status: "assigned",
          })),
          { onConflict: "user_id,process_id", ignoreDuplicates: true },
        );
      if (trainingError) throw trainingError;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(
      error,
      "The process was saved, but Opryn could not index it. Please try approval again.",
    );
  }
}
