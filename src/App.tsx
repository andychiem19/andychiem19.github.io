import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { Sidebar } from "./components/Sidebar";
import { Suggestions } from "./components/Suggestions";
import { Thread, type Message } from "./components/Thread";
import { hashFromTopic, prompts, routeQuestion, starterSuggestions, topicFromHash, type Topic } from "./data/content";

let nextId = 1;

function initialMessages(): Message[] {
  const t = topicFromHash(location.hash);
  if (!t || t === "unknown") return [];
  return [
    { id: nextId++, role: "user", text: prompts[t] },
    { id: nextId++, role: "assistant", topic: t },
  ];
}

export function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const main = useRef<HTMLElement>(null);

  const lastAssistant = messages.findLast((m) => m.role === "assistant");
  const current = lastAssistant?.role === "assistant" ? lastAssistant.topic : null;

  useEffect(() => {
    const hash = current ? hashFromTopic(current) : "";
    history.replaceState(null, "", hash ? `#${hash}` : location.pathname + location.search);
  }, [current]);

  const push = useCallback((text: string, topic: Topic) => {
    setMessages((m) => [...m, { id: nextId++, role: "user", text }, { id: nextId++, role: "assistant", topic }]);
    setSidebarOpen(false);
  }, []);

  const ask = useCallback((t: Topic) => push(t === "unknown" ? "..." : prompts[t], t), [push]);
  const send = useCallback((text: string) => push(text, routeQuestion(text)), [push]);

  // Links to #project-N (or #about, #contact, ...) open that topic without a reload
  useEffect(() => {
    const onHash = () => {
      const t = topicFromHash(location.hash);
      if (t) ask(t);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, [ask]);
  const reset = () => {
    setMessages([]);
    setSidebarOpen(false);
    main.current?.scrollTo(0, 0);
  };

  const empty = messages.length === 0;

  return (
    <div className="shell">
      <Sidebar open={sidebarOpen} current={current} onAsk={ask} onNew={reset} />
      {sidebarOpen && <button type="button" className="scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main ref={main} className={empty ? "chat empty" : "chat"}>
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="topbar-title">{empty ? "" : "Andy Chiem"}</span>
        </header>

        {empty ? (
          <section className="welcome" aria-labelledby="welcome-title">
            <p className="welcome-kicker">ECE @ Cornell Duffield Engineering {"'29"}</p>
            <h1 id="welcome-title" className="text-balance">
              {"Hi, I'm Andy. What would you like to know?"}
            </h1>
            <Composer onSend={send} autoFocus />
            <Suggestions items={starterSuggestions} onPick={ask} />
          </section>
        ) : (
          <>
            <Thread messages={messages} onAsk={ask} />
            <div className="dock">
              <Composer onSend={send} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
