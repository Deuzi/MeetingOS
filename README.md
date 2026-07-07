# MeetingOS

Voice memo intelligence system. Records or ingests meeting audio, extracts decisions/actions/commitments in structured form, detects contradictions across sessions, and answers natural-language questions over your meeting history.

Built for the BTL Runtime Hackathon.

---

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your keys:

```
UPSTASH_REDIS_REST_URL="your-upstash-redis-rest-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-rest-token"
BTL_RUNTIME_API_KEY="your-btl-key"
OPENAI_API_KEY="sk-..."     # used only for Whisper transcription (routed via Groq's OpenAI-compatible endpoint)
```

## Seed demo data (for hackathon demo)

```bash
node -e "$(cat scripts/seed.js)"
```

Or run the seed inline — this loads 3 pre-built memos from a fictional engineering team (June 24, June 28, July 1). The June 28 memo contains two detected conflicts against the June 24 session, demonstrating the contradiction detection flow without needing live API calls.

## Run

```bash
npm run dev    # http://localhost:3000
```

## Demo flow for judges

1. Load the app — orb idles in the header, sidebar shows 3 seeded memos
2. Click the **June 28 memo** in the sidebar → orb shows FLAGGED state (red quadrant)
3. See the two conflict banners in the memo detail view
4. Go to **QUERY** → type "What has Tunde committed to?" → answer cites both memos
5. Go to **TIMELINE** → see red dots on the June 28 memo, clean dots on others
6. Drop in a live audio file to see the full processing → synthesizing → (flagged|idle) arc

## Architecture

```
Browser                    Server (Next.js API routes)
──────────────────         ──────────────────────────────────
AudioCapture               /api/transcribe  → OpenAI Whisper
  │                        /api/extract     → BTL Runtime chat (extraction)
  └─ upload audio                           → BTL Runtime embeddings
                                            → in-memory vector store
                                            → contradiction check (BTL Runtime)
                           /api/memos/*     → Upstash Redis (meetingos:memos key)
                           /api/query       → BTL Runtime chat + vector retrieval
```

**Storage:** [Upstash Redis](https://upstash.com/) via `@upstash/redis`, storing all memos as a single JSON array under the `meetingos:memos` key (see `src/lib/db.ts`). Vector store is in-memory per process — swap `src/lib/vectorstore.ts` for ChromaDB for persistence across restarts.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS with custom design tokens
- OpenAI SDK pointed at BTL Runtime base URL for chat + embeddings (`btl-2` and `text-embedding-3-small`)
- OpenAI SDK pointed at Groq's endpoint for Whisper transcription
- In-memory vector store with cosine similarity (drop-in replace with `chromadb` npm client)
- Upstash Redis for memo persistence (`@upstash/redis`)

## BTL Runtime usage

All meeting intelligence (extraction, relevance filtering, contradiction detection, and query answering) runs on **Bad Theory Labs' Runtime**, accessed via the OpenAI SDK pointed at `https://api.badtheorylabs.com/v1`.

| Purpose | Model |
|---|---|
| Extraction (decisions, action items, commitments, flags) | `btl-2` |
| Relevance filtering (which prior memos relate to a new transcript) | `btl-2` |
| Contradiction detection | `btl-2` |
| Query answering over meeting history | `btl-2` |
| Vector embeddings for retrieval | `text-embedding-3-small` |

Whisper transcription is handled separately via Groq's OpenAI-compatible endpoint (`OPENAI_API_KEY`, `https://api.groq.com/openai/v1`).

## Pixel Orb

The signature visual element — a 18×18 pixel sphere rendered on canvas with four states:

| State | Behaviour |
|---|---|
| `idle` | Slow ambient rotation, dim pulsing |
| `processing` | Pixels scramble rapidly (transcription/extraction) |
| `synthesizing` | Pixels organize brighter as output resolves |
| `flagged` | Lower-right quadrant shifts to `#FF3B30` red; persists until acknowledged |

## Design tokens

```css
--bg: #0A0A0A
--bg-elevated: #141414
--fg: #F5F5F0
--fg-dim: #8A8A85
--line: #2A2A28
--accent: #FFFFFF
--flag: #FF3B30   /* conflict/contradiction only */
```