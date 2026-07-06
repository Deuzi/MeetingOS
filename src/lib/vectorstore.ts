// In-memory vector store with cosine similarity
// In production, swap this for ChromaDB or Pinecone

interface VectorEntry {
  id: string;
  memoId: string;
  text: string;
  vector: number[];
  metadata: Record<string, string>;
}

const store: VectorEntry[] = [];

export function addVector(entry: {
  id: string;
  memoId: string;
  text: string;
  vector: number[];
  metadata?: Record<string, string>;
}) {
  store.push({ ...entry, metadata: entry.metadata || {} });
}

export function queryVectors(
  vector: number[],
  topK: number = 5,
  excludeMemoId?: string
): Array<{ memoId: string; text: string; score: number; metadata: Record<string, string> }> {
  const scored = store
    .filter((e) => e.memoId !== excludeMemoId)
    .map((e) => ({
      memoId: e.memoId,
      text: e.text,
      score: cosineSim(vector, e.vector),
      metadata: e.metadata,
    }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

export function getAllEntries() {
  return store;
}
