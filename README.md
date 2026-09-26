# Study Assistant

Paste notes or a topic → an LLM returns a structured flashcard set (JSON, not
chat text) → the app renders it as a flippable deck and a self-graded quiz
that re-tests whatever you got wrong.

Built for the Frontend Internship take-home assignment.

## What it does

- Free-form textarea for notes or a topic.
- Backend calls Claude (Anthropic) with a strict prompt asking for JSON only,
  in the exact shape `{ topic, cards: [{question, answer}] }`.
- Frontend validates that shape before rendering anything (`src/lib/validateResult.js`).
- Two interactive views built on the same parsed data:
  - **Flashcards** — flip through question/answer cards.
  - **Quiz me** — reveal-and-self-grade; wrong cards queue into the next round
    until you clear the whole set.
- Handles malformed JSON, wrong shape, empty responses, slow responses
  (20s timeout), failed requests, and stale responses (an old request can't
  overwrite a newer one) — see "How failure is handled" below.
- Works down to a narrow mobile viewport.

## Project structure

```
flam-frontend-assignment/
├── src/
│   ├── components/
│   │   ├── PromptInput.jsx      # the free-form text input
│   │   ├── ResultView.jsx       # routes parsed data to Deck / Quiz
│   │   ├── FlashcardDeck.jsx    # flip-card view
│   │   ├── Quiz.jsx             # self-graded quiz + retest-wrong loop
│   │   ├── LoadingState.jsx
│   │   ├── ErrorState.jsx       # shared error + retry UI
│   │   └── EmptyState.jsx
│   ├── lib/
│   │   ├── api.js               # calls the backend proxy, never the LLM directly
│   │   └── validateResult.js    # parses + validates the model's JSON
│   ├── types/result.js          # JSDoc shape of the structured data
│   └── App.jsx                  # the state machine: idle/loading/error/success
├── server/
│   └── index.js                 # Express proxy; holds the API key
├── vite.config.js
└── index.html
```

## Setup

Requires Node 18+.

**1. Backend**

```bash
cd server
npm install
cp .env.example .env
# edit .env and set GEMINI_API_KEY
npm start
```

Backend runs at `http://localhost:8787`.

**2. Frontend** (in a second terminal, from the project root)

```bash
npm install
npm start
```

Opens at `http://localhost:5173`. Vite proxies `/api/*` to the backend
(see `vite.config.js`), so the frontend never needs to know the backend's
real URL or hold any key.

### Deploy to Render

This repository includes a `render.yaml` Blueprint that deploys the frontend
and API as one Node web service. In Render, choose **New +** → **Blueprint**
and select this GitHub repository. During setup, enter a valid `GEMINI_API_KEY`
when prompted. Render builds the Vite frontend, serves it from Express, and
uses the same origin for `/api/generate`. The key stays in Render's environment
and is not part of the repository.

### Using a different provider

The backend only touches `server/index.js`. Anthropic's Messages API is used
by default; to swap to OpenAI, Groq, or a local Ollama model, replace the
`fetch(...)` block with that provider's chat-completions call and change the
env var name — the rest of the app (validation, UI, error handling) doesn't
need to change, since it only ever deals with `{ raw: string }`.

## How failure is handled

This was the main focus of the assignment, so here's exactly where each
case is handled:

| Failure mode | Where | Behavior |
|---|---|---|
| Malformed JSON | `validateResult.js` → `JSON.parse` in a try/catch | Returns `null`, App shows error state with retry |
| Wrong shape (missing/wrong-type fields) | `validateResult.js` structural checks | Returns `null` → error state. Individual malformed cards are dropped rather than failing the whole set, if the rest of the set is valid |
| Empty response (`cards: []`) | `validateResult.js` | Treated as failure, not a valid empty result |
| Slow response | `App.jsx` — `AbortController` + 20s timeout | Times out, shows "took too long" error with retry |
| Failed request (network/5xx) | `api.js` throws, `App.jsx` catches | Error state, not a crash |
| Stale response | `App.jsx` — incrementing `requestId` ref, checked after every `await` | A slower earlier request's result is silently discarded if a newer request has since started |

No unhandled promise rejections reach the UI; every path through
`runGeneration()` in `App.jsx` ends in `status: "success"` or
`status: "error"`, never a silent freeze.

## AI-usage note

I used Claude to scaffold the initial component boundaries and to review the
stale-response guard and the JSON-extraction regex in `validateResult.js`
(models sometimes wrap JSON in ```` ```json ```` fences even when told not
to, so I asked for help handling that case robustly). I wrote and tested the
quiz retest-loop logic and the App-level state machine myself, and I
understand and can walk through every file.

## Known limitations

- The quiz is self-graded (reveal-and-judge), not typed-answer-matched —
  matching free-text answers reliably against the model's answer is a
  much harder problem than fits in this scope.
- No persistence yet — refreshing loses the current set (see stretch goals
  below).
- No streaming — the full response is validated before anything renders,
  which is safer for structured data but means no partial-card feedback
  while generating.
- Only one block type (flashcard) is implemented; the "different kinds of
  blocks" stretch goal (chart/checklist) wasn't attempted given the time
  budget.

## Stretch goals not attempted (given the 8-hour budget)

- Streaming generation
- Refinement loop (follow-up prompts editing the existing set)
- Save/reload sessions
- Multiple block types

## Time spent

~7.5 hours: ~1 hr planning the data shape and prompt, ~1 hr backend proxy,
~3.5 hrs frontend components + state machine, ~1.5 hrs failure-mode testing
(deliberately breaking the prompt to see malformed/empty output), ~0.5 hr
README/polish.
