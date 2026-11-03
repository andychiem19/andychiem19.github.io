import { useEffect, useRef, useState } from "react";
import { followUpLabel, followUps, seenAnswers, type Message, type ProjectId, type Topic } from "../data/content";
import { Answer } from "./Answers";
import { PixelReveal } from "./PixelReveal";
import { Suggestions } from "./Suggestions";
import { loadWriteup } from "./Writeup";

const THINK_MS = 550;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function AssistantMessage({ id, topic, isLast, onAsk }: { id: number; topic: Topic; isLast: boolean; onAsk: (t: Topic) => void }) {
  const [fresh] = useState(() => !seenAnswers.has(id));
  const [thinking, setThinking] = useState(fresh);

  // "Typing" lasts at least THINK_MS, and for writeups until the page has loaded, so the reveal covers the real content
  useEffect(() => {
    if (!thinking) return;
    let live = true;
    const writeup = topic.startsWith("writeup:") ? loadWriteup(topic.slice(8) as ProjectId).catch(() => null) : null;
    Promise.all([wait(THINK_MS), writeup]).then(() => live && setThinking(false));
    return () => {
      live = false;
    };
  }, [thinking, topic]);

  useEffect(() => {
    if (!thinking) seenAnswers.add(id);
  }, [thinking, id]);

  return (
    <article className="msg assistant" aria-label="Andy">
      {thinking ? (
        <p className="thinking" role="status">
          <span aria-hidden="true" />
          <span className="sr-only">Andy is typing</span>
        </p>
      ) : (
        <PixelReveal className="answer" active={fresh}>
          <Answer topic={topic} onAsk={onAsk} />
          {isLast && (
            <Suggestions compact items={followUps(topic).map((t) => ({ topic: t, label: followUpLabel(t) }))} onPick={onAsk} />
          )}
        </PixelReveal>
      )}
    </article>
  );
}

export function Thread({ messages, onAsk }: { messages: Message[]; onAsk: (t: Topic) => void }) {
  const lastUser = useRef<HTMLDivElement>(null);
  const count = messages.length;

  // Bring the newest question to the top so its answer reads from the start
  useEffect(() => {
    lastUser.current?.scrollIntoView({ behavior: count > 2 ? "smooth" : "auto", block: "start" });
  }, [count]);

  const lastUserIndex = messages.findLastIndex((m) => m.role === "user");

  return (
    <div className="thread">
      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={m.id} ref={i === lastUserIndex ? lastUser : undefined} className="msg user">
            <p>{m.text}</p>
          </div>
        ) : (
          <AssistantMessage key={m.id} id={m.id} topic={m.topic} isLast={i === count - 1} onAsk={onAsk} />
        ),
      )}
      <div className={count > 2 ? "thread-spacer" : "thread-spacer short"} aria-hidden="true" />
    </div>
  );
}
