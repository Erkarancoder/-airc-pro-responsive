/* ─────────────────────────────────────────────
   js/followUpEngine.js — A.I.R.C. Pro
   Dynamic follow-up question generator.

   This is a client-side, rule-based engine (no external
   LLM call — this app has no backend/API key). It scans
   the candidate's answer for topic keywords and pulls
   matching follow-up questions from FOLLOWUP_BANK so the
   interview feels adaptive, e.g.:
     "I know React" -> "What is the Virtual DOM?",
                        "Explain reconciliation.",
                        "Difference between useState and useReducer?"
───────────────────────────────────────────── */
'use strict';

const FOLLOWUP_BANK = {
  react:      ["What is the Virtual DOM and why does it help performance?", "Explain reconciliation in React.", "What's the difference between useState and useReducer?"],
  javascript: ["Can you explain closures with a quick example?", "What's the difference between var, let, and const?", "How does the event loop work in JavaScript?"],
  node:       ["How does Node.js handle asynchronous I/O under the hood?", "What is the event loop in Node.js?", "How would you handle unhandled promise rejections?"],
  express:    ["How does middleware work in Express?", "How would you handle centralised error handling in Express?"],
  mongodb:    ["When would you embed documents vs reference them in MongoDB?", "How do indexes work in MongoDB?"],
  sql:        ["What's the difference between an INNER JOIN and a LEFT JOIN?", "How would you optimise a slow query on a large table?"],
  python:     ["What is the GIL in Python and how does it affect concurrency?", "Explain list comprehensions with an example.", "What's the difference between a list and a tuple?"],
  java:       ["What's the difference between an interface and an abstract class?", "How does garbage collection work in the JVM?"],
  docker:     ["What's the difference between an image and a container?", "How would you reduce the size of a Docker image?"],
  kubernetes: ["What is a Pod in Kubernetes?", "How does Kubernetes handle self-healing?"],
  aws:        ["What's the difference between EC2 and Lambda?", "How would you design for high availability across AWS regions?"],
  api:        ["How do you version a public API without breaking existing clients?", "How would you handle rate limiting for an API?"],
  git:        ["What's the difference between merge and rebase?", "How would you resolve a merge conflict?"],
  testing:    ["What's the difference between unit and integration tests?", "How do you decide what to mock in a test?"],
  algorithm:  ["What's the time complexity of your approach, and can it be improved?", "How would this approach scale with 10x more data?"],
  database:   ["How would you index this table for faster reads?", "How would you handle this at scale with millions of rows?"],
  leadership: ["How did you measure the success of that decision?", "What would you do differently in hindsight?"],
  project:    ["What was the most challenging technical decision on that project?", "What would you improve if you rebuilt it today?"],
};

const TOPIC_PATTERNS = [
  { key: 'react',      re: /\breact(\.js)?\b/i },
  { key: 'node',       re: /\bnode(\.js)?\b/i },
  { key: 'express',    re: /\bexpress(\.js)?\b/i },
  { key: 'mongodb',    re: /\b(mongodb|mongoose)\b/i },
  { key: 'sql',        re: /\b(sql|mysql|postgres|postgresql)\b/i },
  { key: 'python',     re: /\bpython\b/i },
  { key: 'java',       re: /\bjava\b(?!script)/i },
  { key: 'javascript', re: /\b(javascript|js|typescript)\b/i },
  { key: 'docker',     re: /\bdocker\b/i },
  { key: 'kubernetes', re: /\b(kubernetes|k8s)\b/i },
  { key: 'aws',        re: /\b(aws|amazon web services|azure|gcp|cloud)\b/i },
  { key: 'api',        re: /\bapi(s)?\b/i },
  { key: 'git',        re: /\bgit(hub)?\b/i },
  { key: 'testing',    re: /\b(test|testing|unit test|jest|mocha)\b/i },
  { key: 'algorithm',  re: /\b(algorithm|complexity|big[- ]?o)\b/i },
  { key: 'database',   re: /\b(database|db|table|query)\b/i },
  { key: 'leadership', re: /\b(led|managed|mentored|leadership)\b/i },
  { key: 'project',    re: /\b(project|built|developed|shipped)\b/i },
];

/**
 * Given the raw answer text, return up to `max` dynamically
 * generated follow-up questions, avoiding topics already asked.
 */
function generateFollowUps(answerText, alreadyAsked = new Set(), max = 2) {
  if (!answerText || !answerText.trim()) return [];
  const matchedTopics = [];
  for (const { key, re } of TOPIC_PATTERNS) {
    if (re.test(answerText) && !matchedTopics.includes(key)) matchedTopics.push(key);
  }
  const followUps = [];
  for (const topic of matchedTopics) {
    const bank = FOLLOWUP_BANK[topic];
    if (!bank) continue;
    for (const fq of bank) {
      if (followUps.length >= max) break;
      if (alreadyAsked.has(fq)) continue;
      followUps.push(fq);
    }
    if (followUps.length >= max) break;
  }
  return followUps;
}

window.AIRC_FOLLOWUP = { generateFollowUps, FOLLOWUP_BANK, TOPIC_PATTERNS };
