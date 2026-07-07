import { NextRequest, NextResponse } from "next/server";
import { updateActionStatus } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { taskIndex, status } = await req.json();
  await updateActionStatus(id, taskIndex, status);
  return NextResponse.json({ ok: true });
}