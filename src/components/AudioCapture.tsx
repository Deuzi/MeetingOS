"use client";

import { useState, useRef, useCallback } from "react";
import type { Memo, OrbState } from "@/types";

interface AudioCaptureProps {
  onMemoCreated: (memo: Memo) => void;
  onOrbStateChange: (state: OrbState) => void;
}

export default function AudioCapture({ onMemoCreated, onOrbStateChange }: AudioCaptureProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAudio = useCallback(async (file: File | Blob, filename?: string) => {
    setProcessing(true);
    setError("");
    onOrbStateChange("processing");
    setStatusMsg("TRANSCRIBING AUDIO…");

    try {
      // Step 1: Transcribe
      const formData = new FormData();
      formData.append("audio", file, filename || "recording.webm");
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || "Transcription failed");
      }

      const { transcript } = await transcribeRes.json();
      onOrbStateChange("synthesizing");
      setStatusMsg("EXTRACTING INTELLIGENCE…");

      // Step 2: Extract
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, filename: filename }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || "Extraction failed");
      }

      const { memo } = await extractRes.json();
      onMemoCreated(memo);
      onOrbStateChange(memo.hasFlags ? "flagged" : "idle");
      setStatusMsg("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setError(msg);
      onOrbStateChange("idle");
      setStatusMsg("");
    } finally {
      setProcessing(false);
    }
  }, [onMemoCreated, onOrbStateChange]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        processAudio(blob, "live-recording.webm");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      onOrbStateChange("processing");
      setStatusMsg("RECORDING…");
    } catch {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|webm|m4a|ogg)$/i))) {
      processAudio(file, file.name);
    } else {
      setError("Drop an audio file (.mp3, .wav, .webm, .m4a)");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAudio(file, file.name);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Record button */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            backgroundColor: recording ? "var(--flag)" : "var(--bg-elevated)",
            border: `1px solid ${recording ? "var(--flag)" : "var(--line)"}`,
            color: "var(--fg)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: processing ? "not-allowed" : "pointer",
            opacity: processing ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: recording ? "#fff" : "var(--flag)",
              animation: recording ? "blink 1s infinite" : "none",
            }}
          />
          {recording ? "STOP RECORDING" : "RECORD"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={recording || processing}
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            border: "1px solid var(--line)",
            color: "var(--fg-dim)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: recording || processing ? "not-allowed" : "pointer",
            opacity: recording || processing ? 0.4 : 1,
          }}
        >
          UPLOAD FILE
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `1px dashed ${dragOver ? "var(--fg)" : "var(--line)"}`,
          padding: "24px 20px",
          textAlign: "center",
          transition: "border-color 0.15s",
          backgroundColor: dragOver ? "var(--bg-elevated)" : "transparent",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "var(--fg-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          DROP AUDIO FILE HERE
          <br />
          <span style={{ fontSize: 9, marginTop: 4, display: "block" }}>
            MP3 · WAV · WEBM · M4A
          </span>
        </p>
      </div>

      {/* Status */}
      {statusMsg && (
        <div
          style={{
            padding: "8px 12px",
            border: "1px solid var(--line)",
            backgroundColor: "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "var(--fg)",
              animation: "pulse 1s infinite",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "var(--fg)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {statusMsg}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            border: "1px solid var(--flag)",
            backgroundColor: "rgba(255,59,48,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "var(--flag)",
              letterSpacing: "0.05em",
            }}
          >
            ERROR: {error}
          </span>
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              color: "var(--flag)",
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
