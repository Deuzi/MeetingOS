/**
 * Seed demo memos for the BTL Runtime Hackathon demo.
 * Run: node scripts/seed.js
 *
 * Loads 3 pre-built memos from a fictional engineering team.
 * Memo 2 (June 28) contains two conflicts against Memo 1 (June 24)
 * — demonstrating the contradiction detection flow.
 */
const { writeFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = join(process.cwd(), "data", "meetingos.json");

const id1 = uuidv4();
const id2 = uuidv4();
const id3 = uuidv4();

const memo1 = {
  id: id1,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  filename: "standup-2025-06-24.mp3",
  duration: 240,
  transcript:
    "Good morning team. Quick standup.\n\nTunde: I finished the auth service. Pushing Node 18 migration to next sprint — committing to Node 16 for v2 launch.\n\nSarah: Works for me. Launch is July 14th. I will own API docs, done by end of week.\n\nMarcus: Backend tests green. I am on the DB migration script, done by June 28th. CDN setup is a blocker — I will take it, done by June 27th.\n\nAlright. v2 ships July 14th. Node 16. Sarah owns docs. Marcus owns DB migration and CDN.",
  summary: "3 decisions · 4 action items · Node 16 confirmed for v2",
  extraction: JSON.stringify({
    decisions: [
      { text: "Commit to Node 16 for v2 launch — Node 18 migration deferred to next sprint", made_by: "Tunde, agreed by team", date_mentioned: "June 24" },
      { text: "v2 launch date set to July 14th", made_by: "Sarah", date_mentioned: "June 24" },
      { text: "Sarah owns API documentation", made_by: "Sarah", date_mentioned: "June 24" },
    ],
    action_items: [
      { task: "Push API documentation", owner: "Sarah", deadline: "End of week (June 28)", status: "closed" },
      { task: "Complete database migration script", owner: "Marcus", deadline: "June 28", status: "closed" },
      { task: "Set up CDN for staging environment", owner: "Marcus", deadline: "June 27", status: "closed" },
      { task: "Defer Node 18 migration to next sprint", owner: "Tunde", deadline: "Next sprint planning", status: "open" },
    ],
    open_questions: [{ question: "Who handles CDN setup for staging?", blocking: true }],
    commitments: [
      { person: "Sarah", commitment: "API docs complete", deadline: "End of week (June 28)" },
      { person: "Marcus", commitment: "DB migration script complete", deadline: "June 28" },
      { person: "Marcus", commitment: "CDN configuration", deadline: "June 27" },
      { person: "Tunde", commitment: "Node 16 for v2 launch", deadline: "July 14" },
    ],
    flags: [],
  }),
  hasFlags: false,
  flagAcked: false,
};

const memo2 = {
  id: id2,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  filename: "standup-2025-06-28.mp3",
  duration: 180,
  transcript:
    "Quick check-in.\n\nTunde: I actually started the Node 18 upgrade this week. I know we said next sprint, but it is going better than expected. Also — CEO wants to move launch up to July 7th.\n\nSarah: That is a week earlier than July 14th. Docs QA review is not done yet. I submitted them but it is pending.\n\nMarcus: DB migration done, CDN is live. I am good.\n\nTunde: Let us target July 7th and reassess Friday.\n\nSarah: Flagging this as a risk. Not sure Node 18 is safe to ship without more testing.",
  summary: "2 decisions · 2 action items · ⚠ 2 conflicts detected",
  extraction: JSON.stringify({
    decisions: [
      { text: "Targeting July 7th for v2 launch — one week earlier than previously agreed July 14th", made_by: "Tunde (per CEO directive)", date_mentioned: "June 28" },
      { text: "Node 18 upgrade re-started — previously deferred to next sprint", made_by: "Tunde", date_mentioned: "June 28" },
    ],
    action_items: [
      { task: "Reassess launch date on Friday", owner: "Team", deadline: "Friday June 30", status: "open" },
      { task: "Complete API docs QA review", owner: "Sarah", deadline: "Before July 7", status: "open" },
    ],
    open_questions: [
      { question: "Is July 7th realistic given the docs QA backlog?", blocking: true },
      { question: "Is Node 18 safe to ship by July 7th?", blocking: true },
    ],
    commitments: [
      { person: "Tunde", commitment: "Node 18 upgrade before launch", deadline: "July 7" },
    ],
    flags: [
      {
        type: "conflict",
        description: "Launch date conflict: July 14th was agreed in the June 24 standup. This memo targets July 7th per an unilateral CEO directive without formal team re-alignment.",
        prior_decision: "v2 launch date set to July 14th",
      },
      {
        type: "conflict",
        description: "Node version contradiction: Tunde committed to Node 16 for v2 on June 24. He has now restarted the Node 18 upgrade targeting the same launch window.",
        prior_decision: "Commit to Node 16 for v2 launch — Node 18 migration deferred to next sprint",
      },
      {
        type: "risk",
        description: "API documentation QA review not complete — Sarah flagged this as a risk to the July 7th target.",
      },
    ],
  }),
  hasFlags: true,
  flagAcked: false,
};

const memo3 = {
  id: id3,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  filename: "friday-review-2025-07-01.mp3",
  duration: 300,
  transcript:
    "Friday review. Let us land on launch.\n\nSarah: July 7th is too risky. Docs QA failed two checks. I need until July 12th minimum.\n\nTunde: I hit three breaking changes in Node 18 — auth library is not compatible yet. July 7th is off the table.\n\nMarcus: Let us go back to July 14th. That is what we planned. Hold the line.\n\nTunde: Agreed. July 14th. I can finish Node 18 by July 10th — four days of buffer.\n\nSarah: Docs QA signed off by July 11th.\n\nMarcus: We need QA to formally sign off on the Node 18 regression suite. That should be a hard gate.\n\nTunde: Agreed. QA sign-off is a gate before Node 18 goes in.",
  summary: "4 decisions · 3 action items · July 14th restored",
  extraction: JSON.stringify({
    decisions: [
      { text: "v2 launch date restored to July 14th — July 7th target dropped due to docs QA failures and Node 18 breaking changes", made_by: "Full team", date_mentioned: "July 1" },
      { text: "Node 18 will ship in v2 — complete by July 10th to allow 4-day buffer", made_by: "Tunde", date_mentioned: "July 1" },
      { text: "QA sign-off on Node 18 regression suite is a hard gate for v2 launch", made_by: "Full team", date_mentioned: "July 1" },
      { text: "API docs QA signed off by July 11th", made_by: "Sarah", date_mentioned: "July 1" },
    ],
    action_items: [
      { task: "Complete Node 18 upgrade", owner: "Tunde", deadline: "July 10", status: "open" },
      { task: "Get docs QA signed off", owner: "Sarah", deadline: "July 11", status: "open" },
      { task: "Schedule QA regression run for Node 18", owner: "Marcus", deadline: "Before July 12", status: "open" },
    ],
    open_questions: [
      { question: "Has QA been briefed on the scope of the Node 18 regression suite?", blocking: true },
    ],
    commitments: [
      { person: "Tunde", commitment: "Node 18 upgrade complete", deadline: "July 10" },
      { person: "Sarah", commitment: "Docs QA sign-off", deadline: "July 11" },
      { person: "Marcus", commitment: "QA regression run scheduled", deadline: "Before July 12" },
    ],
    flags: [],
  }),
  hasFlags: false,
  flagAcked: false,
};

const dir = join(process.cwd(), "data");
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const db = { memos: [memo3, memo2, memo1] };
writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log("✓ Seeded 3 memos:");
console.log("  " + id1.slice(-6) + " — June 24 standup (Node 16 decision, July 14 launch)");
console.log("  " + id2.slice(-6) + " — June 28 standup (⚠ 2 CONFLICTS + 1 RISK)");
console.log("  " + id3.slice(-6) + " — July 1 Friday review (July 14 restored, Node 18 on track)");
console.log("");
console.log("Open http://localhost:3000 → click the June 28 memo → see the flagged orb.");
