import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
} from "@/lib/ai/media-types";

export { VIDEO_MIME_TYPES } from "@/lib/ai/media-types";

const inputExtensions: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export class UnsupportedRecordingError extends Error {
  constructor() {
    super(
      "We couldn't process this recording format. Please upload MP4, MOV, WEBM, MP3, WAV, or M4A.",
    );
    this.name = "UnsupportedRecordingError";
  }
}

export type PreparedAudio = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  extractedFromVideo: boolean;
};

export async function prepareTranscriptionAudio(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<PreparedAudio> {
  if (!buffer.length || !ALLOWED_MEDIA_MIME_TYPES.has(mimeType)) {
    throw new UnsupportedRecordingError();
  }

  if (AUDIO_MIME_TYPES.has(mimeType)) {
    return {
      buffer,
      fileName: safeFileName(originalName),
      mimeType,
      extractedFromVideo: false,
    };
  }

  if (!VIDEO_MIME_TYPES.has(mimeType) || !ffmpegPath) {
    throw new UnsupportedRecordingError();
  }

  const workingDirectory = await mkdtemp(path.join(tmpdir(), "opryn-media-"));
  const inputPath = path.join(
    workingDirectory,
    `input.${inputExtensions[mimeType] ?? "video"}`,
  );
  const outputPath = path.join(workingDirectory, "audio.mp3");

  try {
    await writeFile(inputPath, buffer);
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-nostdin",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "64k",
      "-f",
      "mp3",
      outputPath,
    ]);
    const audio = await readFile(outputPath);
    if (!audio.length) throw new UnsupportedRecordingError();
    return {
      buffer: audio,
      fileName: `${path.parse(safeFileName(originalName)).name || "recording"}.mp3`,
      mimeType: "audio/mpeg",
      extractedFromVideo: true,
    };
  } catch (error) {
    if (error instanceof UnsupportedRecordingError) throw error;
    throw new UnsupportedRecordingError();
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

function safeFileName(fileName: string) {
  const baseName = path.basename(fileName);
  return (
    baseName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "recording"
  );
}

async function runFfmpeg(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath!, args, {
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 4000) stderr += chunk.toString();
    });
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Audio extraction timed out."));
    }, 90_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`Audio extraction failed (${code}): ${stderr}`));
    });
  });
}
