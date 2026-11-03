import { useLayoutEffect, useRef, type ReactNode } from "react";

const CELL = 10;
const DURATION = 500;
const JITTER = 8;

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pixel build-in: covers its children with background-colored cells, then clears them in a diagonal ripple.
 * Runs once on mount when `active`. Cells are bucketed by diagonal (O(n)) instead of sorted, and each frame
 * clears whole buckets, so large answers stay cheap.
 */
export function PixelReveal({ children, className, active = true }: { children: ReactNode; className?: string; active?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    if (!active || reducedMotion()) {
      c.style.display = "none";
      return;
    }

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    c.style.display = "";
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--package").trim() || "#15171c";
    ctx.fillRect(0, 0, w, h);

    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    const buckets: number[][] = Array.from({ length: cols + rows + JITTER }, () => []);
    for (let r = 0; r < rows; r++)
      for (let col = 0; col < cols; col++) buckets[col + r + ((Math.random() * JITTER) | 0)].push(col, r);

    let b = 0;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const target = Math.min(buckets.length, Math.ceil((buckets.length * (t - start)) / DURATION));
      for (; b < target; b++) {
        const cells = buckets[b];
        for (let i = 0; i < cells.length; i += 2) ctx.clearRect(cells[i] * CELL, cells[i + 1] * CELL, CELL, CELL);
      }
      if (b < buckets.length) raf = requestAnimationFrame(step);
      else c.style.display = "none";
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrap} className={["reveal", className].filter(Boolean).join(" ")}>
      {children}
      <canvas ref={canvas} className="px" aria-hidden="true" />
    </div>
  );
}
