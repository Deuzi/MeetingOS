"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PixelOrb from "@/components/PixelOrb";
import type { OrbState } from "@/types";

interface Citation {
  memoId: string;
  summary?: string;
  createdAt: string;
}

interface QueryResult {
  answer: string;
  citations: Citation[];
}

export default function QueryPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [history, setHistory] = useState<Array<{ q: string; r: QueryResult }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setOrbState("processing");

    const q = question.trim();
    setQuestion("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setOrbState("synthesizing");
      setTimeout(() => {
        setResult(data);
        setHistory((h) => [{ q, r: data }, ...h]);
        setOrbState("idle");
      }, 600);
    } catch {
      setOrbState("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <header style={{ borderBottom: "1px solid var(--line)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/meetOSLogo.png"
            alt="MeetingOS"
            style={{ height: 36, width: "auto", display: "block" }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg)",
              lineHeight: 1.1,
            }}>
              Meeting
            </span>
            <span style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              lineHeight: 1.1,
            }}>
              OS
            </span>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: 24 }}>
          {[{ href: "/", label: "CAPTURE" }, { href: "/query", label: "QUERY" }, { href: "/timeline", label: "TIMELINE" }].map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: href === "/query" ? "var(--fg)" : "var(--fg-dim)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, overflow: "auto", padding: 40, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: 32 }}>
          <span className="label" style={{ display: "block", marginBottom: 8 }}>QUERY</span>
          <p style={{ margin: 0, fontSize: 12, color: "var(--fg-dim)", fontFamily: "Inter, sans-serif" }}>
            Ask anything about your meeting history.
          </p>
        </div>

        {/* Query input */}
        <div style={{ display: "flex", gap: 0, marginBottom: 40, border: "1px solid var(--line)" }}>
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What has Tunde committed to this month?"
            style={{
              flex: 1,
              padding: "14px 16px",
              backgroundColor: "var(--bg-elevated)",
              border: "none",
              color: "var(--fg)",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              outline: "none",
            }}
            disabled={loading}
          />
          <button
            onClick={submit}
            disabled={loading || !question.trim()}
            style={{
              padding: "14px 24px",
              backgroundColor: loading ? "var(--bg-elevated)" : "var(--fg)",
              border: "none",
              color: loading ? "var(--fg-dim)" : "var(--bg)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "…" : "ASK"}
          </button>
        </div>

        {/* Current result */}
        {result && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 16 }}>
              <span className="label">RESPONSE</span>
            </div>
            <div style={{ padding: "16px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--line)", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--fg)", lineHeight: 1.7, fontFamily: "Inter, sans-serif", whiteSpace: "pre-wrap" }}>
                {result.answer}
              </p>
            </div>
            {result.citations.length > 0 && (
              <div>
                <span className="label" style={{ display: "block", marginBottom: 8 }}>SOURCES</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.citations.map((c, i) => (
                    <Link key={i} href={`/memo/${c.memoId}`} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "8px 12px", border: "1px solid var(--line)", backgroundColor: "var(--bg-elevated)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--fg)", fontFamily: "Inter, sans-serif" }}>
                          {c.summary || "Memo"}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                          {new Date(c.createdAt).toLocaleDateString()} →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 16 }}>
              <span className="label">PREVIOUS QUERIES</span>
            </div>
            {history.slice(1).map((item, i) => (
              <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
                <p style={{ margin: "0 0 8px 0", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fg-dim)", letterSpacing: "0.04em" }}>
                  Q: {item.q}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
                  {item.r.answer}
                </p>
              </div>
            ))}
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fg-dim)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.7, margin: 0 }}>
              NO QUERY YET.<br />
              ASK A QUESTION TO BEGIN.<br />
              <span style={{ fontSize: 9, marginTop: 8, display: "block" }}>SEARCHES ACROSS ALL MEMO HISTORY</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
