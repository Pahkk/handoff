import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
import {
  answerCompanyQuestion,
  analyzeEmployeeQuestionImage,
  embedKnowledge,
  type EmployeeQuestionImage,
  type RetrievedKnowledge,
} from "@/lib/ai/services";

const allowedImageTypes = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const imageSchema = z.object({
  dataUrl: z.string().max(3_600_000),
  mimeType: allowedImageTypes,
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(2_621_440),
});
const schema = z.object({
  question: z.string().trim().min(3).max(4000),
  image: imageSchema.nullable().optional(),
});
export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Ask a complete question and attach a JPG, PNG, WEBP, or GIF under 2.5 MB.",
      },
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
    const image = parsed.data.image
      ? decodeImage(parsed.data.image)
      : undefined;
    const imageCase = image
      ? await analyzeEmployeeQuestionImage(parsed.data.question, image)
      : null;
    const retrievalQuery = imageCase
      ? `${parsed.data.question}\n${imageCase.knowledge_search_query}\n${imageCase.visible_text}`
      : parsed.data.question;
    const [embedding] = await embedKnowledge([retrievalQuery]);
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
      ? await answerCompanyQuestion(
          parsed.data.question,
          knowledge,
          image && imageCase
            ? {
                ...image,
                description: imageCase.description,
                visibleText: imageCase.visible_text,
              }
            : undefined,
        )
      : {
          can_answer: false,
          confidence: 0,
          headline: "",
          answer: "",
          steps: [],
          important_note: "",
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
      await saveQuestionImage({
        supabase,
        organizationId: membership.organization_id,
        userId: user.id,
        questionId: question.id,
        image,
        originalName: parsed.data.image?.name,
      });
      return NextResponse.json({
        type: "unknown",
        questionId: question.id,
        canEscalate: settings?.allow_escalations ?? true,
        imageAttached: Boolean(image),
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
    await saveQuestionImage({
      supabase,
      organizationId: membership.organization_id,
      userId: user.id,
      questionId: question.id,
      image,
      originalName: parsed.data.image?.name,
    });
    const { error: answerError } = await supabase
      .from("question_answers")
      .insert({
        organization_id: membership.organization_id,
        question_id: question.id,
        answer: [
          answer.answer,
          answer.steps.length
            ? answer.steps
                .map((step, index) => `${index + 1}. ${step}`)
                .join("\n")
            : "",
          answer.important_note,
        ]
          .filter(Boolean)
          .join("\n\n"),
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
      headline: answer.headline,
      answer: answer.answer,
      steps: answer.steps,
      importantNote: answer.important_note,
      imageAttached: Boolean(image),
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

function decodeImage(
  input: z.infer<typeof imageSchema>,
): EmployeeQuestionImage {
  const prefix = `data:${input.mimeType};base64,`;
  if (!input.dataUrl.startsWith(prefix))
    throw new Error("The attached image data is invalid.");
  const buffer = Buffer.from(input.dataUrl.slice(prefix.length), "base64");
  if (
    !buffer.length ||
    buffer.length > 2_621_440 ||
    buffer.length !== input.size
  )
    throw new Error("The attached image is too large or invalid.");
  return { dataUrl: input.dataUrl, mimeType: input.mimeType };
}

async function saveQuestionImage({
  supabase,
  organizationId,
  userId,
  questionId,
  image,
  originalName,
}: {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  organizationId: string;
  userId: string;
  questionId: string;
  image?: EmployeeQuestionImage;
  originalName?: string;
}) {
  if (!image) return;
  const extension: Record<EmployeeQuestionImage["mimeType"], string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const prefix = `data:${image.mimeType};base64,`;
  const buffer = Buffer.from(image.dataUrl.slice(prefix.length), "base64");
  const storagePath = `${organizationId}/${userId}/${randomUUID()}.${extension[image.mimeType]}`;
  const { error: uploadError } = await supabase.storage
    .from("ask-images")
    .upload(storagePath, buffer, {
      contentType: image.mimeType,
      upsert: false,
    });
  if (uploadError) throw uploadError;
  const { error: attachmentError } = await supabase
    .from("question_attachments")
    .insert({
      organization_id: organizationId,
      question_id: questionId,
      storage_path: storagePath,
      mime_type: image.mimeType,
      original_name: originalName || "case-image",
      size_bytes: buffer.length,
    });
  if (attachmentError) {
    await supabase.storage.from("ask-images").remove([storagePath]);
    throw attachmentError;
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
