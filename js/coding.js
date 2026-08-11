/* ─────────────────────────────────────────────
   js/coding.js — A.I.R.C. Pro
   Coding round: problem bank + sandboxed execution.
   Code runs inside a Web Worker (isolated from the page,
   no DOM/network access) with a hard timeout, so untrusted
   candidate code can't hang or break the app.
───────────────────────────────────────────── */
'use strict';

const CODING_PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    prompt: 'Write a function `solve(nums, target)` that returns the indices of the two numbers that add up to target.',
    starter: 'function solve(nums, target) {\n  // your code here\n}\n',
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'Easy',
    prompt: 'Write a function `solve(str)` that returns the string reversed, without using String.prototype.split("").reverse().join("").',
    starter: 'function solve(str) {\n  // your code here\n}\n',
    tests: [
      { args: ['hello'], expected: 'olleh' },
      { args: ['A.I.R.C.'], expected: '.C.R.I.A' },
      { args: [''], expected: '' },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    prompt: 'Write a function `solve(n)` that returns an array of strings 1..n where multiples of 3 -> "Fizz", 5 -> "Buzz", both -> "FizzBuzz", else the number as a string.',
    starter: 'function solve(n) {\n  // your code here\n}\n',
    tests: [
      { args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      { args: [15], expected: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz'] },
    ],
  },
  {
    id: 'valid-parens',
    title: 'Valid Parentheses',
    difficulty: 'Medium',
    prompt: 'Write a function `solve(str)` that returns true if the brackets in the string ( ) [ ] { } are balanced and correctly nested.',
    starter: 'function solve(str) {\n  // your code here\n}\n',
    tests: [
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
      { args: ['{[]}'], expected: true },
    ],
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray Sum',
    difficulty: 'Medium',
    prompt: 'Write a function `solve(nums)` that returns the largest sum of a contiguous subarray (Kadane\'s algorithm).',
    starter: 'function solve(nums) {\n  // your code here\n}\n',
    tests: [
      { args: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5,4,-1,7,8]], expected: 23 },
    ],
  },
];

/** Deep-equal for simple JSON-serialisable values */
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/**
 * Run candidate code against a problem's test cases inside a
 * sandboxed Web Worker with a timeout. Returns a promise.
 */
function runCodeAgainstTests(code, problem, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const workerSrc = `
      self.onmessage = function(e) {
        const { code, tests } = e.data;
        const results = [];
        try {
          const fn = new Function(code + '\\nreturn solve;')();
          for (const t of tests) {
            try {
              const start = performance.now();
              const actual = fn(...t.args);
              const ms = performance.now() - start;
              results.push({ actual, ms, error: null });
            } catch (err) {
              results.push({ actual: null, ms: 0, error: String(err && err.message || err) });
            }
          }
          self.postMessage({ ok: true, results });
        } catch (err) {
          self.postMessage({ ok: false, error: String(err && err.message || err) });
        }
      };
    `;
    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({ ok: false, error: 'Execution timed out (possible infinite loop).', results: [] });
    }, timeoutMs);

    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: e.message || 'Worker error', results: [] });
    };
    worker.postMessage({ code, tests: problem.tests });
  });
}

/** Lightweight code-quality heuristic: length, comments, naming, nesting depth */
function codeQualityScore(code) {
  if (!code || !code.trim()) return 0;
  let score = 50;
  const lines = code.split('\n').filter(l => l.trim());
  if (/\/\/|\/\*/.test(code)) score += 10; // has comments
  if (/\bconst\b|\blet\b/.test(code)) score += 10; // modern declarations
  if (!/\bvar\b/.test(code)) score += 5;
  const maxIndent = Math.max(0, ...lines.map(l => (l.match(/^\s*/)[0].length)));
  if (maxIndent <= 8) score += 10; // not too deeply nested
  if (lines.length <= 40) score += 5; // concise
  const camelCaseVars = (code.match(/\b[a-z][a-zA-Z0-9]*\b/g) || []).length;
  if (camelCaseVars > 0) score += 10;
  return Math.max(0, Math.min(100, score));
}

/** Evaluate a submission: pass/fail per test + overall score */
async function evaluateSubmission(code, problem) {
  const run = await runCodeAgainstTests(code, problem);
  if (!run.ok) {
    return { passed: 0, total: problem.tests.length, allPassed: false, quality: codeQualityScore(code), error: run.error, testResults: [] };
  }
  const testResults = run.results.map((r, i) => ({
    expected: problem.tests[i].expected,
    actual: r.actual,
    pass: !r.error && deepEqual(r.actual, problem.tests[i].expected),
    error: r.error,
    ms: r.ms,
  }));
  const passed = testResults.filter(t => t.pass).length;
  return {
    passed, total: problem.tests.length, allPassed: passed === problem.tests.length,
    quality: codeQualityScore(code), error: null, testResults,
  };
}

window.AIRC_CODING = { CODING_PROBLEMS, evaluateSubmission, codeQualityScore };
