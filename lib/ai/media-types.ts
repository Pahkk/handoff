import "server-only";

export const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
]);

export const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  ...AUDIO_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
]);
