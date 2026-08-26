import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api";
import { ALLOWED_MEDIA_MIME_TYPES } from "@/lib/ai/media-types";
import {
  FeatureUnavailableError,
  requireFeature,
} from "@/lib/billing/subscription";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  callType: z.enum(["customer", "sales", "team", "other"]),
  originalName: z.string().trim().min(1).max(500),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive().max(104857600),
});

export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    !ALLOWED_MEDIA_MIME_TYPES.has(parsed.data?.mimeType ?? "")
  )
    return NextResponse.json(
      {
        error:
          "Upload an MP3, WAV, M4A, MP4, MOV, or WEBM recording under 100 MB.",
      },
      { status: 400 },
    );
  const organizationId = context.membership.organization_id;
  try {
    await requireFeature(context.supabase, organizationId, "callLearning");
    const { data: acknowledgment } = await context.supabase
      .from("call_privacy_acknowledgments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("acknowledged_by", context.user.id)
      .maybeSingle();
    if (!acknowledgment)
      return NextResponse.json(
        {
          error:
            "Confirm the call recording and privacy responsibility before uploading.",
        },
        { status: 403 },
      );
    const safeName = parsed.data.originalName
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 180);
    const storagePath = `${organizationId}/${context.user.id}/${randomUUID()}-${safeName}`;
    const { data, error } = await context.supabase
      .from("call_recordings")
      .insert({
        organization_id: organizationId,
        uploaded_by: context.user.id,
        title: parsed.data.title,
        call_type: parsed.data.callType,
        storage_path: storagePath,
        original_name: safeName,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.sizeBytes,
      })
      .select("id,storage_path")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof FeatureUnavailableError)
      return NextResponse.json(
        { error: error.message, code: "premium_required" },
        { status: 402 },
      );
    return NextResponse.json(
      { error: "Opryn could not prepare this call upload." },
      { status: 500 },
    );
  }
}
