import { NextRequest, NextResponse } from "next/server";
import { getMemoById, deleteMemo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const memo = await getMemoById(id);
  if (!memo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ memo });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteMemo(id);
  return NextResponse.json({ ok: true });
}