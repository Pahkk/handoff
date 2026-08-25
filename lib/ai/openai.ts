import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY)
    throw new Error(
      "Opryn's learning service is not configured yet. Add OPENAI_API_KEY to the server environment.",
    );
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export function humanizeAIError(error: unknown) {
  console.error(
    "Opryn AI operation failed",
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: "Unknown error" },
  );
  if (error instanceof Error && error.message.includes("not configured"))
    return error.message;
  return "Opryn couldn't finish learning this right now. Your upload is safe—please retry in a moment.";
}
