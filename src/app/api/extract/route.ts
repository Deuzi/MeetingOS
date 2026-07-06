import { NextRequest, NextResponse } from "next/server";
import { extractFromTranscript } from "@/lib/extraction";
import { createMemo } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { transcript, filename, duration } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript" }, { status: 400 });
    }

    const memoId = uuidv4();
    const { extraction, summary } = await extractFromTranscript(transcript, memoId);
    const hasFlags = extraction.flags.some((f) => f.type === "conflict");

    const memo = createMemo({
      id: memoId,
      filename,
      duration,
      transcript,
      summary,
      extraction,
      hasFlags,
    });

    return NextResponse.json({ memo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
