import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext, apiError } from "@/lib/api";
import { extractProcess, transcribeMedia } from "@/lib/ai/services";
import { replaceExtractedProcess } from "@/lib/processes";

const schema = z.object({ mediaId: z.string().uuid() });
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "The upload could not be identified." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  const { data: process } = await supabase
    .from("processes")
    .select("id, title")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  const { data: media } = await supabase
    .from("media_uploads")
    .select("*")
    .eq("id", parsed.data.mediaId)
    .eq("process_id", id)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  if (!process || !media?.storage_path)
    return NextResponse.json(
      { error: "This process upload was not found." },
      { status: 404 },
    );
  try {
    await supabase
      .from("media_uploads")
      .update({ status: "transcribing", error_message: null })
      .eq("id", media.id);
    const { data: download, error: downloadError } = await supabase.storage
      .from("process-media")
      .download(media.storage_path);
    if (downloadError) throw downloadError;
    const transcription = await transcribeMedia(
      Buffer.from(await download.arrayBuffer()),
      media.original_name,
      media.mime_type,
    );
    const { error: transcriptError } = await supabase
      .from("transcripts")
      .insert({
        organization_id: membership.organization_id,
        media_upload_id: media.id,
        process_id: id,
        transcript_text: transcription.text,
        segments: transcription.segments,
        created_by: user.id,
      });
    if (transcriptError) throw transcriptError;
    await supabase
      .from("media_uploads")
      .update({ status: "extracting" })
      .eq("id", media.id);
    const extracted = await extractProcess(transcription.text, process.title);
    await replaceExtractedProcess(
      supabase,
      id,
      membership.organization_id,
      user.id,
      extracted,
    );
    await supabase
      .from("media_uploads")
      .update({ status: "ready" })
      .eq("id", media.id);
    return NextResponse.json({ processId: id });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 1000)
        : "Processing failed";
    await supabase
      .from("media_uploads")
      .update({ status: "failed", error_message: message })
      .eq("id", media.id);
    return apiError(
      error,
      "Opryn couldn't learn this recording. Your file is safe, and you can retry.",
    );
  }
}
