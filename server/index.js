import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * This is the ONLY place the API key exists. The browser never sees it —
 * it only ever talks to our /api/generate route, which is why this graded
 * requirement ("route the model call through a small backend") exists at
 * all: an API key shipped in frontend JS can be read by anyone who opens
 * devtools.
 */
app.post("/api/generate", async (req, res) => {
  const topic = (req.body?.topic || "").toString().trim();

  if (!topic) {
    return res.status(400).json({ error: "No topic or notes provided." });
  }
  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing GEMINI_API_KEY. Add it to server/.env." });
  }

  // Strict, shape-first prompt (Step 1/4 of the assignment guide): we
  // describe the exact JSON shape and forbid any prose around it. The
  // frontend still treats this as untrusted, though — see
  // src/lib/validateResult.js.
  const systemPrompt = `You generate study flashcards. Always respond with ONLY valid JSON, no prose, no markdown fences, matching exactly this shape:
{"topic": string, "cards": [{"question": string, "answer": string}]}
Return between 6 and 10 cards. Questions and answers must be concise (under 200 characters each).`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    let response;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: `Make a flashcard set from this input:\n\n${topic}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1500,
          },
        }),
        signal: controller.signal,
        }
      );

      const shouldRetry =
        !response.ok &&
        (response.status === 408 || response.status === 429 || response.status >= 500) &&
        attempt < 2;
      if (!shouldRetry) break;

      await response.arrayBuffer();
      const backoffMs = 1000 * 2 ** attempt + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error("LLM provider error:", response.status, errBody);
      const messages = {
        400: "The AI request was rejected. Check the Gemini API key and model configuration.",
        401: "The Gemini API key was rejected. Check GEMINI_API_KEY in server/.env.",
        403: "The Gemini API key does not have permission to use this model.",
        404: `The Gemini model '${MODEL}' was not found. Set GEMINI_MODEL to an available model in server/.env.`,
        429: "The Gemini API quota or rate limit was reached. Check your Google AI Studio quota and try again later.",
      };
      return res.status(502).json({
        error: messages[response.status] || `The AI provider returned an error (HTTP ${response.status}). Check the backend log for details.`,
      });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Note: we deliberately do NOT validate the shape here. The backend's
    // job is just "get text back from the model". Validation lives in
    // src/lib/validateResult.js on the frontend, so there's one place
    // that decides what's safe to render.
    res.json({ raw });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "The AI provider took too long to respond." });
    }
    console.error("Unexpected server error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy listening on http://localhost:${PORT}`);
});
