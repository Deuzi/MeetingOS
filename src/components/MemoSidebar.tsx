"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Memo } from "@/types";

interface MemoSidebarProps {
  memos: Memo[];
  activeMemoId?: string;
  onDelete?: (id: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MemoSidebar({ memos, activeMemoId, onDelete }: MemoSidebarProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pendingMemo = memos.find((m) => m.id === pendingDeleteId);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    await fetch(`/api/memos/${pendingDeleteId}`, { method: "DELETE" });
    const deletedId = pendingDeleteId;
    setPendingDeleteId(null);
    setDeleting(false);
    onDelete?.(deletedId);
    if (activeMemoId === deletedId) router.push("/");
  };

  const cancelDelete = () => setPendingDeleteId(null);

  return (
    <>
      {/* Custom delete confirmation modal */}
      {pendingDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,10,10,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--line)",
              width: 360,
              padding: "28px 28px 24px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ color: "var(--flag)", fontSize: 16, lineHeight: 1 }}>⚠</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--flag)",
                }}
              >
                DELETE MEMO
              </span>
            </div>

            {/* Memo info */}
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid var(--line)",
                backgroundColor: "var(--bg)",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "var(--fg-dim)",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                {pendingMemo
                  ? new Date(pendingMemo.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--fg)",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.4,
                }}
              >
                {pendingMemo?.summary || pendingMemo?.transcript.slice(0, 80) + "…"}
              </span>
            </div>

            {/* Warning text */}
            <p
              style={{
                margin: "0 0 24px 0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "var(--fg-dim)",
                lineHeight: 1.6,
                letterSpacing: "0.04em",
              }}
            >
              THIS ACTION IS PERMANENT. THE TRANSCRIPT, EXTRACTED DATA, AND ALL FLAGS WILL BE ERASED.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={cancelDelete}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  backgroundColor: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--fg-dim)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  backgroundColor: "var(--flag)",
                  border: "1px solid var(--flag)",
                  color: "#fff",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "DELETING…" : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        style={{
          width: 240,
          minWidth: 240,
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="label">MEMOS</span>
          <span className="label" style={{ color: "var(--fg-dim)" }}>{memos.length}</span>
        </div>

        {memos.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fg-dim)", lineHeight: 1.6, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              NO MEMOS YET.<br />RECORD ONE TO BEGIN.
            </p>
          </div>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.id}
              style={{
                position: "relative",
                borderBottom: "1px solid var(--line)",
                backgroundColor: activeMemoId === memo.id ? "var(--bg-elevated)" : "transparent",
              }}
              className="memo-row"
            >
              <Link href={`/memo/${memo.id}`} style={{ textDecoration: "none", display: "block", padding: "12px 36px 12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--fg-dim)", letterSpacing: "0.05em" }}>
                    {formatDate(memo.createdAt)} · {formatTime(memo.createdAt)}
                  </span>
                  {memo.hasFlags && !memo.flagAcked && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--flag)", flexShrink: 0 }} />
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "var(--fg)", fontFamily: "Inter, sans-serif", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {memo.summary || memo.transcript.slice(0, 80) + "…"}
                </p>
                {memo.filename && (
                  <span style={{ display: "block", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--fg-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {memo.filename}
                  </span>
                )}
              </Link>

              <button
                onClick={(e) => handleDeleteClick(e, memo.id)}
                title="Delete memo"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--fg-dim)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s, color 0.15s" }}
                className="delete-btn"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}

        <style>{`
          .memo-row:hover .delete-btn { opacity: 1 !important; }
          .delete-btn:hover { color: var(--flag) !important; }
        `}</style>
      </div>
    </>
  );
}