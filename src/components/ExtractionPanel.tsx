"use client";

import { useState } from "react";
import type { Extraction, Flag } from "@/types";

interface ExtractionPanelProps {
  memoId: string;
  extraction: Extraction;
  onActionToggle?: (index: number, status: "open" | "closed") => void;
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--line)",
        marginBottom: 12,
      }}
    >
      <span className="label">{label}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--fg-dim)",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function FlagBadge({ flag }: { flag: Flag }) {
  const color =
    flag.type === "conflict"
      ? "var(--flag)"
      : flag.type === "risk"
      ? "#FF9500"
      : "var(--fg-dim)";

  return (
    <div
      style={{
        padding: "12px",
        border: `1px solid ${color}`,
        backgroundColor: `${color}10`,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 500,
          }}
        >
          ⚠ {flag.type}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "var(--fg)",
          lineHeight: 1.5,
        }}
      >
        {flag.description}
      </p>
    </div>
  );
}

export default function ExtractionPanel({ memoId, extraction, onActionToggle }: ExtractionPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    decisions: true,
    actions: true,
    commitments: true,
    questions: false,
    flags: true,
  });

  const toggle = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const hasFlags = extraction.flags.length > 0;
  const conflicts = extraction.flags.filter((f) => f.type === "conflict");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Conflict alert banner */}
      {conflicts.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            border: "1px solid var(--flag)",
            backgroundColor: "rgba(255,59,48,0.06)",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "var(--flag)", fontSize: 16, lineHeight: 1 }}>⚠</span>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "var(--flag)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              CONFLICT DETECTED
            </p>
            {conflicts.map((f, i) => (
              <p key={i} style={{ margin: 0, fontSize: 12, color: "var(--fg)", lineHeight: 1.5 }}>
                {f.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {extraction.decisions.length > 0 && (
        <div>
          <button
            onClick={() => toggle("decisions")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <SectionHeader label="DECISIONS" count={extraction.decisions.length} />
          </button>
          {expanded.decisions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {extraction.decisions.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
                    {d.text}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {d.made_by && (
                      <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        BY: {d.made_by}
                      </span>
                    )}
                    {d.date_mentioned && (
                      <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {d.date_mentioned}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Items */}
      {extraction.action_items.length > 0 && (
        <div>
          <button
            onClick={() => toggle("actions")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <SectionHeader label="ACTION ITEMS" count={extraction.action_items.length} />
          </button>
          {expanded.actions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {extraction.action_items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <button
                    onClick={() => onActionToggle?.(i, item.status === "open" ? "closed" : "open")}
                    style={{
                      width: 14,
                      height: 14,
                      border: `1px solid ${item.status === "closed" ? "var(--fg-dim)" : "var(--fg)"}`,
                      backgroundColor: item.status === "closed" ? "var(--fg-dim)" : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 2,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={item.status === "open" ? "Mark done" : "Reopen"}
                  >
                    {item.status === "closed" && (
                      <span style={{ fontSize: 9, color: "var(--bg)", lineHeight: 1 }}>✓</span>
                    )}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: item.status === "closed" ? "var(--fg-dim)" : "var(--fg)",
                        lineHeight: 1.5,
                        textDecoration: item.status === "closed" ? "line-through" : "none",
                      }}
                    >
                      {item.task}
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                      {item.owner && (
                        <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                          OWNER: {item.owner}
                        </span>
                      )}
                      {item.deadline && (
                        <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                          DUE: {item.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commitments */}
      {extraction.commitments.length > 0 && (
        <div>
          <button
            onClick={() => toggle("commitments")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <SectionHeader label="COMMITMENTS" count={extraction.commitments.length} />
          </button>
          {expanded.commitments && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {extraction.commitments.map((c, i) => (
                <div
                  key={i}
                  style={{ padding: "10px 12px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--line)" }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
                    {c.commitment}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    {c.person && (
                      <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.person}
                      </span>
                    )}
                    {c.deadline && (
                      <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        BY: {c.deadline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open Questions */}
      {extraction.open_questions.length > 0 && (
        <div>
          <button
            onClick={() => toggle("questions")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <SectionHeader label="OPEN QUESTIONS" count={extraction.open_questions.length} />
          </button>
          {expanded.questions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {extraction.open_questions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-elevated)",
                    border: `1px solid ${q.blocking ? "#FF9500" : "var(--line)"}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
                    {q.question}
                  </p>
                  {q.blocking && (
                    <span style={{ fontSize: 9, color: "#FF9500", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      BLOCKING
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All flags */}
      {hasFlags && (
        <div>
          <button
            onClick={() => toggle("flags")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <SectionHeader label="FLAGS" count={extraction.flags.length} />
          </button>
          {expanded.flags && (
            <div>
              {extraction.flags.map((f, i) => (
                <FlagBadge key={i} flag={f} />
              ))}
            </div>
          )}
        </div>
      )}

      {extraction.decisions.length === 0 &&
        extraction.action_items.length === 0 &&
        extraction.commitments.length === 0 &&
        extraction.open_questions.length === 0 &&
        !hasFlags && (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--fg-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              NO STRUCTURED ITEMS EXTRACTED.
              <br />
              TRANSCRIPT STORED.
            </p>
          </div>
        )}
    </div>
  );
}
