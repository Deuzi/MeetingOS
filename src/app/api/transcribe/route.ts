import { NextRequest, NextResponse } from "next/server";
import { openaiClient } from "@/lib/btl";
import { toFile } from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const openaiFile = await toFile(buffer, file.name || "audio.webm", {
      type: file.type || "audio/webm",
    });

    const transcription = await openaiClient.audio.transcriptions.create({
      file: openaiFile,
      model: "whisper-large-v3",
      language: "en",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
