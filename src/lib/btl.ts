import OpenAI from "openai";

// BTL Runtime client (chat completions + embeddings)
export const btlClient = new OpenAI({
  apiKey: process.env.BTL_RUNTIME_API_KEY!,
  baseURL: "https://api.badtheorylabs.com/v1",
});

// OpenAI client (Whisper transcription only)
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export const BTL_MODEL = "btl-2";
export const BTL_EMBED_MODEL = "text-embedding-3-small";