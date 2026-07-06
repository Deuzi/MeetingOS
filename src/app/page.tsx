"use client";

import { useState, useEffect } from "react";
import PixelOrb from "@/components/PixelOrb";
import AudioCapture from "@/components/AudioCapture";
import MemoSidebar from "@/components/MemoSidebar";
import type { Memo, OrbState } from "@/types";
import Link from "next/link";

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memos")
      .then((r) => r.json())
      .then(({ memos }) => {
        setMemos(memos || []);
        // If any unacknowledged flags, show flagged state
        const hasUnacked = (memos || []).some((m: Memo) => m.hasFlags && !m.flagAcked);
        if (hasUnacked) setOrbState("flagged");
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleMemoCreated = (memo: Memo) => {
    setMemos((prev) => [memo, ...prev]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header / Nav */}
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
        {/* Nav */}
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { href: "/", label: "CAPTURE" },
            { href: "/query", label: "QUERY" },
            { href: "/timeline", label: "TIMELINE" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: href === "/" ? "var(--fg)" : "var(--fg-dim)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <MemoSidebar
          memos={memos}
          onDelete={(id) => setMemos((prev) => prev.filter((m) => m.id !== id))}
        />

        {/* Main capture area */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Large orb */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 56,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <PixelOrb state={orbState} size={140} />
          </div>

          {/* Capture controls */}
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.4s ease 0.3s",
            }}
          >
            <div
              style={{
                borderBottom: "1px solid var(--line)",
                paddingBottom: 16,
                marginBottom: 24,
              }}
            >
              <span className="label">CAPTURE</span>
            </div>
            <AudioCapture
              onMemoCreated={handleMemoCreated}
              onOrbStateChange={setOrbState}
            />
          </div>

          {/* Recent memos stats */}
          {memos.length > 0 && (
            <div
              style={{
                marginTop: 48,
                width: "100%",
                maxWidth: 480,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                backgroundColor: "var(--line)",
                border: "1px solid var(--line)",
              }}
            >
              {[
                {
                  label: "MEMOS",
                  value: memos.length,
                },
                {
                  label: "OPEN ACTIONS",
                  value: memos.reduce(
                    (n, m) => n + m.extraction.action_items.filter((a) => a.status === "open").length,
                    0
                  ),
                },
                {
                  label: "CONFLICTS",
                  value: memos.filter((m) => m.hasFlags && !m.flagAcked).length,
                  alert: memos.filter((m) => m.hasFlags && !m.flagAcked).length > 0,
                },
              ].map(({ label, value, alert }) => (
                <div
                  key={label}
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: alert ? "var(--flag)" : "var(--fg-dim)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 28,
                      fontWeight: 300,
                      color: alert ? "var(--flag)" : "var(--fg)",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
