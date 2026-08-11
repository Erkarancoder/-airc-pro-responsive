/* ─────────────────────────────────────────────
   js/answerEvaluation.js — A.I.R.C. Pro
   Multi-factor answer evaluator (0-100 composite score).

   IMPORTANT: This is a deterministic, rule-based heuristic
   evaluator — not a semantic AI grader. It approximates
   quality using keyword coverage against the question's
   hint/tags, structure, vocabulary richness, filler-word
   ratio and pacing. It's a genuine upgrade over pure
   keyword-matching but should be presented to the user as
   an automated estimate, not a definitive judgement.
───────────────────────────────────────────── */
'use strict';

const SLANG_WORDS = ['gonna','wanna','kinda','sorta','dude','yeah yeah','stuff like that','whatever'];
const PROFESSIONAL_PENALTY_RE = new RegExp(`\\b(${SLANG_WORDS.join('|')})\\b`, 'gi');

function wordList(text) {
  return (text || '').toLowerCase().match(/[a-z']+/g) || [];
}

/** Very light grammar heuristic: sentence casing, repeated words, punctuation presence. */
function grammarScore(text) {
  const clean = (text || '').trim();
  if (!clean) return 0;
  let score = 100;
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return 40;

  // No terminal punctuation at all -> penalize a bit (spoken text is lenient)
  if (!/[.!?]$/.test(clean)) score -= 5;

  // Repeated consecutive word (e.g. "the the") -> penalty per occurrence
  const repeats = (clean.match(/\b(\w+)\s+\1\b/gi) || []).length;
  score -= Math.min(30, repeats * 8);

  // Extremely long run-on sentence (no punctuation for 40+ words)
  const words = wordList(clean);
  const longestRun = clean.split(/[.!?,]/).reduce((max, seg) => Math.max(max, wordList(seg).length), 0);
  if (longestRun > 45) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function vocabularyScore(text) {
  const words = wordList(text);
  if (words.length < 5) return Math.round((words.length / 5) * 40);
  const unique = new Set(words);
  const ratio = unique.size / words.length; // type-token ratio
  const lengthBonus = Math.min(20, Math.round(words.filter(w => w.length >= 7).length / words.length * 60));
  return Math.max(0, Math.min(100, Math.round(ratio * 80) + lengthBonus));
}

function completenessScore(text, expectedMinWords = 25) {
  const n = wordList(text).length;
  if (n === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((n / expectedMinWords) * 100)));
}

function professionalismScore(text) {
  const matches = (text || '').match(PROFESSIONAL_PENALTY_RE);
  const penalty = matches ? matches.length * 15 : 0;
  return Math.max(0, 100 - penalty);
}

function technicalAccuracyScore(text, hint, tags) {
  const words = new Set(wordList(text));
  const keywordSource = [
    ...(hint ? hint.split(/[,;]/).map(s => s.trim()) : []),
    ...(tags || []),
  ].filter(Boolean);
  if (!keywordSource.length) return 60; // no ground truth to compare against — neutral score
  let hits = 0;
  keywordSource.forEach(kw => {
    const kwWords = wordList(kw);
    if (kwWords.some(w => words.has(w))) hits++;
  });
  return Math.round((hits / keywordSource.length) * 100);
}

function explanationQualityScore(text) {
  const n = wordList(text).length;
  const hasConnectors = /\b(because|therefore|so that|which means|for example|such as|first|then|finally)\b/i.test(text || '');
  let score = Math.min(70, Math.round((n / 40) * 70));
  if (hasConnectors) score += 20;
  return Math.max(0, Math.min(100, score));
}

function confidenceScoreFromText(text, fillerCount) {
  const n = wordList(text).length || 1;
  const fillerRatio = fillerCount / n;
  return Math.max(0, Math.min(100, Math.round(100 - fillerRatio * 300)));
}

function communicationScore(wpm) {
  if (!wpm) return 40;
  if (wpm < 80) return 50;
  if (wpm > 200) return 55;
  return Math.round(100 - Math.abs(wpm - 140) * 0.45);
}

/**
 * Evaluate a single answer across 8 factors.
 * @returns {{ breakdown: Object<string,number>, overall: number }}
 */
function evaluateAnswer({ text, hint, tags, fillerCount = 0, wpm = 0 }) {
  const breakdown = {
    technicalAccuracy:  technicalAccuracyScore(text, hint, tags),
    explanationQuality: explanationQualityScore(text),
    confidence:         confidenceScoreFromText(text, fillerCount),
    communication:      communicationScore(wpm),
    grammar:            grammarScore(text),
    vocabulary:         vocabularyScore(text),
    completeness:       completenessScore(text),
    professionalism:    professionalismScore(text),
  };
  const weights = {
    technicalAccuracy: 0.25, explanationQuality: 0.15, confidence: 0.10,
    communication: 0.10, grammar: 0.10, vocabulary: 0.10,
    completeness: 0.10, professionalism: 0.10,
  };
  let overall = 0;
  Object.keys(weights).forEach(k => { overall += breakdown[k] * weights[k]; });
  return { breakdown, overall: Math.round(overall) };
}

window.AIRC_ANSWER_EVAL = { evaluateAnswer };
