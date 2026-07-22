/**
 * Simple assert-based test suite for nlp.js — no test framework dependency.
 * Run with: node test/nlp.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { classify, normalize, tokenize } = require('../nlp.js');

const kb = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'phoebe_knowledge_base.json'), 'utf8')
);

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${description}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL: ${description}`);
    console.log(`        ${err.message}`);
  }
}

console.log('normalize/tokenize unit tests');
test('normalize lowercases and strips punctuation', () => {
  assert.strictEqual(normalize("What's the DEADLINE?!"), 'what s the deadline');
});
test('normalize collapses whitespace', () => {
  assert.strictEqual(normalize('  hello    world  '), 'hello world');
});
test('normalize reduces "75%" to "75"', () => {
  assert.strictEqual(normalize('75%'), '75');
});
test('tokenize drops stop-words', () => {
  assert.deepStrictEqual(tokenize(normalize('what is the deadline')), ['deadline']);
});

console.log('\nintent routing tests (from the build brief)');
test('"when does registration close" -> registration_deadline', () => {
  const result = classify('when does registration close', kb);
  assert.strictEqual(result.intent, 'registration_deadline');
});
test('"how do I get a hostel" -> hostel', () => {
  const result = classify('how do I get a hostel', kb);
  assert.strictEqual(result.intent, 'hostel');
});

console.log('\nadditional routing tests');
test('"hello there" -> greeting', () => {
  assert.strictEqual(classify('hello there', kb).intent, 'greeting');
});
test('"good morning phoebe" -> greeting', () => {
  assert.strictEqual(classify('good morning phoebe', kb).intent, 'greeting');
});
test('"what is the exam timetable" -> exam_timetable', () => {
  assert.strictEqual(classify('what is the exam timetable', kb).intent, 'exam_timetable');
});
test('"what are the exam rules for attendance" -> exam_rules', () => {
  assert.strictEqual(classify('what are the exam rules for attendance', kb).intent, 'exam_rules');
});
test('"what documents do I need for clearance" -> clearance', () => {
  assert.strictEqual(classify('what documents do I need for clearance', kb).intent, 'clearance');
});
test('"how much are the school fees" -> fees', () => {
  assert.strictEqual(classify('how much are the school fees', kb).intent, 'fees');
});
test('"when will results be released" -> results', () => {
  assert.strictEqual(classify('when will results be released', kb).intent, 'results');
});
test('"what colleges and departments are there" -> colleges_departments', () => {
  assert.strictEqual(classify('what colleges and departments are there', kb).intent, 'colleges_departments');
});
test('"tell me about the computer science department" -> computer_science_dept', () => {
  assert.strictEqual(classify('tell me about the computer science department', kb).intent, 'computer_science_dept');
});
test('"how can I contact the school" -> contact', () => {
  assert.strictEqual(classify('how can I contact the school', kb).intent, 'contact');
});
test('"I cannot login to the student portal" -> portal_help', () => {
  assert.strictEqual(classify('I cannot login to the student portal', kb).intent, 'portal_help');
});
test('"when does siwes start" -> siwes', () => {
  assert.strictEqual(classify('when does siwes start', kb).intent, 'siwes');
});
test('"how do I transfer department" -> transfer', () => {
  assert.strictEqual(classify('how do I transfer department', kb).intent, 'transfer');
});
test('"thanks a lot" -> thanks', () => {
  assert.strictEqual(classify('thanks a lot', kb).intent, 'thanks');
});

console.log('\nfallback / edge-case tests');
test('gibberish falls back below confidence threshold', () => {
  const result = classify('purple elephants dance quietly', kb);
  assert.strictEqual(result.intent, 'fallback');
  assert.strictEqual(result.response, kb._meta.fallback_response);
});
test('empty message falls back', () => {
  const result = classify('', kb);
  assert.strictEqual(result.intent, 'fallback');
});
test('single weak keyword below threshold falls back', () => {
  // "break" alone has weight 1, threshold is 2 -> should not match academic_calendar
  const result = classify('break', kb);
  assert.strictEqual(result.intent, 'fallback');
});
test('"hi" alone does not match inside unrelated words (no false substring match)', () => {
  // "history" contains "hi" as a substring but must NOT trigger the single-word
  // keyword "hi" since single-word keywords require a whole-token match.
  const result = classify('tell me the history of fupre', kb);
  assert.notStrictEqual(result.intent, 'greeting');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
