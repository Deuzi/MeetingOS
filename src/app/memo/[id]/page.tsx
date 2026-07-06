"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import PixelOrb from "@/components/PixelOrb";
import ExtractionPanel from "@/components/ExtractionPanel";
import MemoSidebar from "@/components/MemoSidebar";
import type { Memo, OrbState } from "@/types";

export default function MemoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [orbState] = useState<OrbState>("idle");

  useEffect(() => {
    fetch(`/api/memos/${id}`)
      .then((r) => r.json())
      .then(({ memo }) => setMemo(memo));
    fetch("/api/memos")
      .then((r) => r.json())
      .then(({ memos }) => setMemos(memos || []));
  }, [id]);

  const handleActionToggle = useCallback(async (index: number, status: "open" | "closed") => {
    await fetch(`/api/memos/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIndex: index, status }),
    });
    setMemo((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.extraction = { ...prev.extraction };
      updated.extraction.action_items = [...prev.extraction.action_items];
      updated.extraction.action_items[index] = {
        ...updated.extraction.action_items[index],
        status,
      };
      return updated;
    });
  }, [id]);

  const handleAck = async () => {
    await fetch(`/api/memos/${id}/ack`, { method: "POST" });
    setMemo((prev) => prev ? { ...prev, flagAcked: true } : prev);
  };

  if (!memo) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span className="label">LOADING…</span>
      </div>
    );
  }

  const hasUnackedFlag = memo.hasFlags && !memo.flagAcked;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
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
            <Link key={href} href={href} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-dim)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <MemoSidebar
            memos={memos}
            activeMemoId={id}
            onDelete={(deletedId) => setMemos((prev) => prev.filter((m) => m.id !== deletedId))}
        />

        <main style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>
          {/* Conflict banner */}
          {hasUnackedFlag && (
            <div
              style={{
                marginBottom: 24,
                padding: "12px 16px",
                border: "1px solid var(--flag)",
                backgroundColor: "rgba(255,59,48,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--flag)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ⚠ CONFLICT DETECTED — Review flags below
              </span>
              <button
                onClick={handleAck}
                style={{
                  padding: "4px 12px",
                  border: "1px solid var(--flag)",
                  backgroundColor: "transparent",
                  color: "var(--flag)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                ACKNOWLEDGE
              </button>
            </div>
          )}

          {/* Memo header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span className="label">
                {new Date(memo.createdAt).toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })} · {new Date(memo.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              {memo.filename && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                  {memo.filename}
                </span>
              )}
            </div>
            {memo.summary && (
              <p style={{ margin: 0, fontSize: 15, color: "var(--fg)", lineHeight: 1.6 }}>
                {memo.summary}
              </p>
            )}
          </div>

          {/* Transcript */}
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => setShowTranscript((s) => !s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                marginBottom: showTranscript ? 12 : 0,
              }}
            >
              <span className="label">TRANSCRIPT</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)" }}>
                {showTranscript ? "▲" : "▼"}
              </span>
            </button>
            {showTranscript && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--line)",
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.7, fontFamily: "Inter, sans-serif" }}>
                  {memo.transcript}
                </p>
              </div>
            )}
          </div>

          {/* Extraction */}
          <ExtractionPanel
            memoId={memo.id}
            extraction={memo.extraction}
            onActionToggle={handleActionToggle}
          />
        </main>
      </div>
    </div>
  );
}
