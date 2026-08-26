import "server-only";
import { toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  companyAnswerSchema,
  employeeImageCaseSchema,
  extractedProcessSchema,
  processRecommendationsSchema,
  suggestedRuleSchema,
  type ExtractedProcess,
  type ProcessRecommendations,
} from "@/lib/ai/schemas";
import { OPENAI_MODELS, OPENAI_TEXT_REASONING } from "@/lib/ai/config";
import { getOpenAI } from "@/lib/ai/openai";

export type AITrace = {
  organizationId?: string;
  uploadId?: string;
  processId?: string;
};

export async function transcribeAudio(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  trace: AITrace = {},
) {
  logAI("Starting transcription", trace, {
    model: OPENAI_MODELS.transcription,
  });
  const file = await toFile(buffer, fileName, { type: mimeType });
  const result = await getOpenAI().audio.transcriptions.create({
    file,
    model: OPENAI_MODELS.transcription,
    response_format: "json",
  });
  if (!result.text?.trim())
    throw new Error("The recording did not contain usable speech.");
  logAI("Transcription complete", trace, {
    model: OPENAI_MODELS.transcription,
  });
  return {
    text: result.text.trim(),
    segments: null,
    model: OPENAI_MODELS.transcription,
  };
}

export async function extractProcessFromTranscript(
  transcript: string,
  preferredTitle?: string,
  trace: AITrace = {},
): Promise<ExtractedProcess> {
  logAI("Starting process extraction", trace, {
    model: OPENAI_MODELS.text,
  });
  const response = await getOpenAI().responses.parse({
    model: OPENAI_MODELS.text,
    reasoning: OPENAI_TEXT_REASONING,
    instructions:
      "Turn an owner's explanation into a practical company process. Extract only what they actually said. Never invent rules, thresholds, tools, or exceptions. Put every material uncertainty in clarification_questions. Keep language plain and useful to a small-business employee.",
    input: `Preferred title: ${preferredTitle || "Choose a clear title"}\n\nOWNER EXPLANATION:\n${transcript}`,
    text: { format: zodTextFormat(extractedProcessSchema, "opryn_process") },
  });
  if (!response.output_parsed)
    throw new Error("Opryn returned an invalid process structure.");
  const extracted = extractedProcessSchema.parse(response.output_parsed);
  logAI("Process extraction complete", trace, {
    model: OPENAI_MODELS.text,
  });
  return extracted;
}

export async function embedKnowledge(contents: string[]) {
  if (!contents.length) return [];
  const response = await getOpenAI().embeddings.create({
    model: OPENAI_MODELS.embedding,
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

export type EmployeeQuestionImage = {
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};

export async function analyzeEmployeeQuestionImage(
  question: string,
  image: EmployeeQuestionImage,
) {
  const response = await getOpenAI().responses.parse({
    model: OPENAI_MODELS.text,
    reasoning: OPENAI_TEXT_REASONING,
    instructions:
      "Inspect an image attached to an employee's company question. Describe only concrete visible facts and legible text. Do not diagnose equipment, identify a person, infer hidden causes, or give advice. Create a concise semantic-search query that combines the employee's words with the visible objects, labels, error text, paperwork, or conditions most likely to match an approved company process or rule.",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: `EMPLOYEE QUESTION:\n${question}` },
          {
            type: "input_image",
            image_url: image.dataUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(employeeImageCaseSchema, "employee_image_case"),
    },
  });
  if (!response.output_parsed)
    throw new Error("Opryn could not understand the attached image.");
  return employeeImageCaseSchema.parse(response.output_parsed);
}

export async function answerCompanyQuestion(
  question: string,
  knowledge: RetrievedKnowledge[],
  image?: EmployeeQuestionImage & { description: string; visibleText: string },
) {
  const context = knowledge
    .map((item) => `<source id="${item.id}">${item.content}</source>`)
    .join("\n");
  const response = await getOpenAI().responses.parse({
    model: OPENAI_MODELS.text,
    reasoning: OPENAI_TEXT_REASONING,
    instructions:
      "You are Opryn, an assistant for one specific business. Answer employees only from the supplied, approved company knowledge. An attached image may establish visible situational facts, but it is never a source of company policy or permission. Never diagnose a hidden cause from an image. Never use general knowledge to invent company policies, procedures, limits, permissions, exceptions, repairs, or safety instructions. Answer the supported part when the approved sources clearly contain it. If the image is unclear, the context is insufficient, or the sources conflict, set can_answer=false, leave answer/headline/important_note empty, and return no steps. Set confidence from 0 to 1 based only on how directly and completely the approved sources support the answer for the visible situation. For supported answers, give a short useful headline, a direct explanation, actionable steps only when the source supports them, and one important note only when the sources contain a warning, approval boundary, exception, or decision rule. Cite every source ID that directly supports the answer.",
    input: image
      ? [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `EMPLOYEE QUESTION:\n${question}\n\nVISIBLE IMAGE OBSERVATION:\n${image.description}\n\nVISIBLE TEXT:\n${image.visibleText || "None detected"}\n\nAPPROVED COMPANY KNOWLEDGE:\n${context || "No approved knowledge was found."}`,
              },
              {
                type: "input_image",
                image_url: image.dataUrl,
                detail: "high",
              },
            ],
          },
        ]
      : `EMPLOYEE QUESTION:\n${question}\n\nAPPROVED COMPANY KNOWLEDGE:\n${context || "No approved knowledge was found."}`,
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
    model: OPENAI_MODELS.text,
    reasoning: OPENAI_TEXT_REASONING,
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

export async function recommendProcesses(input: {
  industry: string;
  employeeCount: number;
  businessDescription: string;
  repeatedWork: string;
  hardestToHandoff: string;
  commonQuestions: string;
  ownerGoal: string;
}): Promise<ProcessRecommendations> {
  const response = await getOpenAI().responses.parse({
    model: OPENAI_MODELS.text,
    reasoning: OPENAI_TEXT_REASONING,
    instructions:
      "Create a practical starting plan for a small-business owner teaching Opryn how the company works. Recommend 4 to 6 specific processes worth capturing first. Prioritize work that is repeated, blocks delegation, causes employee questions, or depends on the owner. Do not recommend generic corporate documentation. Titles must describe real work. Each suggested_prompt should tell the owner what to demonstrate or explain naturally in one recording. Use plain language and only infer what is reasonably supported by the owner's answers.",
    input: `INDUSTRY: ${input.industry}\nEMPLOYEES: ${input.employeeCount}\nWHAT THE BUSINESS DOES: ${input.businessDescription}\nREPEATED WORK: ${input.repeatedWork}\nHARDEST TO HAND OFF: ${input.hardestToHandoff}\nCOMMON TEAM QUESTIONS: ${input.commonQuestions || "Not provided"}\nOWNER'S GOAL: ${input.ownerGoal || "Not provided"}`,
    text: {
      format: zodTextFormat(
        processRecommendationsSchema,
        "process_recommendations",
      ),
    },
  });
  if (!response.output_parsed)
    throw new Error("Opryn returned an invalid starting plan.");
  return processRecommendationsSchema.parse(response.output_parsed)
    .recommendations;
}

function logAI(
  message: string,
  trace: AITrace,
  details: Record<string, string> = {},
) {
  console.info(`[Opryn AI] ${message}`, {
    organizationId: trace.organizationId,
    uploadId: trace.uploadId,
    processId: trace.processId,
    ...details,
  });
}
