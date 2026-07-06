import type { Memo, Extraction } from "@/types";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const DB_PATH = join(process.cwd(), "data", "meetingos.json");

interface DBSchema {
  memos: DBMemo[];
}

interface DBMemo {
  id: string;
  createdAt: string;
  filename?: string;
  duration?: number;
  transcript: string;
  summary?: string;
  extraction: string;
  hasFlags: boolean;
  flagAcked: boolean;
  embeddingId?: string;
}

function readDB(): DBSchema {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(DB_PATH)) return { memos: [] };
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { memos: [] };
  }
}

function writeDB(db: DBSchema): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log("DB written —", db.memos.length, "memos at", DB_PATH);
}

export function createMemo(params: {
  id: string;
  filename?: string;
  duration?: number;
  transcript: string;
  summary?: string;
  extraction: Extraction;
  hasFlags: boolean;
  embeddingId?: string;
}): Memo {
  const db = readDB();
  const memo: DBMemo = {
    id: params.id,
    createdAt: new Date().toISOString(),
    filename: params.filename,
    duration: params.duration,
    transcript: params.transcript,
    summary: params.summary,
    extraction: JSON.stringify(params.extraction),
    hasFlags: params.hasFlags,
    flagAcked: false,
    embeddingId: params.embeddingId,
  };
  db.memos.unshift(memo);
  writeDB(db);
  return dbMemoToMemo(memo);
}

export function getMemos(): Memo[] {
  const db = readDB();
  return db.memos.map(dbMemoToMemo);
}

export function getMemoById(id: string): Memo | null {
  const db = readDB();
  const memo = db.memos.find((m) => m.id === id);
  return memo ? dbMemoToMemo(memo) : null;
}

export function ackMemoFlag(id: string): void {
  const db = readDB();
  const memo = db.memos.find((m) => m.id === id);
  if (memo) {
    memo.flagAcked = true;
    writeDB(db);
  }
}

export function updateActionStatus(
  memoId: string,
  taskIndex: number,
  status: "open" | "closed"
): void {
  const db = readDB();
  const memo = db.memos.find((m) => m.id === memoId);
  if (memo) {
    const extraction: Extraction = JSON.parse(memo.extraction);
    if (extraction.action_items[taskIndex]) {
      extraction.action_items[taskIndex].status = status;
      memo.extraction = JSON.stringify(extraction);
      writeDB(db);
    }
  }
}

export function deleteMemo(id: string): void {
  const db = readDB();
  db.memos = db.memos.filter((m) => m.id !== id);
  writeDB(db);
}

function dbMemoToMemo(m: DBMemo): Memo {
  return {
    id: m.id,
    createdAt: m.createdAt,
    filename: m.filename,
    duration: m.duration,
    transcript: m.transcript,
    summary: m.summary,
    extraction: JSON.parse(m.extraction),
    hasFlags: m.hasFlags,
    flagAcked: m.flagAcked,
    embeddingId: m.embeddingId,
  };
}