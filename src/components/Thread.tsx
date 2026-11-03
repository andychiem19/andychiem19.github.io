import { useEffect, useRef, useState } from "react";
import { followUpLabel, followUps, type Topic } from "../data/content";
import { Answer } from "./Answers";
import { PixelReveal } from "./PixelReveal";
import { Suggestions } from "./Suggestions";

export type Message = { id: number; role: "user"; text: string } | { id: number; role: "assistant"; topic: Topic };

const THINK_MS = 550;

function AssistantMessage({ topic, isLast, onAsk }: { topic: Topic; isLast: boolean; onAsk: (t: Topic) => void }) {
  const [thinking, setThinking] = useState(isLast);
  useEffect(() => {
    if (!thinking) return;
    const id = setTimeout(() => setThinking(false), THINK_MS);
    return () => clearTimeout(id);
  }, [thinking]);

  return (
    <article className="msg assistant" aria-label="Andy">
      <span className="avatar" aria-hidden="true" />
      <div className="msg-body">
        {thinking ? (
          <p className="thinking" role="status">
            <span />
            <span />
            <span />
            <span className="sr-only">Andy is typing</span>
          </p>
        ) : (
          <PixelReveal className="answer">
            <Answer topic={topic} onAsk={onAsk} />
            {isLast && (
              <Suggestions
                compact
                items={followUps[topic].map((t) => ({ topic: t, label: followUpLabel(t) }))}
                onPick={onAsk}
              />
            )}
          </PixelReveal>
        )}
      </div>
    </article>
  );
}

export function Thread({ messages, onAsk }: { messages: Message[]; onAsk: (t: Topic) => void }) {
  const lastUser = useRef<HTMLDivElement>(null);
  const count = messages.length;

  // Bring the newest question to the top so its answer reads from the start
  useEffect(() => {
    lastUser.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <AssistantMessage key={m.id} topic={m.topic} isLast={i === count - 1} onAsk={onAsk} />
        ),
      )}
      <div className="thread-spacer" aria-hidden="true" />
    </div>
  );
}
