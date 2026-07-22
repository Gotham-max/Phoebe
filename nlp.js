/**
 * nlp.js — Phoebe's weighted keyword-scoring NLP engine.
 *
 * No LLM/ML/external calls. This module is a pure, deterministic function
 * of (message, knowledgeBase) -> {intent, response, score}. It is kept
 * separate from server.js so it can be unit-tested in isolation.
 */

'use strict';

// Common words stripped before single-word keyword matching so that they
// can't accidentally satisfy a keyword and so scoring focuses on content
// words. Multi-word keyword phrases are matched against the *unfiltered*
// normalized message (see scoreIntent), so stop-word removal never breaks
// a phrase like "how much" or "when will results".
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or',
  'but', 'my', 'me', 'i', 'you', 'your', 'it', 'this', 'that', 'with',
  'as', 'so', 'if', 'please', 'kindly', 'about', 'what', 'when', 'where',
  'who', 'which', 'how'
]);

/**
 * Normalize raw input: lowercase, strip punctuation, collapse whitespace.
 * Applied identically to both the incoming message and the knowledge-base
 * keywords, so a keyword like "75%" and a message containing "75%" reduce
 * to the same token ("75") regardless of the punctuation each happened
 * to contain.
 */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a normalized string into tokens, dropping stop-words. */
function tokenize(normalizedText) {
  if (!normalizedText) return [];
  return normalizedText.split(' ').filter((word) => word && !STOP_WORDS.has(word));
}

/**
 * Score a single intent against a normalized message.
 *
 * - Single-word keywords must appear as a whole token in the (stop-word
 *   filtered) token list. This avoids partial-word false positives, e.g.
 *   the keyword "hi" should not match inside "history".
 * - Multi-word keywords (after normalization, anything containing a
 *   space) are matched as a substring of the full normalized message,
 *   since tokenizing would lose the word order/adjacency the phrase
 *   depends on.
 */
function scoreIntent(intent, normalizedMessage, tokens) {
  const tokenSet = new Set(tokens);
  let score = 0;
  const matchedKeywords = [];

  for (const { word, weight } of intent.keywords) {
    const normalizedWord = normalize(word);
    if (!normalizedWord) continue;

    const isPhrase = normalizedWord.includes(' ');
    const isMatch = isPhrase
      ? normalizedMessage.includes(normalizedWord)
      : tokenSet.has(normalizedWord);

    if (isMatch) {
      score += weight;
      matchedKeywords.push(word);
    }
  }

  return { score, matchedKeywords };
}

/**
 * Classify a user message against the knowledge base.
 *
 * @param {string} message - raw user input
 * @param {object} knowledgeBase - parsed phoebe_knowledge_base.json
 * @returns {{ intent: string, response: string, score: number, matchedKeywords: string[] }}
 */
function classify(message, knowledgeBase) {
  const { _meta, intents } = knowledgeBase;
  const normalizedMessage = normalize(message);
  const tokens = tokenize(normalizedMessage);

  let best = null;

  for (const intent of intents) {
    const { score, matchedKeywords } = scoreIntent(intent, normalizedMessage, tokens);
    if (!best || score > best.score) {
      best = { intent: intent.intent, response: intent.response, score, matchedKeywords };
    }
  }

  if (!best || best.score < _meta.confidence_threshold) {
    return {
      intent: 'fallback',
      response: _meta.fallback_response,
      score: best ? best.score : 0,
      matchedKeywords: [],
    };
  }

  return best;
}

module.exports = { normalize, tokenize, scoreIntent, classify };
