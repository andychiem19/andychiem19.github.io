import { use, useLayoutEffect, useRef } from "react";
import { projectById, type ProjectId } from "../data/content";

const pending = new Map<ProjectId, Promise<string>>();
const loaded = new Map<ProjectId, string>();

/** Fetches the standalone writeup page once and keeps only its article body, so both versions share one source */
export function loadWriteup(id: ProjectId): Promise<string> {
  let p = pending.get(id);
  if (!p) {
    p = fetch(`/writeups/${projectById(id).writeup}`)
      .then((r) => {
        if (!r.ok) throw new Error(`writeup ${id}: ${r.status}`);
        return r.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const body = doc.querySelector(".doc-body");
        body?.querySelectorAll(".diagram-info").forEach((n) => n.remove());
        const out = body?.innerHTML ?? "";
        loaded.set(id, out);
        return out;
      });
    pending.set(id, p);
  }
  return p;
}

/** Hover / focus / tap tooltips for the diagrams inside writeup HTML (the same behavior as DiagramBox) */
function attachTips(box: HTMLElement): () => void {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  box.append(tip);
  const blocks = [...box.querySelectorAll<HTMLElement | SVGElement>("[data-info]")];
  blocks.forEach((b) => (b.tabIndex = 0));

  const show = (el: Element | null) => {
    blocks.forEach((b) => b.classList.toggle("active", b === el));
    if (!el) return void (tip.hidden = true);
    const name = document.createElement("strong");
    name.textContent = (el as HTMLElement).dataset.name || el.textContent?.replace(/\s+/g, " ").trim() || "";
    tip.replaceChildren(name, (el as HTMLElement).dataset.info ?? "");
    tip.hidden = false;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const cx = r.left + r.width / 2 - b.left;
    const x = Math.max(8, Math.min(cx - t.width / 2, b.width - t.width - 8));
    const above = r.top - b.top - t.height - 12;
    const below = above < 4;
    tip.style.left = `${x}px`;
    tip.style.top = `${below ? r.bottom - b.top + 12 : above}px`;
    tip.classList.toggle("below", below);
    tip.style.setProperty("--arrow-x", `${Math.max(12, Math.min(cx - x, t.width - 12))}px`);
  };
  const target = (e: Event) => (e.target as Element).closest?.("[data-info]");
  const over = (e: Event) => {
    const el = target(e);
    if (el && !el.classList.contains("active")) show(el);
  };
  const click = (e: Event) => {
    const el = target(e);
    if (el) {
      e.stopPropagation();
      show(el);
    }
  };
  const leave = () => show(null);
  const hide = () => show(null);
  const key = (e: KeyboardEvent) => e.key === "Escape" && show(null);

  box.addEventListener("mouseover", over);
  box.addEventListener("focusin", over);
  box.addEventListener("click", click);
  box.addEventListener("mouseleave", leave);
  document.addEventListener("click", hide);
  document.addEventListener("keydown", key);
  return () => {
    box.removeEventListener("mouseover", over);
    box.removeEventListener("focusin", over);
    box.removeEventListener("click", click);
    box.removeEventListener("mouseleave", leave);
    document.removeEventListener("click", hide);
    document.removeEventListener("keydown", key);
    tip.remove();
  };
}

export function Writeup({ id }: { id: ProjectId }) {
  const html = loaded.get(id) ?? use(loadWriteup(id));
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const boxes = [...(ref.current?.querySelectorAll<HTMLElement>(".diagram-box") ?? [])];
    const detach = boxes.map(attachTips);
    return () => detach.forEach((d) => d());
  }, [html]);

  return <div ref={ref} className="writeup" dangerouslySetInnerHTML={{ __html: html }} />;
}
