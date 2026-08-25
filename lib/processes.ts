import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractedProcess } from "@/lib/ai/schemas";

export async function replaceExtractedProcess(
  supabase: SupabaseClient,
  processId: string,
  organizationId: string,
  userId: string,
  extracted: ExtractedProcess,
) {
  const { error: updateError } = await supabase
    .from("processes")
    .update({
      title: extracted.title,
      summary: extracted.summary,
      purpose: extracted.purpose,
      status: "needs_review",
    })
    .eq("id", processId)
    .eq("organization_id", organizationId);
  if (updateError) throw updateError;
  const tables = [
    "process_steps",
    "process_rules",
    "process_exceptions",
    "clarification_questions",
  ] as const;
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("process_id", processId)
      .eq("organization_id", organizationId);
    if (error) throw error;
  }
  if (extracted.steps.length) {
    const { error } = await supabase
      .from("process_steps")
      .insert(
        extracted.steps.map((step, index) => ({
          process_id: processId,
          organization_id: organizationId,
          step_order: index + 1,
          title: step.title,
          description: step.description,
        })),
      );
    if (error) throw error;
  }
  if (extracted.rules.length) {
    const { error } = await supabase
      .from("process_rules")
      .insert(
        extracted.rules.map((rule) => ({
          organization_id: organizationId,
          process_id: processId,
          title: rule.title,
          text: rule.text,
          status: "draft",
          confidence: rule.confidence,
          created_by: userId,
        })),
      );
    if (error) throw error;
  }
  if (extracted.exceptions.length) {
    const { error } = await supabase
      .from("process_exceptions")
      .insert(
        extracted.exceptions.map((text) => ({
          organization_id: organizationId,
          process_id: processId,
          text,
        })),
      );
    if (error) throw error;
  }
  if (extracted.clarification_questions.length) {
    const { error } = await supabase
      .from("clarification_questions")
      .insert(
        extracted.clarification_questions.map((question) => ({
          organization_id: organizationId,
          process_id: processId,
          question,
        })),
      );
    if (error) throw error;
  }
}
