import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OPENAI_MODELS } from "@/lib/ai/config";
import {
  prepareTranscriptionAudio,
  UnsupportedRecordingError,
  VIDEO_MIME_TYPES,
} from "@/lib/ai/media";
import {
  extractProcessFromTranscript,
  transcribeAudio,
} from "@/lib/ai/services";
import { getRequestContext } from "@/lib/api";
import { replaceExtractedProcess } from "@/lib/processes";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({ mediaId: z.string().uuid() });
type ProcessingStage =
  | "uploaded"
  | "extracting_audio"
  | "transcribing"
  | "transcribed"
  | "generating_process"
  | "needs_review";

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
  const organizationId = membership.organization_id;
  const [{ data: process }, { data: media }] = await Promise.all([
    supabase
      .from("processes")
      .select("id, title, status")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("media_uploads")
      .select("*")
      .eq("id", parsed.data.mediaId)
      .eq("process_id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);
  if (!process || !media?.storage_path)
    return NextResponse.json(
      { error: "This process upload was not found." },
      { status: 404 },
    );

  const trace = {
    organizationId,
    uploadId: media.id,
    processId: id,
  };
  const { data: savedTranscript, error: transcriptLookupError } = await supabase
    .from("transcripts")
    .select("id, transcript_text, transcription_model")
    .eq("organization_id", organizationId)
    .eq("media_upload_id", media.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (transcriptLookupError)
    return processingErrorResponse(
      transcriptLookupError,
      trace,
      "uploaded",
      false,
    );

  if (
    savedTranscript &&
    ["needs_review", "ready"].includes(media.status) &&
    process.status === "needs_review"
  ) {
    return NextResponse.json({
      processId: id,
      reusedTranscript: true,
      status: "needs_review",
    });
  }

  if (!["uploaded", "failed"].includes(media.status)) {
    return NextResponse.json(
      {
        error: "Opryn is already processing this recording.",
        status: media.status,
      },
      { status: 409 },
    );
  }

  let stage: ProcessingStage = savedTranscript
    ? "generating_process"
    : VIDEO_MIME_TYPES.has(media.mime_type)
      ? "extracting_audio"
      : "transcribing";
  const { data: claimed, error: claimError } = await supabase
    .from("media_uploads")
    .update({ status: stage, error_message: null })
    .eq("id", media.id)
    .eq("organization_id", organizationId)
    .eq("status", media.status)
    .select("id")
    .maybeSingle();
  if (claimError)
    return processingErrorResponse(
      claimError,
      trace,
      stage,
      Boolean(savedTranscript),
    );
  if (!claimed)
    return NextResponse.json(
      { error: "Opryn is already processing this recording." },
      { status: 409 },
    );

  let transcript = savedTranscript;
  try {
    if (transcript) {
      console.info("[Opryn AI] Reusing saved transcript", {
        ...trace,
        transcriptionModel: transcript.transcription_model,
      });
    } else {
      const { data: download, error: downloadError } = await supabase.storage
        .from("process-media")
        .download(media.storage_path);
      if (downloadError) throw downloadError;

      if (VIDEO_MIME_TYPES.has(media.mime_type)) {
        console.info("[Opryn AI] Starting audio extraction", trace);
      }
      const prepared = await prepareTranscriptionAudio(
        Buffer.from(await download.arrayBuffer()),
        media.original_name,
        media.mime_type,
      );
      if (prepared.extractedFromVideo) {
        console.info("[Opryn AI] Audio extraction complete", trace);
      }

      stage = "transcribing";
      await updateMediaStatus(supabase, media.id, organizationId, stage);
      const transcription = await transcribeAudio(
        prepared.buffer,
        prepared.fileName,
        prepared.mimeType,
        trace,
      );
      const { data: insertedTranscript, error: transcriptError } =
        await supabase
          .from("transcripts")
          .insert({
            organization_id: organizationId,
            media_upload_id: media.id,
            process_id: id,
            transcript_text: transcription.text,
            transcription_model: transcription.model,
            segments: transcription.segments,
            created_by: user.id,
          })
          .select("id, transcript_text, transcription_model")
          .single();
      if (transcriptError) throw transcriptError;
      transcript = insertedTranscript;
      stage = "transcribed";
      await updateMediaStatus(supabase, media.id, organizationId, stage);
    }

    stage = "generating_process";
    await updateMediaStatus(supabase, media.id, organizationId, stage);
    const extracted = await extractProcessFromTranscript(
      transcript.transcript_text,
      process.title,
      trace,
    );
    await replaceExtractedProcess(
      supabase,
      id,
      organizationId,
      user.id,
      extracted,
      { model: OPENAI_MODELS.text, transcriptId: transcript.id },
    );
    stage = "needs_review";
    await updateMediaStatus(supabase, media.id, organizationId, stage);
    return NextResponse.json({
      processId: id,
      reusedTranscript: Boolean(savedTranscript),
      status: stage,
    });
  } catch (error) {
    await supabase
      .from("media_uploads")
      .update({
        status: "failed",
        error_message: safeStoredError(error, stage),
      })
      .eq("id", media.id)
      .eq("organization_id", organizationId);
    return processingErrorResponse(error, trace, stage, Boolean(transcript));
  }
}

async function updateMediaStatus(
  supabase: SupabaseClient,
  mediaId: string,
  organizationId: string,
  status: ProcessingStage,
) {
  const { error } = await supabase
    .from("media_uploads")
    .update({ status, error_message: null })
    .eq("id", mediaId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

function processingErrorResponse(
  error: unknown,
  trace: { organizationId: string; uploadId: string; processId: string },
  stage: ProcessingStage,
  hasTranscript: boolean,
) {
  console.error("[Opryn AI] Processing failed", {
    ...trace,
    stage,
    error: safeErrorDetails(error),
  });
  const message =
    error instanceof UnsupportedRecordingError
      ? error.message
      : hasTranscript || stage === "generating_process"
        ? "The recording was transcribed, but Opryn couldn't generate the process. Please retry process generation."
        : "Opryn couldn't transcribe this recording. Your upload has been saved. Please try again.";
  return NextResponse.json(
    {
      error: message,
      canRetry: true,
      processId: trace.processId,
      mediaId: trace.uploadId,
      stage,
    },
    { status: 500 },
  );
}

function safeStoredError(error: unknown, stage: ProcessingStage) {
  if (error instanceof UnsupportedRecordingError) return error.message;
  const kind = error instanceof Error ? error.name : "UnknownError";
  return `${stage}: ${kind}`.slice(0, 1000);
}

function safeErrorDetails(error: unknown) {
  if (error instanceof UnsupportedRecordingError)
    return { name: error.name, message: error.message };
  if (!(error instanceof Error)) return { name: "UnknownError" };
  const apiError = error as Error & {
    status?: number;
    code?: string;
    type?: string;
  };
  return {
    name: apiError.name,
    status: apiError.status,
    code: apiError.code,
    type: apiError.type,
  };
}
