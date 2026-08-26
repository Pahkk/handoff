import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/api";
import {
  FeatureUnavailableError,
  requireFeature,
} from "@/lib/billing/subscription";

export async function POST() {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  try {
    await requireFeature(
      context.supabase,
      context.membership.organization_id,
      "callLearning",
    );
    const { error } = await context.supabase
      .from("call_privacy_acknowledgments")
      .upsert(
        {
          organization_id: context.membership.organization_id,
          acknowledged_by: context.user.id,
          acknowledged_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,acknowledged_by" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof FeatureUnavailableError)
      return NextResponse.json(
        { error: error.message, code: "premium_required" },
        { status: 402 },
      );
    return NextResponse.json(
      { error: "The privacy acknowledgment could not be saved." },
      { status: 500 },
    );
  }
}
