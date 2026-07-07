import { btlClient, BTL_MODEL } from "./btl";
import { getMemos } from "./db";
import type { Extraction } from "@/types";

const EXTRACTION_SYSTEM = `You are a meeting intelligence system. Extract the following from this transcript in strict JSON.

Be thorough — extract EVERY decision, action item, commitment, and open question, no matter how small.

{
  "decisions": [{"text": "", "made_by": "", "date_mentioned": ""}],
  "action_items": [{"task": "", "owner": "", "deadline": "", "status": "open"}],
  "open_questions": [{"question": "", "blocking": true}],
  "commitments": [{"person": "", "commitment": "", "deadline": ""}],
  "flags": [{"type": "conflict|risk|blocker", "description": ""}]
}

Return ONLY valid JSON. No preamble. No markdown.`;

export async function extractFromTranscript(
  transcript: string,
  memoId: string
): Promise<{ extraction: Extraction; summary: string }> {

  let extraction: Extraction = {
    decisions: [],
    action_items: [],
    open_questions: [],
    commitments: [],
    flags: [],
  };

  // Step 1: Extract structured data from this transcript
  try {
    const res = await btlClient.chat.completions.create({
      model: BTL_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM },
        { role: "user", content: `Transcript:\n${transcript}` },
      ],
    });

    const raw = res.choices[0].message.content || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    extraction = JSON.parse(cleaned);
  } catch {
    // extraction failed
  }

  // Step 2: Filter prior memos to only RELATED ones
  try {
    const priorMemos = (await getMemos()).filter((m) => m.id !== memoId);

    if (priorMemos.length > 0) {
      // Ask BTL to score each prior memo for relevance to this new transcript
      const relevanceRes = await btlClient.chat.completions.create({
        model: BTL_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You determine if meeting transcripts could be from the same team or organization.

Given a new meeting transcript and a list of prior meeting summaries, return a JSON array of memo IDs that are plausibly related — same team, same company, same project, overlapping people, or similar subject matter.

Be LENIENT — if there is any reasonable chance two memos are from the same team or context, include the ID. Only exclude memos that are clearly about a completely different organization or unrelated domain.

Return ONLY a JSON array of matching IDs: ["id1", "id2"] or [] if none match. No preamble.`,
          },
          {
            role: "user",
            content: `NEW TRANSCRIPT:\n${transcript.slice(0, 800)}\n\nPRIOR MEMOS:\n${priorMemos.map((m) => `ID: ${m.id}\nSummary: ${m.summary}\nExcerpt: ${m.transcript.slice(0, 300)}`).join("\n\n---\n\n")}`,
          },
        ],
      });

      const raw = relevanceRes.choices[0].message.content || "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const relatedIds: string[] = JSON.parse(cleaned);

      // If relevance check returns nothing, fall back to all prior memos
      const relatedMemos = relatedIds.length > 0
        ? priorMemos.filter((m) => relatedIds.includes(m.id))
        : priorMemos;


      // Step 3: Only run contradiction check against related memos
      if (relatedMemos.length > 0) {
        const priorContext = relatedMemos.map((m) => {
          const e = m.extraction;
          const decisions = e.decisions.map((d) => `- ${d.text}`).join("\n");
          const commitments = e.commitments.map((c) => `- ${c.person}: ${c.commitment} by ${c.deadline}`).join("\n");
          const actions = e.action_items.map((a) => `- ${a.task} → ${a.owner} by ${a.deadline}`).join("\n");
          return `[MEMO ${m.id.slice(-6)} — ${new Date(m.createdAt).toLocaleDateString()}]
DECISIONS:\n${decisions || "none"}
COMMITMENTS:\n${commitments || "none"}
ACTION ITEMS:\n${actions || "none"}`;
        }).join("\n\n---\n\n");

        const contradictionRes = await btlClient.chat.completions.create({
          model: BTL_MODEL,
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content: `You are a conflict detection system for meeting intelligence.

Compare prior meeting decisions against new ones and flag ONLY direct contradictions where something clearly changed — dates, budgets, owners, technical decisions, priorities.

Do NOT flag something as a conflict if:
- It is additional detail about the same decision
- It is a natural progression or update that was acknowledged
- The topics are unrelated

Return ONLY a JSON array:
[{"type":"conflict","description":"Previously decided [X] in memo [id], now saying [Y]","prior_decision":"[the original decision]"}]

Return [] if no real conflicts. No preamble. No markdown.`,
            },
            {
              role: "user",
              content: `PRIOR RELATED MEETINGS:\n${priorContext}\n\nNEW MEETING DECISIONS:\n${JSON.stringify(extraction.decisions, null, 2)}\n\nNEW COMMITMENTS:\n${JSON.stringify(extraction.commitments, null, 2)}\n\nNEW ACTION ITEMS:\n${JSON.stringify(extraction.action_items, null, 2)}`,
            },
          ],
        });

        const cRaw = contradictionRes.choices[0].message.content || "[]";
        const cCleaned = cRaw.replace(/```json|```/g, "").trim();
        const newFlags = JSON.parse(cCleaned);

        if (Array.isArray(newFlags) && newFlags.length > 0) {
          extraction.flags = [...extraction.flags, ...newFlags];
        }
      }
    }
  } catch (err) {
    console.error("Contradiction check failed:", err);
  }

  // Step 4: Build summary
  const conflictCount = extraction.flags.filter((f) => f.type === "conflict").length;
  let summary = "";

  if (extraction.decisions.length > 0 || extraction.action_items.length > 0) {
    const parts: string[] = [];
    if (extraction.decisions.length > 0)
      parts.push(`${extraction.decisions.length} decision${extraction.decisions.length > 1 ? "s" : ""}`);
    if (extraction.action_items.length > 0)
      parts.push(`${extraction.action_items.length} action item${extraction.action_items.length > 1 ? "s" : ""}`);
    if (conflictCount > 0)
      parts.push(`⚠ ${conflictCount} conflict${conflictCount > 1 ? "s" : ""} flagged`);
    summary = parts.join(" · ");
  } else {
    summary = "Transcribed — no structured items extracted";
  }

  return { extraction, summary };
}