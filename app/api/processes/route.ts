import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getRequestContext, apiError } from "@/lib/api";
import { extractProcess } from "@/lib/ai/services";
import { replaceExtractedProcess } from "@/lib/processes";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(3000).default(""),
  roleId: z.string().uuid().nullable().optional(),
  inputType: z.enum(["text", "media"]),
  explanation: z.string().trim().max(100000).optional(),
  file: z
    .object({
      name: z.string().min(1).max(500),
      type: z.string().min(1),
      size: z
        .number()
        .int()
        .positive()
        .max(25 * 1024 * 1024),
    })
    .optional(),
});
const allowed = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
]);

export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the process details and try again." },
      { status: 400 },
    );
  if (parsed.data.inputType === "text" && !parsed.data.explanation)
    return NextResponse.json(
      { error: "Explain the process before continuing." },
      { status: 400 },
    );
  if (
    parsed.data.inputType === "media" &&
    (!parsed.data.file || !allowed.has(parsed.data.file.type))
  )
    return NextResponse.json(
      { error: "Upload an MP4, MOV, WEBM, MP3, WAV, or M4A file up to 25 MB." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  try {
    const { data: process, error } = await supabase
      .from("processes")
      .insert({
        organization_id: membership.organization_id,
        title: parsed.data.title,
        description: parsed.data.description,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (parsed.data.roleId) {
      const { error: roleError } = await supabase
        .from("process_role_assignments")
        .insert({
          organization_id: membership.organization_id,
          process_id: process.id,
          role_id: parsed.data.roleId,
        });
      if (roleError) throw roleError;
    }
    if (parsed.data.inputType === "text") {
      const extracted = await extractProcess(
        parsed.data.explanation!,
        parsed.data.title,
      );
      await replaceExtractedProcess(
        supabase,
        process.id,
        membership.organization_id,
        user.id,
        extracted,
      );
      return NextResponse.json({ processId: process.id, ready: true });
    }
    const extension =
      parsed.data
        .file!.name.split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase() || "media";
    const storagePath = `${membership.organization_id}/${process.id}/${randomUUID()}.${extension}`;
    const { data: media, error: mediaError } = await supabase
      .from("media_uploads")
      .insert({
        organization_id: membership.organization_id,
        process_id: process.id,
        uploaded_by: user.id,
        storage_path: storagePath,
        original_name: parsed.data.file!.name,
        mime_type: parsed.data.file!.type,
        size_bytes: parsed.data.file!.size,
      })
      .select("id")
      .single();
    if (mediaError) throw mediaError;
    return NextResponse.json({
      processId: process.id,
      mediaId: media.id,
      storagePath,
      ready: false,
    });
  } catch (error) {
    return apiError(error, "Unable to create this process.");
  }
}
