"use client";
import { useRef, useEffect, useCallback } from "react";

/**
 * InteractiveMesh — a full-viewport canvas that draws a subtle dot-grid
 * which gently warps toward the user's pointer / touch position.
 * Lightweight: only re-draws on rAF when the pointer moves.
 */
export default function InteractiveMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const DOT_GAP = 28;
  const DOT_RADIUS = 1.2;
  const INFLUENCE_RADIUS = 180;
  const PUSH_STRENGTH = 14;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const mx = pointerRef.current.x;
    const my = pointerRef.current.y;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(w / DOT_GAP) + 1;
    const rows = Math.ceil(h / DOT_GAP) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = c * DOT_GAP;
        let y = r * DOT_GAP;

        const dx = x - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let alpha = 0.12;

        if (dist < INFLUENCE_RADIUS) {
          const t = 1 - dist / INFLUENCE_RADIUS;
          const ease = t * t; // quadratic ease
          x += (dx / (dist || 1)) * ease * PUSH_STRENGTH;
          y += (dy / (dist || 1)) * ease * PUSH_STRENGTH;
          // dots near cursor glow brighter
          alpha = 0.12 + ease * 0.35;
        }

        // Fade dots toward the bottom of the viewport
        const verticalFade = 1 - Math.min(y / h, 1) * 0.6;
        alpha *= verticalFade;

        ctx.beginPath();
        ctx.arc(x * dpr, y * dpr, DOT_RADIUS * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 160, 200, ${alpha})`;
        ctx.fill();
      }
    }
  }, []);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      pointerRef.current = { x: clientX, y: clientY };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      draw();
    };

    const handleMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleTouch, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, onMove]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
