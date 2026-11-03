import { ChevronDown, Download, FileText, PanelLeft, Plus } from "lucide-react";
import { useState } from "react";
import { links, type Chat } from "../data/content";

const groups: { id: Chat["group"]; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "recent", label: "Recents" },
];

const dotLabel: Record<Chat["dot"], string | null> = { blue: null, done: "complete", progress: "in progress" };

export function Sidebar({
  chats,
  activeId,
  onOpen,
  onNew,
  onClose,
}: {
  chats: Chat[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Partial<Record<Chat["group"], boolean>>>({});

  return (
    <aside id="sidebar" className="sidebar" aria-label="Chats">
      <div className="side-head">
        <span className="wordmark">Andy Chiem</span>
        <button type="button" className="icon-btn" aria-label="Close sidebar" onClick={onClose}>
          <PanelLeft size={18} aria-hidden="true" />
        </button>
      </div>

      <button type="button" className="side-new" aria-current={activeId === null ? "page" : undefined} onClick={onNew}>
        <Plus size={18} aria-hidden="true" />
        New chat
      </button>

      <nav className="side-nav" aria-label="Chats">
        {groups.map((g) => {
          const items = chats.filter((c) => c.group === g.id);
          if (!items.length) return null;
          const open = !collapsed[g.id];
          return (
            <section key={g.id} className="side-group">
              <button
                type="button"
                className="side-label"
                aria-expanded={open}
                onClick={() => setCollapsed((s) => ({ ...s, [g.id]: open }))}
              >
                {g.label}
                <ChevronDown size={14} aria-hidden="true" className={open ? "" : "flipped"} />
              </button>
              {open && (
                <ul>
                  {(g.id === "recent" ? [...items].reverse() : items).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="side-item"
                        aria-current={activeId === c.id ? "page" : undefined}
                        onClick={() => onOpen(c.id)}
                      >
                        <span className={`dot ${c.dot}`} aria-hidden="true" />
                        <span className="side-text">{c.title}</span>
                        {dotLabel[c.dot] && <span className="sr-only">({dotLabel[c.dot]})</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </nav>

      <div className="side-foot">
        <span className="me" aria-hidden="true">
          A
        </span>
        <span className="me-text">
          <strong>Andy Chiem</strong>
          <span>{"Cornell ECE '29"}</span>
        </span>
        <a className="icon-btn" href="/classic.html" aria-label="Classic view" title="Classic view">
          <FileText size={17} aria-hidden="true" />
        </a>
        <a className="icon-btn" href={links.pdf} download aria-label="Download portfolio PDF" title="Portfolio PDF">
          <Download size={17} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
