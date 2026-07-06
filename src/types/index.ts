export interface Decision {
  text: string;
  made_by: string;
  date_mentioned: string;
}

export interface ActionItem {
  task: string;
  owner: string;
  deadline: string;
  status: "open" | "closed";
}

export interface OpenQuestion {
  question: string;
  blocking: boolean;
}

export interface Commitment {
  person: string;
  commitment: string;
  deadline: string;
}

export interface Flag {
  type: "conflict" | "risk" | "blocker";
  description: string;
  prior_memo_id?: string;
  prior_decision?: string;
}

export interface Extraction {
  decisions: Decision[];
  action_items: ActionItem[];
  open_questions: OpenQuestion[];
  commitments: Commitment[];
  flags: Flag[];
}

export interface Memo {
  id: string;
  createdAt: string;
  filename?: string;
  duration?: number;
  transcript: string;
  summary?: string;
  extraction: Extraction;
  hasFlags: boolean;
  flagAcked: boolean;
  embeddingId?: string;
}

export type OrbState = "idle" | "processing" | "synthesizing" | "flagged";

export interface QueryResult {
  answer: string;
  citations: Array<{ memoId: string; summary?: string; createdAt: string }>;
}
