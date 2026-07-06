import { NextResponse } from "next/server";
import { getMemos } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const memos = getMemos();
  return NextResponse.json({ memos });
}
