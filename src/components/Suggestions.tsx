import type { Topic } from "../data/content";

export function Suggestions({
  items,
  onPick,
  compact,
}: {
  items: { topic: Topic; label: string }[];
  onPick: (t: Topic) => void;
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "suggestions compact" : "suggestions"} aria-label={compact ? "Follow-up questions" : "Suggested questions"}>
      {items.map((s) => (
        <li key={s.topic}>
          <button type="button" className="pill" onClick={() => onPick(s.topic)}>
            {s.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
