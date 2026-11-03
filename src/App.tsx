import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Composer } from "./components/Composer";
import { Sidebar } from "./components/Sidebar";
import { Suggestions } from "./components/Suggestions";
import { Thread } from "./components/Thread";
import {
  chatIdFromHash,
  newMessageId,
  promptFor,
  routeQuestion,
  seedChats,
  starterSuggestions,
  type Chat,
  type Topic,
} from "./data/content";

const wide = () => matchMedia("(min-width: 801px)").matches;
const initialChats = seedChats();
let recentCount = 0;

export function App() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const id = chatIdFromHash(location.hash);
    return initialChats.some((c) => c.id === id) ? id : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(wide);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const lastAnswer = active?.messages.findLast((m) => m.role === "assistant");
  const context = lastAnswer?.role === "assistant" ? lastAnswer.topic : null;

  useEffect(() => {
    history.replaceState(null, "", activeId ? `#${activeId}` : location.pathname + location.search);
    document.title = active ? `${active.title} · Andy Chiem` : "Andy Chiem";
  }, [activeId, active]);

  const open = useCallback((id: string | null) => {
    setActiveId(id);
    if (!wide()) setSidebarOpen(false);
  }, []);

  /** Appends a question and its answer to the open chat, or starts a new chat in Recents */
  const push = useCallback(
    (text: string, topic: Topic) => {
      const turn = [
        { id: newMessageId(), role: "user" as const, text },
        { id: newMessageId(), role: "assistant" as const, topic },
      ];
      if (activeId) {
        setChats((cs) => cs.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, ...turn] } : c)));
      } else {
        const id = `chat-${++recentCount}`;
        setChats((cs) => [...cs, { id, title: text, group: "recent", dot: "blue", messages: turn }]);
        setActiveId(id);
      }
    },
    [activeId],
  );

  const ask = useCallback((t: Topic) => push(promptFor(t), t), [push]);
  const send = useCallback((text: string) => push(text, routeQuestion(text, context)), [push, context]);

  // Links to #project-N (or #about, #contact, ...) open that chat without a reload
  useEffect(() => {
    const onHash = () => {
      const id = chatIdFromHash(location.hash);
      if (chats.some((c) => c.id === id)) open(id);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, [chats, open]);

  return (
    <div className={sidebarOpen ? "shell" : "shell side-closed"}>
      <Sidebar chats={chats} activeId={activeId} onOpen={open} onNew={() => open(null)} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button type="button" className="scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      <main className={active ? "chat" : "chat empty"}>
        <header className="topbar">
          {!sidebarOpen && (
            <button type="button" className="icon-btn" aria-label="Open sidebar" aria-controls="sidebar" onClick={() => setSidebarOpen(true)}>
              <PanelLeft size={18} aria-hidden="true" />
            </button>
          )}
          {active && <h1 className="topbar-title">{active.title}</h1>}
        </header>

        {active ? (
          <>
            <Thread key={active.id} messages={active.messages} onAsk={ask} />
            <div className="dock">
              <Composer onSend={send} placeholder="Reply to Andy..." />
            </div>
          </>
        ) : (
          <section className="welcome" aria-labelledby="welcome-title">
            <h1 id="welcome-title">{"Hi, I'm Andy"}</h1>
            <Composer onSend={send} autoFocus placeholder="Ask about my projects, experience, or education" />
            <Suggestions items={starterSuggestions} onPick={ask} />
          </section>
        )}
      </main>
    </div>
  );
}
