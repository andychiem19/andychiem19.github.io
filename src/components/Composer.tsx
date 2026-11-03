import { ArrowUp } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

export function Composer({ onSend, autoFocus }: { onSend: (text: string) => void; autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    area.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    submit();
  };

  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="ask" className="sr-only">
        Ask Andy a question
      </label>
      <textarea
        id="ask"
        ref={area}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        placeholder="Ask about my projects, experience, or education..."
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="composer-bar">
        <span className="composer-model">
          <span className="led" aria-hidden="true" />
          andy-chiem · pre-written answers
        </span>
        <button type="submit" className="send" disabled={!value.trim()} aria-label="Send">
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
