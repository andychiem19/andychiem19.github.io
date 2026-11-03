import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Legend = "process" | "io" | "hw" | "rtl" | "debug" | "ext";
const legendLabels: Record<Legend, string> = {
  process: "Software model",
  io: "Interface",
  hw: "Hardware IP",
  rtl: "RTL module",
  debug: "Debug core",
  ext: "External service",
};

type Active = { el: Element; name: string; info: string };

const nameOf = (el: Element) =>
  (el as HTMLElement).dataset.name || el.textContent?.replace(/\s+/g, " ").trim() || "";

/**
 * Interactive block diagram: any descendant with data-info is a block. Hover, focus, or tap one to see a
 * tooltip next to it. One delegated handler per diagram replaces the per-block listeners of the old script.
 */
export function DiagramBox({
  children,
  legend,
  legendOverrides,
}: {
  children: ReactNode;
  legend: Legend[];
  legendOverrides?: Partial<Record<Legend, string>>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Active | null>(null);

  const show = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.("[data-info]");
    if (!el || !box.current?.contains(el)) return;
    if (active?.el === el) return;
    setActive({ el, name: nameOf(el), info: (el as HTMLElement).dataset.info ?? "" });
  };

  // Mark the active block and place the tooltip centered on it, above unless there's no room
  useLayoutEffect(() => {
    box.current?.querySelectorAll("[data-info]").forEach((b) => b.classList.toggle("active", b === active?.el));
    if (!active || !box.current || !tip.current) return;
    const b = box.current.getBoundingClientRect();
    const r = active.el.getBoundingClientRect();
    const t = tip.current.getBoundingClientRect();
    const cx = r.left + r.width / 2 - b.left;
    const x = Math.max(8, Math.min(cx - t.width / 2, b.width - t.width - 8));
    const above = r.top - b.top - t.height - 12;
    const below = above < 4;
    tip.current.style.left = `${x}px`;
    tip.current.style.top = `${below ? r.bottom - b.top + 12 : above}px`;
    tip.current.classList.toggle("below", below);
    tip.current.style.setProperty("--arrow-x", `${Math.max(12, Math.min(cx - x, t.width - 12))}px`);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const hide = () => setActive(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("click", hide);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", hide);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <div
      ref={box}
      className="visual diagram-box"
      onMouseOver={(e) => show(e.target)}
      onFocus={(e) => show(e.target)}
      onClick={(e) => {
        if ((e.target as Element).closest("[data-info]")) {
          e.stopPropagation();
          show(e.target);
        }
      }}
      onMouseLeave={() => setActive(null)}
    >
      {children}
      <ul className="legend">
        {legend.map((l) => (
          <li key={l}>
            <i className={l} />
            {legendOverrides?.[l] ?? legendLabels[l]}
          </li>
        ))}
      </ul>
      <p className="diagram-hint">Hover or tap a block to see what it does.</p>
      <div ref={tip} className="tip" role="tooltip" hidden={!active}>
        {active && (
          <>
            <strong>{active.name}</strong>
            {active.info}
          </>
        )}
      </div>
    </div>
  );
}
