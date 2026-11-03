import type { Topic } from "../data/content";

/** Prompt suggestions drawn as small IC packages: pins on top and bottom, a pin-1 dot */
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
          <button type="button" className="ic" onClick={() => onPick(s.topic)}>
            {s.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
