/**
 * Defensive parsing + validation, kept in its own file on purpose (see
 * README) so "did we get something safe to render?" is one function you
 * can point to, test, and reason about on its own — separate from the
 * networking code and separate from the UI.
 *
 * Never assume the model followed instructions. It can return:
 *  - prose wrapped around the JSON ("Sure, here's your flashcards: {...}")
 *  - JSON in a ```json fence
 *  - valid JSON with the wrong shape (missing fields, wrong types)
 *  - an empty array
 *  - nothing at all
 *
 * This function is the single gate between "raw model output" and
 * "safe to put in React state". Anything that fails returns null,
 * and the caller is expected to treat null as an error, never as an
 * empty-but-valid result.
 *
 * @param {string} raw
 * @returns {import('../types/result.js').StudySet | null}
 */
export function parseStudySet(raw) {
  if (!raw || typeof raw !== "string") return null;

  const jsonText = extractJson(raw);
  if (!jsonText) return null;

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null; // malformed JSON
  }

  if (!data || typeof data !== "object") return null;
  if (typeof data.topic !== "string" || !data.topic.trim()) return null;
  if (!Array.isArray(data.cards) || data.cards.length === 0) return null; // empty response

  const cards = [];
  for (const c of data.cards) {
    if (
      c &&
      typeof c.question === "string" &&
      c.question.trim() &&
      typeof c.answer === "string" &&
      c.answer.trim()
    ) {
      cards.push({ question: c.question.trim(), answer: c.answer.trim() });
    }
    // silently drop malformed individual cards rather than failing the
    // whole set — a partial good result is better than no result
  }

  if (cards.length === 0) return null; // every card was malformed

  return { topic: data.topic.trim(), cards };
}

/**
 * Models often wrap JSON in ```json fences or add a sentence before/after
 * it even when told not to. Pull out the first {...} block as a best
 * effort before handing it to JSON.parse.
 */
function extractJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  return candidate.slice(start, end + 1);
}
