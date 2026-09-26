import { useState } from "react";

/**
 * Self-graded quiz: the user answers in their head (or types a guess),
 * reveals the model's answer, then marks themselves right or wrong.
 * Wrong cards get queued into the next round, so the user keeps
 * re-testing only what they missed until the whole set is clear.
 */
export default function Quiz({ cards }) {
  const [round, setRound] = useState(cards);
  const [roundNumber, setRoundNumber] = useState(1);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [missed, setMissed] = useState([]);
  const [finished, setFinished] = useState(false);

  const current = round[cursor];

  function grade(correct) {
    if (!correct) setMissed((m) => [...m, current]);

    if (cursor + 1 < round.length) {
      setCursor((c) => c + 1);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  }

  function retestMissed() {
    setRound(missed);
    setMissed([]);
    setCursor(0);
    setRevealed(false);
    setFinished(false);
    setRoundNumber((n) => n + 1);
  }

  function restartAll() {
    setRound(cards);
    setMissed([]);
    setCursor(0);
    setRevealed(false);
    setFinished(false);
    setRoundNumber(1);
  }

  if (finished) {
    const allCorrect = missed.length === 0;
    return (
      <div className="quiz quiz--summary">
        <p className="deck-progress">Round {roundNumber} complete</p>
        <p className="state-title">
          {allCorrect ? "Nailed every card 🎉" : `${missed.length} to review`}
        </p>
        {!allCorrect && (
          <button className="prompt-submit" onClick={retestMissed}>
            Retest the {missed.length} you missed
          </button>
        )}
        <button className="retry-button" onClick={restartAll}>
          Restart full set
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <p className="deck-progress">
        Round {roundNumber} · Question {cursor + 1} of {round.length}
      </p>

      <div className="quiz-card">
        <p className="flashcard-text">{current.question}</p>
        {revealed && <p className="quiz-answer">{current.answer}</p>}
      </div>

      {!revealed ? (
        <button className="prompt-submit" onClick={() => setRevealed(true)}>
          Reveal answer
        </button>
      ) : (
        <div className="quiz-grade-buttons">
          <button className="quiz-btn quiz-btn--right" onClick={() => grade(true)}>
            I got it right
          </button>
          <button className="quiz-btn quiz-btn--wrong" onClick={() => grade(false)}>
            I got it wrong
          </button>
        </div>
      )}
    </div>
  );
}
