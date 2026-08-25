import "server-only";

function configuredModel(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export const OPENAI_MODELS = Object.freeze({
  text: configuredModel("OPENAI_TEXT_MODEL", "gpt-5.6-luna"),
  transcription: configuredModel(
    "OPENAI_TRANSCRIPTION_MODEL",
    "gpt-transcribe",
  ),
  embedding: configuredModel(
    "OPENAI_EMBEDDING_MODEL",
    "text-embedding-3-small",
  ),
});

// Preserve the previous low-latency reasoning behavior while moving Opryn's
// structured text work to the centrally configured model.
export const OPENAI_TEXT_REASONING = Object.freeze({
  effort: "none" as const,
});
