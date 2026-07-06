"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PixelOrb from "@/components/PixelOrb";
import type { Memo, OrbState } from "@/types";

function StatusDot({ memo }: { memo: Memo }) {
  const hasUnacked = memo.hasFlags && !memo.flagAcked;
  const openActions = memo.extraction.action_items.filter((a) => a.status === "open").length;

  if (hasUnacked) return (
    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--flag)", display: "inline-block", flexShrink: 0 }} />
  );
  if (openActions > 0) return (
    <span style={{ width: 8, height: 8, border: "1px solid var(--fg-dim)", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
  );
  return (
    <span style={{ width: 8, height: 8, backgroundColor: "var(--line)", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
  );
}

export default function TimelinePage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [orbState] = useState<OrbState>("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memos")
      .then((r) => r.json())
      .then(({ memos }) => { setMemos(memos || []); setLoaded(true); });
  }, []);

  const byDate: Record<string, Memo[]> = {};
  for (const memo of memos) {
    const key = new Date(memo.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(memo);
  }

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
            <Link key={href} href={href} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: href === "/timeline" ? "var(--fg)" : "var(--fg-dim)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, overflow: "auto", padding: 40 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <span className="label" style={{ display: "block", marginBottom: 4 }}>TIMELINE</span>
              <p style={{ margin: 0, fontSize: 12, color: "var(--fg-dim)", fontFamily: "Inter, sans-serif" }}>
                {memos.length} memo{memos.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[
                { color: "var(--flag)", label: "CONFLICT" },
                { border: true, color: "var(--fg-dim)", label: "OPEN ACTIONS" },
                { color: "var(--line)", label: "CLEAN" },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    backgroundColor: border ? "transparent" : color,
                    border: border ? `1px solid ${color}` : "none",
                    display: "inline-block",
                  }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--fg-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!loaded ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <span className="label">LOADING…</span>
            </div>
          ) : memos.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fg-dim)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.7, margin: 0 }}>
                NO MEMOS YET.<br />
                RECORD ONE TO BEGIN.
              </p>
            </div>
          ) : (
            Object.entries(byDate).map(([date, dateMemos]) => (
              <div key={date} style={{ marginBottom: 32 }}>
                <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 12 }}>
                  <span className="label">{date}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, backgroundColor: "var(--line)" }}>
                  {dateMemos.map((memo) => {
                    const openActions = memo.extraction.action_items.filter((a) => a.status === "open").length;
                    const closedActions = memo.extraction.action_items.filter((a) => a.status === "closed").length;
                    return (
                      <Link key={memo.id} href={`/memo/${memo.id}`} style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            padding: "14px 16px",
                            backgroundColor: "var(--bg-elevated)",
                            display: "grid",
                            gridTemplateColumns: "24px 1fr auto",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <StatusDot memo={memo} />
                          <div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.4, marginBottom: 4 }}>
                              {memo.summary || memo.transcript.slice(0, 100) + "…"}
                            </p>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                                {new Date(memo.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </span>
                              {memo.extraction.decisions.length > 0 && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                                  {memo.extraction.decisions.length} DECISION{memo.extraction.decisions.length > 1 ? "S" : ""}
                                </span>
                              )}
                              {openActions > 0 && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                                  {openActions} OPEN
                                </span>
                              )}
                              {closedActions > 0 && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                                  {closedActions} DONE
                                </span>
                              )}
                              {memo.hasFlags && !memo.flagAcked && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--flag)", letterSpacing: "0.05em" }}>
                                  ⚠ CONFLICT
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
