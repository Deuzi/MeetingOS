import { Redis } from "@upstash/redis";
import type { Memo, Extraction } from "@/types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MEMOS_KEY = "meetingos:memos";

async function readMemos(): Promise<Memo[]> {
  try {
    const memos = await redis.get<Memo[]>(MEMOS_KEY);
    return memos || [];
  } catch {
    return [];
  }
}

async function writeMemos(memos: Memo[]): Promise<void> {
  await redis.set(MEMOS_KEY, memos);
}

export async function createMemo(params: {
  id: string;
  filename?: string;
  duration?: number;
  transcript: string;
  summary?: string;
  extraction: Extraction;
  hasFlags: boolean;
  embeddingId?: string;
}): Promise<Memo> {
  const memos = await readMemos();
  const memo: Memo = {
    id: params.id,
    createdAt: new Date().toISOString(),
    filename: params.filename,
    duration: params.duration,
    transcript: params.transcript,
    summary: params.summary,
    extraction: params.extraction,
    hasFlags: params.hasFlags,
    flagAcked: false,
    embeddingId: params.embeddingId,
  };
  memos.unshift(memo);
  await writeMemos(memos);
  return memo;
}

export async function getMemos(): Promise<Memo[]> {
  return readMemos();
}

export async function getMemoById(id: string): Promise<Memo | null> {
  const memos = await readMemos();
  return memos.find((m) => m.id === id) || null;
}

export async function ackMemoFlag(id: string): Promise<void> {
  const memos = await readMemos();
  const memo = memos.find((m) => m.id === id);
  if (memo) {
    memo.flagAcked = true;
    await writeMemos(memos);
  }
}

export async function updateActionStatus(
  memoId: string,
  taskIndex: number,
  status: "open" | "closed"
): Promise<void> {
  const memos = await readMemos();
  const memo = memos.find((m) => m.id === memoId);
  if (memo) {
    if (memo.extraction.action_items[taskIndex]) {
      memo.extraction.action_items[taskIndex].status = status;
      await writeMemos(memos);
    }
  }
}

export async function deleteMemo(id: string): Promise<void> {
  const memos = await readMemos();
  await writeMemos(memos.filter((m) => m.id !== id));
}