import { NextRequest, NextResponse } from "next/server";
import { btlClient, BTL_MODEL } from "@/lib/btl";
import { getMemos } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ error: "No question" }, { status: 400 });

    const allMemos = getMemos();

    if (allMemos.length === 0) {
      return NextResponse.json({
        answer: "No memos recorded yet. Record or upload a meeting first.",
        citations: [],
      });
    }

    const memoContext = allMemos.map((memo) => {
      const e = memo.extraction;
      const decisions = e.decisions.map((d) => `- Decision: ${d.text} (by ${d.made_by})`).join("\n");
      const actions = e.action_items.map((a) => `- Action: ${a.task} → ${a.owner} by ${a.deadline} [${a.status}]`).join("\n");
      const commitments = e.commitments.map((c) => `- Commitment: ${c.person} committed to ${c.commitment} by ${c.deadline}`).join("\n");
      const flags = e.flags.map((f) => `- ⚠ ${f.type.toUpperCase()}: ${f.description}`).join("\n");

      return `[MEMO ${memo.id.slice(-6)} — ${new Date(memo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}]
Filename: ${memo.filename || "untitled"}
Summary: ${memo.summary || "none"}
Transcript excerpt: ${memo.transcript.slice(0, 600)}
${decisions}
${actions}
${commitments}
${flags}`.trim();
    }).join("\n\n---\n\n");

    const res = await btlClient.chat.completions.create({
      model: BTL_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are MeetingOS, a meeting intelligence system. Answer questions about meeting history using the memo data provided. Be precise and cite which memo(s) using [MEMO id]. If asking about a person, find all their commitments, actions, and decisions across all memos.`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nAll memo data:\n\n${memoContext}`,
        },
      ],
    });

    const answer = res.choices[0].message.content || "No answer generated.";
    const citations = allMemos.map((m) => ({
      memoId: m.id,
      summary: m.summary,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ answer, citations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}