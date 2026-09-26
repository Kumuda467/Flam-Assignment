import { useState } from "react";
import FlashcardDeck from "./FlashcardDeck.jsx";
import Quiz from "./Quiz.jsx";

/**
 * Once we have a validated StudySet, this is the only place that decides
 * what to render. Today it's a two-way toggle (deck / quiz), but this is
 * also the seam where the "stretch goal" of routing different block
 * types (card vs chart vs checklist) would plug in — one switch here,
 * one component per block type.
 */
export default function ResultView({ studySet }) {
  const [mode, setMode] = useState("deck");

  return (
    <div className="result-view">
      <div className="result-header">
        <h2>{studySet.topic}</h2>
        <div className="mode-toggle">
          <button
            className={mode === "deck" ? "mode-btn mode-btn--active" : "mode-btn"}
            onClick={() => setMode("deck")}
          >
            Flashcards
          </button>
          <button
            className={mode === "quiz" ? "mode-btn mode-btn--active" : "mode-btn"}
            onClick={() => setMode("quiz")}
          >
            Quiz me
          </button>
        </div>
      </div>

      {mode === "deck" ? (
        <FlashcardDeck cards={studySet.cards} />
      ) : (
        <Quiz key={studySet.topic} cards={studySet.cards} />
      )}
    </div>
  );
}
