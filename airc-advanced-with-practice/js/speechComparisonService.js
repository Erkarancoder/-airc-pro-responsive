/* ─────────────────────────────────────────────
   js/speechComparisonService.js — Practice module (isolated)

   Pure functions — no DOM, no browser API access — so they're
   easy to reason about and reuse across Communication, GD and
   Interview practice.

   Compares an expected sentence against a spoken transcript and
   returns a structured diff: missing / extra / wrong words,
   using normalization (case, punctuation, common contractions)
   so we don't falsely flag trivial differences.
───────────────────────────────────────────── */
'use strict';

(function () {
  const CONTRACTION_MAP = {
    "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are",
    "it's": "it is", "that's": "that is", "there's": "there is", "what's": "what is",
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "can't": "cannot", "couldn't": "could not", "won't": "will not",
    "wouldn't": "would not", "shouldn't": "should not", "isn't": "is not",
    "aren't": "are not", "wasn't": "was not", "weren't": "were not",
    "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
    "i've": "i have", "you've": "you have", "we've": "we have",
    "i'll": "i will", "you'll": "you will", "we'll": "we will",
    "i'd": "i would", "you'd": "you would",
  };

  function normalize(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();
    // normalize curly quotes to straight
    t = t.replace(/[’‘]/g, "'");
    // strip punctuation except apostrophes inside words
    t = t.replace(/[^\w\s']/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  function tokenize(text) {
    const norm = normalize(text);
    if (!norm) return [];
    const words = norm.split(' ').filter(Boolean);
    // expand contractions to a canonical multi-word form for comparison
    const expanded = [];
    words.forEach((w) => {
      const mapped = CONTRACTION_MAP[w];
      if (mapped) expanded.push(...mapped.split(' '));
      else expanded.push(w);
    });
    return expanded;
  }

  /**
   * Word-level LCS-based diff between expected and spoken token arrays.
   * Returns aligned ops: 'match' | 'wrong' | 'missing' | 'extra'
   */
  function diffTokens(expected, spoken) {
    const n = expected.length, m = spoken.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (expected[i - 1] === spoken[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    const ops = [];
    let i = n, j = m;
    while (i > 0 && j > 0) {
      if (expected[i - 1] === spoken[j - 1]) {
        ops.unshift({ type: 'match', expected: expected[i - 1], spoken: spoken[j - 1] });
        i--; j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        ops.unshift({ type: 'missing', expected: expected[i - 1] });
        i--;
      } else {
        ops.unshift({ type: 'extra', spoken: spoken[j - 1] });
        j--;
      }
    }
    while (i > 0) { ops.unshift({ type: 'missing', expected: expected[i - 1] }); i--; }
    while (j > 0) { ops.unshift({ type: 'extra', spoken: spoken[j - 1] }); j--; }

    // Collapse adjacent missing+extra pairs into "wrong" (substitution)
    const collapsed = [];
    for (let k = 0; k < ops.length; k++) {
      const cur = ops[k];
      const next = ops[k + 1];
      if (cur.type === 'missing' && next && next.type === 'extra') {
        collapsed.push({ type: 'wrong', expected: cur.expected, spoken: next.spoken });
        k++;
      } else if (cur.type === 'extra' && next && next.type === 'missing') {
        collapsed.push({ type: 'wrong', expected: next.expected, spoken: cur.spoken });
        k++;
      } else {
        collapsed.push(cur);
      }
    }
    return collapsed;
  }

  /**
   * Compare a spoken transcript to an expected sentence.
   * @param {string} expectedSentence
   * @param {string} spokenTranscript
   * @param {number} [confidence] - 0..1 recognition confidence, if available
   */
  function compareSentence(expectedSentence, spokenTranscript, confidence) {
    const expected = tokenize(expectedSentence);
    const spoken = tokenize(spokenTranscript);

    if (!spoken.length) {
      return {
        correct: false,
        uncertain: true,
        reason: 'no-speech',
        message: "I couldn't clearly hear that. Please try again.",
        ops: [],
      };
    }

    const ops = diffTokens(expected, spoken);
    const problems = ops.filter((o) => o.type !== 'match');
    const correct = problems.length === 0;

    // If recognition confidence is very low and there ARE mismatches,
    // treat it as "uncertain" rather than definitively "wrong" — per
    // spec #27, don't falsely shame the student for an accent-related
    // misrecognition.
    const uncertain = !correct && typeof confidence === 'number' && confidence > 0 && confidence < 0.35;

    return {
      correct,
      uncertain,
      ops,
      missing: problems.filter((o) => o.type === 'missing').map((o) => o.expected),
      extra: problems.filter((o) => o.type === 'extra').map((o) => o.spoken),
      wrong: problems.filter((o) => o.type === 'wrong'),
    };
  }

  /** Lightweight heuristic quality checks used by GD / Interview feedback. */
  const FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of', 'so yeah', 'i mean'];

  function analyzeSpeech(transcript) {
    const norm = normalize(transcript);
    const words = norm.split(' ').filter(Boolean);
    const wordCount = words.length;

    let fillerCount = 0;
    FILLER_WORDS.forEach((f) => {
      const re = new RegExp('\\b' + f.replace(/\s+/g, '\\s+') + '\\b', 'g');
      const matches = norm.match(re);
      if (matches) fillerCount += matches.length;
    });

    // repeated-word detection (same word said twice in a row)
    let repeats = 0;
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) repeats++;
    }

    // very rough vocabulary richness: unique words / total words
    const unique = new Set(words);
    const vocabRichness = wordCount ? unique.size / wordCount : 0;

    return { wordCount, fillerCount, repeats, vocabRichness };
  }

  window.AIRC_SPEECH_COMPARISON = { normalize, tokenize, diffTokens, compareSentence, analyzeSpeech, FILLER_WORDS };
})();
