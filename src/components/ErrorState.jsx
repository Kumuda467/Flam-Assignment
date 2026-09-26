export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <p className="state-title">Couldn't generate that set</p>
      <p className="state-detail">{message}</p>
      <button className="retry-button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
