/* ─────────────────────────────────────────────
   js/voiceAnalysis.js — A.I.R.C. Pro
   Tracks timing of speech recognition results to derive:
   speaking speed, pause count/duration, fluency, energy
   (via word density) and a nervousness estimate.
───────────────────────────────────────────── */
'use strict';

function createVoiceAnalyzer() {
  let lastResultAt = null;
  let pauses = [];          // durations in ms of gaps > threshold
  let wordTimestamps = [];  // ms timestamps of each finalized chunk
  const PAUSE_THRESHOLD_MS = 2500;

  return {
    /** Call every time a finalized speech chunk arrives */
    onChunk(text) {
      const now = Date.now();
      if (lastResultAt !== null) {
        const gap = now - lastResultAt;
        if (gap > PAUSE_THRESHOLD_MS) pauses.push(gap);
      }
      lastResultAt = now;
      const words = (text || '').trim().split(/\s+/).filter(Boolean);
      wordTimestamps.push({ t: now, count: words.length });
    },

    reset() {
      lastResultAt = null;
      pauses = [];
      wordTimestamps = [];
    },

    /** Compute a metrics snapshot */
    getMetrics(totalWords, elapsedSeconds, fillerCount) {
      const wpm = elapsedSeconds > 0 ? Math.round((totalWords / elapsedSeconds) * 60) : 0;
      const pauseCount = pauses.length;
      const avgPauseMs = pauseCount ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauseCount) : 0;
      const fillerRatio = totalWords ? fillerCount / totalWords : 0;

      // Fluency: penalise pauses + fillers
      const fluency = Math.max(0, Math.min(100, Math.round(100 - pauseCount * 6 - fillerRatio * 200)));
      // Energy: proxy via word density (words per active speaking burst)
      const energy = wordTimestamps.length
        ? Math.max(0, Math.min(100, Math.round((totalWords / wordTimestamps.length) * 12)))
        : 0;
      // Confidence: inverse of filler ratio & pause frequency, boosted by steady WPM in ideal range
      const wpmFit = wpm === 0 ? 0 : 100 - Math.min(100, Math.abs(wpm - 140));
      const confidence = Math.max(0, Math.min(100, Math.round(wpmFit * 0.5 + fluency * 0.5)));
      // Nervousness: inverse-ish composite (higher = more nervous)
      const nervousness = Math.max(0, Math.min(100, Math.round(100 - confidence * 0.6 - fluency * 0.4)));

      return { wpm, pauseCount, avgPauseMs, fluency, energy, confidence, nervousness };
    },
  };
}

window.AIRC_VOICE_ANALYZER = createVoiceAnalyzer;
