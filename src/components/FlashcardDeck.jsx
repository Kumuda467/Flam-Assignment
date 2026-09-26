import { useState } from "react";

export default function FlashcardDeck({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function prev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  return (
    <div className="deck">
      <p className="deck-progress">
        Card {index + 1} of {cards.length}
      </p>

      <button
        className={`flashcard ${flipped ? "flashcard--flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Showing answer, click to show question" : "Showing question, click to show answer"}
      >
        <span className="flashcard-eyebrow">{flipped ? "Answer" : "Question"}</span>
        <span className="flashcard-text">{flipped ? card.answer : card.question}</span>
        <span className="flashcard-hint">Tap to flip</span>
      </button>

      <div className="deck-nav">
        <button onClick={prev} disabled={cards.length < 2}>
          ← Prev
        </button>
        <button onClick={next} disabled={cards.length < 2}>
          Next →
        </button>
      </div>
    </div>
  );
}
