import "server-only";
import { toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  companyAnswerSchema,
  extractedProcessSchema,
  suggestedRuleSchema,
  type ExtractedProcess,
} from "@/lib/ai/schemas";
import { getOpenAI } from "@/lib/ai/openai";

export async function transcribeMedia(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
) {
  const file = await toFile(buffer, fileName, { type: mimeType });
  const result = await getOpenAI().audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    response_format: "json",
  });
  if (!result.text?.trim())
    throw new Error("The recording did not contain usable speech.");
  return { text: result.text.trim(), segments: null };
}

export async function extractProcess(
  transcript: string,
  preferredTitle?: string,
): Promise<ExtractedProcess> {
  const response = await getOpenAI().responses.parse({
    model: "gpt-5.4-mini",
    instructions:
      "Turn an owner's explanation into a practical company process. Extract only what they actually said. Never invent rules, thresholds, tools, or exceptions. Put every material uncertainty in clarification_questions. Keep language plain and useful to a small-business employee.",
    input: `Preferred title: ${preferredTitle || "Choose a clear title"}\n\nOWNER EXPLANATION:\n${transcript}`,
    text: { format: zodTextFormat(extractedProcessSchema, "opryn_process") },
  });
  if (!response.output_parsed)
    throw new Error("Opryn returned an invalid process structure.");
  return extractedProcessSchema.parse(response.output_parsed);
}

export async function embedKnowledge(contents: string[]) {
  if (!contents.length) return [];
  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: contents,
    encoding_format: "float",
  });
  return response.data.map((item) => item.embedding);
}

export type RetrievedKnowledge = {
  id: string;
  content: string;
  source_type: string;
  source_id: string;
  process_id: string | null;
  rule_id: string | null;
  role_id: string | null;
  similarity: number;
};

export async function answerCompanyQuestion(
  question: string,
  knowledge: RetrievedKnowledge[],
) {
  const context = knowledge
    .map((item) => `<source id="${item.id}">${item.content}</source>`)
    .join("\n");
  const response = await getOpenAI().responses.parse({
    model: "gpt-5.4-mini",
    instructions:
      "You answer employees using only the supplied, approved company knowledge. Never use general knowledge to invent company policy. If the context does not directly and completely support an answer, set can_answer=false and leave answer empty. If sources conflict, set can_answer=false. When answering, use simple language and cite only source IDs that directly support the answer.",
    input: `EMPLOYEE QUESTION:\n${question}\n\nAPPROVED COMPANY KNOWLEDGE:\n${context || "No approved knowledge was found."}`,
    text: { format: zodTextFormat(companyAnswerSchema, "company_answer") },
  });
  if (!response.output_parsed)
    throw new Error("Opryn returned an invalid answer.");
  return companyAnswerSchema.parse(response.output_parsed);
}

export async function suggestRuleFromOwnerAnswer(
  question: string,
  ownerAnswer: string,
) {
  const response = await getOpenAI().responses.parse({
    model: "gpt-5.4-mini",
    instructions:
      "Convert the owner's answer into one concise, reusable company rule. Preserve conditions and exceptions exactly. Do not add anything. Give it a short descriptive title.",
    input: `EMPLOYEE QUESTION:\n${question}\n\nOWNER ANSWER:\n${ownerAnswer}`,
    text: {
      format: zodTextFormat(suggestedRuleSchema, "suggested_company_rule"),
    },
  });
  if (!response.output_parsed)
    throw new Error("Opryn returned an invalid suggested rule.");
  return suggestedRuleSchema.parse(response.output_parsed);
}
