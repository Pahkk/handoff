import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext, apiError } from "@/lib/api";
import { recommendProcesses } from "@/lib/ai/services";
import {
  fallbackRecommendations,
  prepareRecommendations,
} from "@/lib/recommendations";

const schema = z.object({
  businessDescription: z.string().trim().min(1).max(5000),
  repeatedWork: z.string().trim().min(1).max(5000),
  hardestToHandoff: z.string().trim().min(1).max(5000),
  commonQuestions: z.string().trim().max(5000).default(""),
  ownerGoal: z.string().trim().max(2000).default(""),
});

export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Tell Opryn about the work you want to hand off." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  try {
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("industry,employee_count")
      .eq("id", membership.organization_id)
      .single();
    if (organizationError) throw organizationError;
    const discovery = {
      industry: organization.industry,
      employeeCount: organization.employee_count,
      ...parsed.data,
    };
    const { error: discoveryError } = await supabase
      .from("organization_discovery")
      .upsert(
        {
          organization_id: membership.organization_id,
          business_description: parsed.data.businessDescription,
          repeated_work: parsed.data.repeatedWork,
          hardest_to_handoff: parsed.data.hardestToHandoff,
          common_questions: parsed.data.commonQuestions,
          owner_goal: parsed.data.ownerGoal,
          created_by: user.id,
        },
        { onConflict: "organization_id" },
      );
    if (discoveryError) throw discoveryError;

    let recommendations;
    try {
      recommendations = await recommendProcesses(discovery);
    } catch {
      recommendations = fallbackRecommendations(discovery);
    }
    recommendations = prepareRecommendations(recommendations, discovery);
    const { data: started } = await supabase
      .from("process_recommendations")
      .select("title")
      .eq("organization_id", membership.organization_id)
      .eq("status", "started");
    const startedTitles = new Set(
      (started ?? []).map((item) => item.title.toLowerCase()),
    );
    const fresh = recommendations.filter(
      (item) => !startedTitles.has(item.title.toLowerCase()),
    );
    const { error: clearError } = await supabase
      .from("process_recommendations")
      .delete()
      .eq("organization_id", membership.organization_id)
      .eq("status", "recommended");
    if (clearError) throw clearError;
    if (fresh.length) {
      const { error: saveError } = await supabase
        .from("process_recommendations")
        .insert(
          fresh.map((recommendation) => ({
            organization_id: membership.organization_id,
            created_by: user.id,
            ...recommendation,
          })),
        );
      if (saveError) throw saveError;
    }
    return NextResponse.json({ count: fresh.length });
  } catch (error) {
    return apiError(error, "Unable to build your starting plan.");
  }
}
