import { NextResponse } from "next/server";
import { z } from "zod";
import { embedKnowledge } from "@/lib/ai/services";
import { getRequestContext } from "@/lib/api";
import {
  FeatureUnavailableError,
  requireFeature,
} from "@/lib/billing/subscription";

const schema = z.object({
  action: z.enum(["approve", "ignore"]),
  title: z.string().trim().min(1).max(250).optional(),
  content: z.string().trim().min(1).max(10000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; findingId: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a valid review action." },
      { status: 400 },
    );
  const { id, findingId } = await params;
  const organizationId = context.membership.organization_id;
  try {
    await requireFeature(context.supabase, organizationId, "callLearning");
    const { data: finding } = await context.supabase
      .from("call_findings")
      .select("*")
      .eq("id", findingId)
      .eq("call_id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!finding)
      return NextResponse.json(
        { error: "Call finding not found." },
        { status: 404 },
      );
    if (parsed.data.action === "ignore") {
      if (finding.knowledge_chunk_id)
        await context.supabase
          .from("knowledge_chunks")
          .delete()
          .eq("id", finding.knowledge_chunk_id)
          .eq("organization_id", organizationId);
      const { error } = await context.supabase
        .from("call_findings")
        .update({
          status: "ignored",
          knowledge_chunk_id: null,
          approved_by: null,
          approved_at: null,
        })
        .eq("id", findingId)
        .eq("organization_id", organizationId);
      if (error) throw error;
      await finishCallReviewIfComplete(context.supabase, id, organizationId);
      return NextResponse.json({ status: "ignored" });
    }
    const title = parsed.data.title ?? finding.title;
    const content = parsed.data.content ?? finding.content;
    const [embedding] = await embedKnowledge([`${title}\n${content}`]);
    let chunkId = finding.knowledge_chunk_id as string | null;
    if (chunkId) {
      const { error } = await context.supabase
        .from("knowledge_chunks")
        .update({ content: `${title}\n${content}`, embedding, approved: true })
        .eq("id", chunkId)
        .eq("organization_id", organizationId);
      if (error) throw error;
    } else {
      const { data, error } = await context.supabase
        .from("knowledge_chunks")
        .insert({
          organization_id: organizationId,
          content: `${title}\n${content}`,
          embedding,
          source_type: "call_finding",
          source_id: findingId,
          approved: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      chunkId = data.id;
    }
    const { error } = await context.supabase
      .from("call_findings")
      .update({
        title,
        content,
        status: "approved",
        approved_by: context.user.id,
        approved_at: new Date().toISOString(),
        knowledge_chunk_id: chunkId,
      })
      .eq("id", findingId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    await finishCallReviewIfComplete(context.supabase, id, organizationId);
    return NextResponse.json({ status: "approved" });
  } catch (error) {
    if (error instanceof FeatureUnavailableError)
      return NextResponse.json({ error: error.message }, { status: 402 });
    return NextResponse.json(
      { error: "This finding could not be updated." },
      { status: 500 },
    );
  }
}

async function finishCallReviewIfComplete(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  callId: string,
  organizationId: string,
) {
  const { count, error } = await supabase
    .from("call_findings")
    .select("id", { count: "exact", head: true })
    .eq("call_id", callId)
    .eq("organization_id", organizationId)
    .in("status", ["observed", "unknown"]);
  if (error) throw error;
  if (!count) {
    const { error: callError } = await supabase
      .from("call_recordings")
      .update({ status: "approved" })
      .eq("id", callId)
      .eq("organization_id", organizationId);
    if (callError) throw callError;
  }
}
