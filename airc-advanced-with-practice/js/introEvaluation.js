/* ─────────────────────────────────────────────
   js/introEvaluation.js — A.I.R.C. Pro
   Evaluates the candidate's self-introduction against
   9 checkpoints. Rule-based (keyword + heuristic), since
   this app has no LLM backend to call.
───────────────────────────────────────────── */
'use strict';

const INTRO_CHECKS = [
  { key: 'greeting',   label: 'Greeting',              re: /\b(hi|hello|good\s(morning|afternoon|evening)|greetings|thank you for (having|this))\b/i },
  { key: 'name',       label: 'Name',                  re: /\b(my name is|i am|i'm|this is)\s+[A-Z][a-z]+/i },
  { key: 'education',  label: 'Education',             re: /\b(degree|university|college|graduate|b\.?tech|m\.?tech|bachelor|master|studied|major(ed)? in)\b/i },
  { key: 'skills',     label: 'Skills',                re: /\b(skilled in|proficient|experience with|expertise in|good at|know(n)? for)\b|\b(javascript|python|java|react|node|sql|aws|docker|c\+\+)\b/i },
  { key: 'experience', label: 'Experience',             re: /\b(\d+\+?\s*(years|yrs|year)|worked at|working at|internship|experience of)\b/i },
  { key: 'projects',   label: 'Projects',               re: /\b(project|built|developed|created|designed|worked on)\b/i },
  { key: 'goals',      label: 'Career Goals',           re: /\b(goal|aspire|looking to|hoping to|aim to|career objective|excited to|passionate about)\b/i },
  { key: 'confidence', label: 'Confidence',             fn: (text, fillerRatio) => fillerRatio < 0.06 && text.split(/\s+/).length >= 25 },
  { key: 'style',      label: 'Professional Speaking',  fn: (text) => !/\b(gonna|wanna|kinda|sorta|dude|yeah yeah)\b/i.test(text) && /[.!?]/.test(text) },
];

/**
 * Evaluate an introduction transcript.
 * @param {string} text - full introduction transcript
 * @param {number} fillerCount
 * @returns {{ results: Array<{key,label,passed}>, passedCount, total, score, isGood: boolean }}
 */
function evaluateIntroduction(text, fillerCount = 0) {
  const clean = (text || '').trim();
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const fillerRatio = wordCount ? fillerCount / wordCount : 1;

  const results = INTRO_CHECKS.map(check => {
    let passed = false;
    if (check.fn) passed = !!check.fn(clean, fillerRatio);
    else if (check.re) passed = check.re.test(clean);
    return { key: check.key, label: check.label, passed };
  });

  const passedCount = results.filter(r => r.passed).length;
  const score = Math.round((passedCount / results.length) * 100);
  // "Good" introduction: at least 6/9 checkpoints, including name + at least one of skills/experience/projects
  const hasName = results.find(r => r.key === 'name')?.passed;
  const hasSubstance = ['skills','experience','projects'].some(k => results.find(r => r.key === k)?.passed);
  const isGood = passedCount >= 6 && hasName && hasSubstance && wordCount >= 20;

  return { results, passedCount, total: results.length, score, isGood, wordCount };
}

window.AIRC_INTRO_EVAL = { evaluateIntroduction, INTRO_CHECKS };
