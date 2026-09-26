export default function LoadingState() {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>Turning that into flashcards…</p>
    </div>
  );
}
