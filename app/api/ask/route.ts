import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
import {
  answerCompanyQuestion,
  embedKnowledge,
  type RetrievedKnowledge,
} from "@/lib/ai/services";

const schema = z.object({ question: z.string().trim().min(3).max(4000) });
export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Ask a complete question." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  const { data: settings } = await supabase
    .from("organization_settings")
    .select("employees_can_ask, allow_escalations, confidence_threshold")
    .eq("organization_id", membership.organization_id)
    .single();
  if (settings && !settings.employees_can_ask)
    return NextResponse.json(
      { error: "Ask Opryn is disabled for this workspace." },
      { status: 403 },
    );
  try {
    const [embedding] = await embedKnowledge([parsed.data.question]);
    const { data, error: searchError } = await supabase.rpc("match_knowledge", {
      target_organization_id: membership.organization_id,
      query_embedding: embedding,
      target_role_id: membership.role_id,
      // Vector similarity only decides which approved sources the model reads.
      // Answer confidence is evaluated separately below.
      match_threshold: 0.3,
      match_count: 15,
    });
    if (searchError) throw searchError;
    const knowledge = (data ?? []) as RetrievedKnowledge[];
    const answer = knowledge.length
      ? await answerCompanyQuestion(parsed.data.question, knowledge)
      : {
          can_answer: false,
          confidence: 0,
          answer: "",
          cited_source_ids: [],
        };
    const answerThreshold = settings?.confidence_threshold ?? 0.72;
    if (
      !answer.can_answer ||
      answer.confidence < answerThreshold ||
      !answer.answer.trim()
    ) {
      const { data: question, error } = await supabase
        .from("employee_questions")
        .insert({
          organization_id: membership.organization_id,
          asked_by: user.id,
          question: parsed.data.question,
          status: "needs_owner",
          answered_by_opryn: false,
          escalated: false,
          relevance_score: knowledge[0]?.similarity ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({
        type: "unknown",
        questionId: question.id,
        canEscalate: settings?.allow_escalations ?? true,
        closest: knowledge[0]
          ? {
              content: knowledge[0].content,
              processId: knowledge[0].process_id,
            }
          : null,
      });
    }
    const cited = knowledge.filter((item) =>
      answer.cited_source_ids.includes(item.id),
    );
    if (!cited.length)
      throw new Error("The answer did not cite approved knowledge.");
    const { data: question, error: questionError } = await supabase
      .from("employee_questions")
      .insert({
        organization_id: membership.organization_id,
        asked_by: user.id,
        question: parsed.data.question,
        status: "answered",
        answered_by_opryn: true,
        escalated: false,
        related_process_id: cited[0].process_id,
        relevance_score: cited[0].similarity,
      })
      .select("id")
      .single();
    if (questionError) throw questionError;
    const { error: answerError } = await supabase
      .from("question_answers")
      .insert({
        organization_id: membership.organization_id,
        question_id: question.id,
        answer: answer.answer,
        answered_by: null,
        answer_type: "opryn",
      });
    if (answerError) throw answerError;
    const { error: sourcesError } = await supabase
      .from("question_sources")
      .insert(
        cited.map((item) => ({
          organization_id: membership.organization_id,
          question_id: question.id,
          knowledge_chunk_id: item.id,
          similarity: item.similarity,
        })),
      );
    if (sourcesError) throw sourcesError;
    return NextResponse.json({
      type: "answer",
      questionId: question.id,
      answer: answer.answer,
      sources: cited.map((item) => ({
        id: item.id,
        label: sourceLabel(item.source_type, item.content),
        href: item.process_id ? `/app/processes/${item.process_id}` : null,
        content: item.content,
      })),
    });
  } catch (error) {
    return apiError(
      error,
      "Opryn couldn't search your company knowledge right now. Please try again.",
    );
  }
}
function sourceLabel(type: string, content: string) {
  const label: Record<string, string> = {
    process_summary: "Process overview",
    process_step: "Process step",
    rule: "Company rule",
    exception: "Process exception",
    owner_answer: "Owner answer",
    role_instruction: "Role instruction",
  };
  return `${label[type] ?? "Company knowledge"} → ${content.split(/[.:]/)[0].slice(0, 80)}`;
}
