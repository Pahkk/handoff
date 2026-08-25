import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendProcesses } from "@/lib/ai/services";
import {
  fallbackRecommendations,
  prepareRecommendations,
} from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  industry: z.string().trim().min(1).max(100),
  employeeCount: z.coerce.number().int().min(0).max(100000),
  ownerRole: z.string().trim().min(1).max(120),
  businessDescription: z.string().trim().min(1).max(5000),
  repeatedWork: z.string().trim().min(1).max(5000),
  hardestToHandoff: z.string().trim().min(1).max(5000),
  commonQuestions: z.string().trim().max(5000).default(""),
  ownerGoal: z.string().trim().max(2000).default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Review your business answers and try again." },
      { status: 400 },
    );
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const { data, error } = await supabase.rpc("create_organization", {
    business_name: parsed.data.name,
    business_industry: parsed.data.industry,
    business_employee_count: parsed.data.employeeCount,
    owner_job_title: parsed.data.ownerRole,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  const organizationId = String(data);
  const discovery = {
    industry: parsed.data.industry,
    employeeCount: parsed.data.employeeCount,
    businessDescription: parsed.data.businessDescription,
    repeatedWork: parsed.data.repeatedWork,
    hardestToHandoff: parsed.data.hardestToHandoff,
    commonQuestions: parsed.data.commonQuestions,
    ownerGoal: parsed.data.ownerGoal,
  };
  const { error: discoveryError } = await supabase
    .from("organization_discovery")
    .insert({
      organization_id: organizationId,
      business_description: discovery.businessDescription,
      repeated_work: discovery.repeatedWork,
      hardest_to_handoff: discovery.hardestToHandoff,
      common_questions: discovery.commonQuestions,
      owner_goal: discovery.ownerGoal,
      created_by: userData.user.id,
    });
  if (discoveryError)
    console.error("Unable to save onboarding discovery", {
      code: discoveryError.code,
    });

  let recommendations;
  try {
    recommendations = await recommendProcesses(discovery);
  } catch (recommendationError) {
    console.error(
      "Unable to personalize onboarding recommendations",
      recommendationError instanceof Error
        ? {
            name: recommendationError.name,
            message: recommendationError.message,
          }
        : { message: "Unknown error" },
    );
    recommendations = fallbackRecommendations(discovery);
  }
  recommendations = prepareRecommendations(recommendations, discovery);
  const { error: recommendationSaveError } = await supabase
    .from("process_recommendations")
    .insert(
      recommendations.map((recommendation) => ({
        organization_id: organizationId,
        created_by: userData.user.id,
        ...recommendation,
      })),
    );
  if (recommendationSaveError)
    console.error("Unable to save process recommendations", {
      code: recommendationSaveError.code,
    });

  const response = NextResponse.json({
    organizationId,
    recommendationsReady: !recommendationSaveError,
  });
  response.cookies.set("opryn-organization", String(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
