import "server-only";
import type { ProcessRecommendations } from "@/lib/ai/schemas";

export function fallbackRecommendations(input: {
  repeatedWork: string;
  hardestToHandoff: string;
  commonQuestions: string;
}): ProcessRecommendations {
  return [
    {
      title: "The Work You Repeat Most",
      reason:
        "Start with work that happens often so the team can use it right away.",
      suggested_prompt: `Show how you handle this repeated work from beginning to end: ${input.repeatedWork}`,
      priority: 1,
    },
    {
      title: "The Task That Is Hardest to Hand Off",
      reason:
        "This is likely one of the biggest places the business still depends on you.",
      suggested_prompt: `Explain how you make decisions, what can go wrong, and what someone should do when handling: ${input.hardestToHandoff}`,
      priority: 2,
    },
    {
      title: "New Customer or Job Intake",
      reason:
        "A consistent first handoff prevents missed details and repeated questions.",
      suggested_prompt:
        "Walk through what happens from the first customer contact until the work is ready to begin. Include the information you collect and any approval rules.",
      priority: 3,
    },
    {
      title: "Common Questions and Exceptions",
      reason:
        "Teaching recurring answers can reduce interruptions immediately.",
      suggested_prompt: `Explain how employees should handle the questions and unusual situations that come up most often: ${input.commonQuestions || "the questions your team usually brings to you"}`,
      priority: 4,
    },
    {
      title: "End-of-Job Follow-Up",
      reason:
        "A clear finish protects quality, payment, and the customer experience.",
      suggested_prompt:
        "Show what should happen when work is finished, including customer follow-up, documentation, payment, and anything the owner needs to review.",
      priority: 5,
    },
  ];
}

export function prepareRecommendations(
  recommendations: ProcessRecommendations,
  input: Parameters<typeof fallbackRecommendations>[0],
) {
  const unique = new Map<string, ProcessRecommendations[number]>();
  for (const recommendation of [
    ...recommendations,
    ...fallbackRecommendations(input),
  ]) {
    const key = recommendation.title.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, recommendation);
  }
  return [...unique.values()].slice(0, 6);
}
