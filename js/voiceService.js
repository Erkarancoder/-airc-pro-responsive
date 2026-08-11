/* ─────────────────────────────────────────────
   js/voiceService.js — Practice module (isolated)

   Reusable Text-to-Speech wrapper around the browser
   SpeechSynthesis API. The rest of the Practice module
   never talks to speechSynthesis directly — it only calls
   speakAsNeha() / speakAsBreesh() / speakAsDeep() / speak().

   Handles:
     - async voice list loading (onvoiceschanged)
     - best-effort en-IN voice selection per gender
     - graceful fallback if no Indian voice is installed
     - graceful no-op if SpeechSynthesis isn't supported
───────────────────────────────────────────── */
'use strict';

(function () {
  const synth = window.speechSynthesis || null;
  let voicesCache = [];
  let voicesReady = false;
  let voicesPromise = null;

  function isSupported() {
    return !!synth;
  }

  function loadVoices() {
    if (voicesPromise) return voicesPromise;
    voicesPromise = new Promise((resolve) => {
      if (!isSupported()) { resolve([]); return; }
      const existing = synth.getVoices();
      if (existing && existing.length) {
        voicesCache = existing;
        voicesReady = true;
        resolve(existing);
        return;
      }
      // Voices load asynchronously in most browsers
      const handler = () => {
        voicesCache = synth.getVoices();
        voicesReady = true;
        synth.removeEventListener('voiceschanged', handler);
        resolve(voicesCache);
      };
      synth.addEventListener('voiceschanged', handler);
      // Fallback timeout in case voiceschanged never fires
      setTimeout(() => {
        if (!voicesReady) {
          voicesCache = synth.getVoices() || [];
          voicesReady = true;
          resolve(voicesCache);
        }
      }, 1200);
    });
    return voicesPromise;
  }

  const FEMALE_HINTS = ['female', 'heera', 'raveena', 'zira', 'samantha', 'susan', 'karen', 'neha', 'lekha', 'veena', 'priya'];
  const MALE_HINTS   = ['male', 'ravi', 'hemant', 'david', 'mark', 'daniel', 'rishi', 'prabhat'];

  function scoreVoice(v, gender) {
    let score = 0;
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    if (lang === 'en-in') score += 50;
    else if (lang.startsWith('en-in')) score += 40;
    else if (lang.startsWith('en')) score += 10;
    const hints = gender === 'female' ? FEMALE_HINTS : MALE_HINTS;
    if (hints.some((h) => name.includes(h))) score += 30;
    if (v.localService) score += 2; // slight preference for locally installed (usually higher quality)
    return score;
  }

  /** Pick the best available voice for a requested gender, or null */
  async function pickVoice(gender) {
    const voices = await loadVoices();
    if (!voices.length) return null;
    let best = null;
    let bestScore = -1;
    voices.forEach((v) => {
      const s = scoreVoice(v, gender);
      if (s > bestScore) { bestScore = s; best = v; }
    });
    return best;
  }

  let currentRate = 0.8; // default per spec — easier for Indian students to follow

  function setRate(rate) {
    const r = Number(rate);
    if (!isNaN(r) && r > 0) currentRate = r;
  }
  function getRate() { return currentRate; }

  let speaking = false;
  function isSpeaking() { return speaking; }

  /**
   * Core speak function. Never throws — resolves even on failure so
   * calling code can safely `await` it without try/catch everywhere.
   * opts: { gender: 'female'|'male', rate, pitch, onStart, onEnd }
   */
  function speak(text, opts) {
    opts = opts || {};
    return new Promise(async (resolve) => {
      if (!text) { resolve(false); return; }
      if (!isSupported()) {
        // Graceful fallback — app must not break without SpeechSynthesis
        console.warn('[voiceService] SpeechSynthesis not supported — skipping voice.');
        resolve(false);
        return;
      }
      try {
        synth.cancel(); // don't stack utterances
        const utter = new SpeechSynthesisUtterance(text);
        const voice = await pickVoice(opts.gender || 'female');
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang;
        } else {
          utter.lang = 'en-IN';
        }
        utter.rate = opts.rate || currentRate;
        utter.pitch = opts.pitch != null ? opts.pitch : 1;
        utter.onstart = () => { speaking = true; opts.onStart && opts.onStart(); };
        const finish = () => { speaking = false; opts.onEnd && opts.onEnd(); resolve(true); };
        utter.onend = finish;
        utter.onerror = finish;
        synth.speak(utter);
      } catch (e) {
        console.warn('[voiceService] speak() failed:', e);
        speaking = false;
        resolve(false);
      }
    });
  }

  function stop() {
    if (isSupported()) {
      try { synth.cancel(); } catch (e) { /* no-op */ }
    }
    speaking = false;
  }

  const AIRC_VOICE_SERVICE = {
    isSupported,
    loadVoices,
    setRate,
    getRate,
    isSpeaking,
    stop,
    speak,
    speakAsNeha:   (text, opts) => speak(text, Object.assign({ gender: 'female' }, opts)),
    speakAsBreesh: (text, opts) => speak(text, Object.assign({ gender: 'male' }, opts)),
    speakAsDeep:   (text, opts) => speak(text, Object.assign({ gender: 'male' }, opts)),
  };

  window.AIRC_VOICE_SERVICE = AIRC_VOICE_SERVICE;
})();
