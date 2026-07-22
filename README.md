# Phoebe — FUPRE Student Information Chatbot

Phoebe is a **rule-based** chatbot that answers FUPRE student questions about
registration, the academic calendar, exams, clearance, hostel accommodation,
fees, results, departments, and contacts.

There is **no LLM, no ML model, and no external AI API** in the response
pipeline. Every reply is a pre-written string from `phoebe_knowledge_base.json`,
selected by a weighted keyword-scoring algorithm. This is by design: the goal
is zero hallucination and full traceability — every answer can be traced back
to a specific, documented knowledge-base entry.

## Architecture

```
User (browser)
   -> POST /api/chat { message }        (public/script.js)
   -> Express route                     (server.js)
   -> normalize, tokenize, score        (nlp.js)
   -> best-matching intent's response, or fallback if below threshold
   <- { response, intent }              (JSON)
   -> rendered in the chat window       (public/script.js)
```

- **Frontend** (`public/`): vanilla HTML/CSS/JS messaging-style chat UI.
- **Backend** (`server.js`): Express server, one endpoint, loads the
  knowledge base once at startup.
- **NLP engine** (`nlp.js`): pure, dependency-free scoring function, kept in
  its own module so it can be unit-tested without a server.
- **Data** (`phoebe_knowledge_base.json`): static knowledge base — `_meta`
  (confidence threshold + fallback text) and `intents[]` (each with a name,
  weighted keywords, and a response string).

## How the scoring algorithm works

For every incoming message:

1. **Normalize** — lowercase, strip punctuation, collapse whitespace. The
   same normalization is applied to knowledge-base keywords, so a keyword
   like `"75%"` and a message containing `"75%"` both reduce to `"75"`.
2. **Tokenize** — split into words, remove common stop-words (`the`, `is`,
   `a`, `what`, `how`, ...).
3. **Score each intent** — for every keyword `{ word, weight }` on an
   intent:
   - If the keyword is a single word, it must appear as a whole token in
     the message (prevents false positives like `"hi"` matching inside
     `"history"`).
   - If the keyword is a multi-word phrase (e.g. `"course registration"`),
     it's matched as a **substring** of the full normalized message, since
     splitting it into tokens would lose the word adjacency the phrase
     depends on.
   - Matched keyword weights are summed into that intent's score.
4. **Select** — the intent with the highest total score wins.
5. **Threshold check** — if the winning score is below
   `_meta.confidence_threshold`, Phoebe returns `_meta.fallback_response`
   instead, with intent `"fallback"`.
6. The winning intent's `response` string (and its `intent` name) is
   returned as JSON, untouched from the knowledge base.

## Project structure

```
phoebe/
  server.js                   Express backend + /api/chat route
  nlp.js                      scoring engine (normalize/tokenize/classify)
  phoebe_knowledge_base.json  static knowledge base
  public/
    index.html
    style.css
    script.js
  test/
    nlp.test.js                assert-based tests for nlp.js
  package.json
  README.md
```

## Running it

Requires Node.js (v18+ recommended).

```bash
npm install
npm start
```

Then open **http://localhost:3000** in a browser.

## Running the NLP tests

```bash
npm test
```

This runs `test/nlp.test.js`, which checks normalization/tokenization
behavior and verifies sample queries route to the correct intent (e.g.
`"when does registration close"` → `registration_deadline`,
`"how do I get a hostel"` → `hostel`), plus fallback behavior for
messages that don't clear the confidence threshold.

## API

**POST** `/api/chat`

Request body:
```json
{ "message": "when does registration close" }
```

Response body:
```json
{ "response": "For the 2025/2026 session: registration opened...", "intent": "registration_deadline" }
```

## Extending the knowledge base

To add or change what Phoebe knows, edit `phoebe_knowledge_base.json` only —
add a new object to `intents[]` with an `intent` name, `keywords` (word +
weight pairs), and a `response` string. No code changes are needed; the
server reloads the file on every restart.
