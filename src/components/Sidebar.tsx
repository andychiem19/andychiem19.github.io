import { Download, FileText, SquarePen } from "lucide-react";
import { links, projects, type Topic } from "../data/content";

const sections: { topic: Topic; label: string }[] = [
  { topic: "about", label: "About me" },
  { topic: "experience", label: "Experience" },
  { topic: "education", label: "Education" },
  { topic: "contact", label: "Contact" },
];

export function Sidebar({
  open,
  current,
  onAsk,
  onNew,
}: {
  open: boolean;
  current: Topic | null;
  onAsk: (t: Topic) => void;
  onNew: () => void;
}) {
  return (
    <aside id="sidebar" className={open ? "sidebar open" : "sidebar"} aria-label="Conversations">
      <div className="brand">
        <span className="brand-chip" aria-hidden="true" />
        <span>andy chiem</span>
      </div>

      <button type="button" className="side-new" onClick={onNew}>
        <SquarePen size={16} aria-hidden="true" />
        New chat
      </button>

      <nav className="side-nav">
        <p className="side-label">Projects</p>
        <ul>
          {projects.map((p) => {
            const t: Topic = `project:${p.id}`;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={p.status === "progress" ? "in-progress" : undefined}
                  aria-current={current === t ? "true" : undefined}
                  onClick={() => onAsk(t)}
                >
                  <span className="side-text">{p.short}</span>
                  {p.status === "progress" && <span className="sr-only">(in progress)</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="side-label">Ask about</p>
        <ul>
          {sections.map((s) => (
            <li key={s.topic}>
              <button type="button" aria-current={current === s.topic ? "true" : undefined} onClick={() => onAsk(s.topic)}>
                <span className="side-text">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="side-foot">
        <a href="/classic.html">
          <FileText size={16} aria-hidden="true" />
          Classic view
        </a>
        <a href={links.pdf} download>
          <Download size={16} aria-hidden="true" />
          Portfolio PDF
        </a>
      </div>
    </aside>
  );
}
