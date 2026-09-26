import { useRef, useState } from "react";
import PromptInput from "./components/PromptInput.jsx";
import LoadingState from "./components/LoadingState.jsx";
import ErrorState from "./components/ErrorState.jsx";
import EmptyState from "./components/EmptyState.jsx";
import ResultView from "./components/ResultView.jsx";
import { generateStudySet } from "./lib/api.js";
import { parseStudySet } from "./lib/validateResult.js";

// One request is allowed to be "in flight and matters" at a time.
// requestId lets an in-flight request check, when it resolves, whether
// it's still the latest one the user asked for.
const TIMEOUT_MS = 20000;

// status is one of: "idle" | "loading" | "error" | "success"
export default function App() {
  const [status, setStatus] = useState("idle");
  const [studySet, setStudySet] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastTopic, setLastTopic] = useState("");

  const requestId = useRef(0);
  const abortRef = useRef(null);

  async function runGeneration(topicText) {
    setLastTopic(topicText);
    setStatus("loading");
    setErrorMessage("");

    // Cancel any previous in-flight request and start a fresh id.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestId.current;

    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const raw = await generateStudySet(topicText, { signal: controller.signal });

      // A newer request has since started — this response is stale.
      // Silently drop it instead of overwriting fresher state.
      if (id !== requestId.current) return;

      const parsed = parseStudySet(raw);
      if (!parsed) {
        setStatus("error");
        setErrorMessage(
          "The model's response wasn't usable (empty or not in the expected format). Try again, or rephrase your topic."
        );
        return;
      }

      setStudySet(parsed);
      setStatus("success");
    } catch (err) {
      if (id !== requestId.current) return; // stale — ignore

      if (err.name === "AbortError") {
        setStatus("error");
        setErrorMessage("That took too long and timed out. Try again.");
      } else {
        setStatus("error");
        setErrorMessage(err.message || "Something went wrong talking to the server.");
      }
    } finally {
      if (id === requestId.current) clearTimeout(timeoutId);
    }
  }

  function handleRetry() {
    if (lastTopic) runGeneration(lastTopic);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Study Assistant</h1>
        <p className="app-subtitle">Paste notes or a topic. Get a flippable deck and a quiz.</p>
      </header>

      <PromptInput onSubmit={runGeneration} disabled={status === "loading"} />

      <main className="app-main">
        {status === "idle" && <EmptyState />}
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={errorMessage} onRetry={handleRetry} />}
        {status === "success" && studySet && <ResultView studySet={studySet} />}
      </main>
    </div>
  );
}
