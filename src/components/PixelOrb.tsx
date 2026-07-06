"use client";

import { useEffect, useRef, useCallback } from "react";
import type { OrbState } from "@/types";

interface PixelOrbProps {
  state: OrbState;
  size?: number;
}

const GRID = 18; // 18x18 pixel grid
const CELL = 7;  // px per cell

export default function PixelOrb({ state, size = 140 }: PixelOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const pixelsRef = useRef<Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    brightness: number; red: number;
  }>>([]);

  // Build sphere pixel grid
  const initPixels = useCallback(() => {
    const pixels: typeof pixelsRef.current = [];
    const center = GRID / 2;
    const radius = GRID / 2 - 0.5;

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const dx = c - center + 0.5;
        const dy = r - center + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          // Map to sphere surface
          const nx = dx / radius;
          const ny = dy / radius;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const brightness = 0.3 + 0.5 * nz + 0.2 * Math.random();
          pixels.push({
            x: c, y: r, z: nz,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            vz: 0,
            brightness,
            red: 0,
          });
        }
      }
    }
    pixelsRef.current = pixels;
  }, []);

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const dt = t - timeRef.current;
    timeRef.current = t;
    const elapsed = t * 0.001;

    const pixels = pixelsRef.current;

    pixels.forEach((px) => {
      let targetBright = px.brightness;
      let targetRed = 0;

      if (state === "idle") {
        // Slow rotation glow — sine wave per pixel
        const pulseFactor = 0.5 + 0.3 * Math.sin(elapsed * 0.8 + px.x * 0.4 + px.y * 0.3);
        targetBright = px.brightness * pulseFactor * 0.6;
        px.red = 0;
      } else if (state === "processing") {
        // Rapid scramble: brightness flickers fast and randomly
        targetBright = Math.random() * 0.9 + 0.1;
        px.red = 0;
      } else if (state === "synthesizing") {
        // Pixels organize into brighter, coherent formation
        const wave = 0.6 + 0.4 * Math.sin(elapsed * 2 + px.z * 3);
        targetBright = px.brightness * wave * 1.1;
        px.red = 0;
      } else if (state === "flagged") {
        // Portion shifts red — bottom-right quadrant
        const isRed = px.x > GRID * 0.4 && px.y > GRID * 0.4;
        if (isRed) {
          targetRed = 0.8 + 0.2 * Math.sin(elapsed * 3);
          targetBright = 0.9;
        } else {
          targetBright = px.brightness * (0.4 + 0.2 * Math.sin(elapsed * 0.8));
          targetRed = 0;
        }
      }

      // Smooth lerp
      const lerpSpeed = state === "processing" ? 0.3 : 0.05;
      px.brightness = px.brightness + (targetBright - px.brightness) * Math.min(1, lerpSpeed * dt * 0.06);
      px.red = px.red + (targetRed - px.red) * 0.08;
    });

    // Rotation angle
    const rotSpeed = state === "processing" ? 4 : state === "synthesizing" ? 1.5 : 0.3;
    const angle = elapsed * rotSpeed * 0.05;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Draw pixels
    const offsetX = (W - GRID * CELL) / 2;
    const offsetY = (H - GRID * CELL) / 2;

    pixels.forEach((px) => {
      // Rotate around Y axis
      const cx = px.x - GRID / 2 + 0.5;
      const cz = px.z - 0.5;
      const rotX = cx * cosA - cz * sinA + GRID / 2 - 0.5;

      const screenX = offsetX + rotX * CELL;
      const screenY = offsetY + px.y * CELL;

      const b = Math.max(0, Math.min(1, px.brightness));
      const r = Math.max(0, Math.min(1, px.red));

      // Color: mix white brightness with flag red
      const red = Math.round(245 * (1 - r) * b + 255 * r);
      const green = Math.round(245 * (1 - r) * b);
      const blue = Math.round(240 * (1 - r) * b);
      const alpha = b * 0.95 + 0.03;

      ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;

      const cellSize = CELL - 1;
      ctx.fillRect(screenX, screenY, cellSize, cellSize);
    });

    frameRef.current = requestAnimationFrame(draw);
  }, [state]);

  useEffect(() => {
    initPixels();
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [initPixels, draw]);

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-label={`System status: ${state}`}
      role="status"
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          display: "block",
          imageRendering: "pixelated",
          filter: state === "flagged"
            ? "drop-shadow(0 0 8px rgba(255,59,48,0.4))"
            : state === "synthesizing"
            ? "drop-shadow(0 0 6px rgba(245,245,240,0.2))"
            : "none",
        }}
      />
      {/* State label */}
      <div
        style={{
          position: "absolute",
          bottom: -20,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: state === "flagged" ? "var(--flag)" : "var(--fg-dim)",
          whiteSpace: "nowrap",
        }}
      >
        {state === "idle" && "LISTENING"}
        {state === "processing" && "PROCESSING"}
        {state === "synthesizing" && "SYNTHESIZING"}
        {state === "flagged" && "⚠ CONFLICT"}
      </div>
    </div>
  );
}
