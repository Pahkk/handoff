import { z } from "zod";

export const extractedProcessSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  purpose: z.string().min(1).max(5000),
  steps: z
    .array(
      z.object({
        order: z.number().int().positive(),
        title: z.string().min(1).max(300),
        description: z.string().max(10000),
      }),
    )
    .min(1)
    .max(100),
  rules: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        text: z.string().min(1).max(10000),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(100),
  exceptions: z.array(z.string().min(1).max(10000)).max(100),
  clarification_questions: z.array(z.string().min(1).max(2000)).max(20),
});

export const companyAnswerSchema = z.object({
  can_answer: z.boolean(),
  confidence: z.number().min(0).max(1),
  answer: z.string().max(10000),
  cited_source_ids: z.array(z.string().uuid()).max(15),
});

export const suggestedRuleSchema = z.object({
  title: z.string().min(1).max(200),
  rule: z.string().min(1).max(10000),
});

export type ExtractedProcess = z.infer<typeof extractedProcessSchema>;
