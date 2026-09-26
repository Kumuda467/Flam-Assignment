/**
 * The frontend never calls the LLM provider directly and never sees an
 * API key. It calls our own backend (server/index.js), which holds the
 * key and forwards the prompt.
 *
 * generateStudySet() intentionally does NOT parse/validate the response —
 * that's validateResult.js's job. This function's only concerns are:
 * making the request, respecting an abort signal (for timeouts / stale
 * requests), and turning a bad HTTP response into a thrown Error the
 * caller can catch.
 */
export async function generateStudySet(topicText, { signal } = {}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: topicText }),
    signal,
  });

  if (!res.ok) {
    // Surface the backend's error message if it sent one, otherwise a
    // generic message keyed off the status code.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* body wasn't JSON — keep the generic message */
    }
    throw new Error(message);
  }

  const data = await res.json();
  // The backend returns { raw: "<whatever the model produced>" }.
  // We deliberately pass the RAW text back up to the caller rather than
  // parsing here, so validateResult.js is the single source of truth for
  // "is this usable".
  return data.raw;
}
