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
