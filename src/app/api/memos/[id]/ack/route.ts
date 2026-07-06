import { NextRequest, NextResponse } from "next/server";
import { ackMemoFlag } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  ackMemoFlag(id);
  return NextResponse.json({ ok: true });
}
