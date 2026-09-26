import { useState } from "react";

export default function PromptInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <label htmlFor="topic-input" className="prompt-label">
        Paste your notes, or just name a topic
      </label>
      <textarea
        id="topic-input"
        className="prompt-textarea"
        placeholder="e.g. The French Revolution, or paste a chunk of your biology notes…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        disabled={disabled}
      />
      <button className="prompt-submit" type="submit" disabled={disabled || !value.trim()}>
        {disabled ? "Generating…" : "Generate flashcards"}
      </button>
    </form>
  );
}
