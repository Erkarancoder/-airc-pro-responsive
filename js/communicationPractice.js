/* ─────────────────────────────────────────────
   js/communicationPractice.js — Practice module (isolated)

   Communication Skills session controller, guided by
   "Neha Ma'am" (female Indian-English TTS voice).

   Flow (per teacher-style spec):
     1. Neha speaks a long technology/professional passage.
     2. One complete sentence is picked from THAT SAME passage.
     3. Student speaks the sentence; real SpeechRecognition
        transcript is compared word-by-word against it.
     4. Wrong -> tell the student exactly which word was
        incorrect and ask them to repeat.
        Correct -> short praise, then a NEW passage begins.

   Only this file (+ the additive COMMUNICATION_PASSAGES data
   in practiceContent.js) implements this behavior. GD and
   Interview Practice controllers are untouched.
───────────────────────────────────────────── */
'use strict';

(function () {
  const { addMessage, typingIndicator, createMicButton, escapeHtml } = window.AIRC_PRACTICE_COMMON;
  const VOICE = window.AIRC_VOICE_SERVICE;
  const COMPARE = window.AIRC_SPEECH_COMPARISON;
  const CONTENT = window.AIRC_PRACTICE_CONTENT;

  // Neha's voice should sound like a clear, unhurried Indian-English
  // teacher — slightly slower than the app default, with natural pauses
  // between sentences. Scoped to this module only.
  const NEHA_RATE = 0.8;          // within the requested 0.75–0.85x range
  const NEHA_SENTENCE_PAUSE_MS = 420; // natural breathing gap between sentences
  const NEHA_PITCH = 1.02;        // marginal lift so it reads less flat/robotic

  let session = null; // { passageOrder[], passageCursor, passage, sentences, targetSentence, attempts }
  let recognizer = null;
  let cancelled = false;

  function els() {
    return {
      chat: document.getElementById('commChatList'),
      mic: document.getElementById('commMicBtn'),
      status: document.getElementById('commMicStatus'),
      levelBadge: document.getElementById('commLevelBadge'),
      progress: document.getElementById('commProgress'),
    };
  }

  function shuffledIndices(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function stripHtmlForSpeech(text) {
    return text.replace(/<[^>]+>/g, '');
  }

  /** Show one mentor bubble (no typing delay) — used for the passage text. */
  function addMentorBubble(chat, text) {
    addMessage(chat, 'mentor', "Neha Ma'am", text.replace(/\n/g, '<br>'));
  }

  /** Speak a full passage sentence-by-sentence with natural pauses. */
  async function speakPassage(passage, chat) {
    const sentences = CONTENT.splitIntoSentences(passage);
    for (let i = 0; i < sentences.length; i++) {
      if (cancelled) return;
      await VOICE.speakAsNeha(sentences[i], { rate: NEHA_RATE, pitch: NEHA_PITCH });
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, NEHA_SENTENCE_PAUSE_MS));
    }
  }

  /** Pick a substantive sentence (not too short) from the passage just spoken. */
  function pickSentenceFromPassage(passage) {
    const sentences = CONTENT.splitIntoSentences(passage).filter((s) => s.split(/\s+/).length >= 4);
    const pool = sentences.length ? sentences : CONTENT.splitIntoSentences(passage);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function nextPassage() {
    if (session.passageCursor >= session.passageOrder.length) {
      session.passageOrder = shuffledIndices(CONTENT.COMMUNICATION_PASSAGES.length);
      session.passageCursor = 0;
      // avoid immediately repeating the passage the student just finished
      if (session.lastPassageIdx != null && session.passageOrder[0] === session.lastPassageIdx && session.passageOrder.length > 1) {
        [session.passageOrder[0], session.passageOrder[1]] = [session.passageOrder[1], session.passageOrder[0]];
      }
    }
    const idx = session.passageOrder[session.passageCursor++];
    session.lastPassageIdx = idx;
    return CONTENT.COMMUNICATION_PASSAGES[idx];
  }

  function updateProgress() {
    const { progress, levelBadge } = els();
    if (levelBadge) levelBadge.textContent = 'Technology Topic';
    if (progress) progress.textContent = `Passage ${session.passageCursor} · ${session.correctCount} correct`;
  }

  async function presentPassage() {
    const { chat } = els();
    const passage = nextPassage();
    session.passage = passage;
    session.attempts = 0;

    const removeTyping = typingIndicator(chat, "Neha Ma'am");
    await new Promise((r) => setTimeout(r, 400));
    if (cancelled) { removeTyping(); return; }
    removeTyping();
    addMentorBubble(chat, passage);
    updateProgress();

    await speakPassage(passage, chat);
    if (cancelled) return;

    const sentence = pickSentenceFromPassage(passage);
    session.targetSentence = sentence;

    const removeTyping2 = typingIndicator(chat, "Neha Ma'am");
    await new Promise((r) => setTimeout(r, 300));
    if (cancelled) { removeTyping2(); return; }
    removeTyping2();
    addMentorBubble(chat, `Please say this sentence:<br><strong>"${escapeHtml(sentence)}"</strong>`);
    await VOICE.speakAsNeha('Please say this sentence.', { rate: NEHA_RATE, pitch: NEHA_PITCH });
    if (cancelled) return;
    await new Promise((r) => setTimeout(r, 250));
    if (cancelled) return;
    await VOICE.speakAsNeha(sentence, { rate: NEHA_RATE, pitch: NEHA_PITCH });
  }

  /** "Almost correct. You said X. Please say Y." — one clear correction per mismatch. */
  function buildWordCorrection(result, expectedSentence) {
    if (result.uncertain) {
      return `I couldn't clearly hear that — different accents can sound different to the browser.<br>
        Please say the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
    }
    if (result.wrong && result.wrong.length) {
      const w = result.wrong[0];
      return `Almost correct. You said <strong>"${escapeHtml(w.spoken)}"</strong>. Please say <strong>"${escapeHtml(w.expected)}"</strong>.<br><br>Try the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
    }
    if (result.missing && result.missing.length) {
      return `Almost correct. You missed the word <strong>"${escapeHtml(result.missing[0])}"</strong>.<br><br>Try the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
    }
    if (result.extra && result.extra.length) {
      return `Almost correct. You added an extra word: <strong>"${escapeHtml(result.extra[0])}"</strong>.<br><br>Try the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
    }
    return `Almost correct. 👍<br>Try the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
  }

  function handleTranscript(transcript, confidence) {
    const { chat } = els();
    addMessage(chat, 'student', 'You', escapeHtml(transcript));

    const expected = session.targetSentence;
    const result = COMPARE.compareSentence(expected, transcript, confidence);
    session.attempts++;

    if (result.correct) {
      session.correctCount++;
      addMentorBubble(chat, 'Perfect! ✅ Let\'s continue.');
      VOICE.speakAsNeha("Perfect! Let's continue.", { rate: NEHA_RATE, pitch: NEHA_PITCH }).then(() => {
        if (cancelled) return;
        presentPassage();
      });
    } else {
      const html = buildWordCorrection(result, expected);
      addMentorBubble(chat, html);
      VOICE.speakAsNeha(stripHtmlForSpeech(html), { rate: NEHA_RATE, pitch: NEHA_PITCH });
    }
    session.micCtrl && session.micCtrl.setState('idle');
  }

  function startListening() {
    const { chat } = els();
    recognizer = window.AIRC_SPEECH_RECOGNITION.create({
      onResult(transcript, isFinal, confidence) {
        if (isFinal) {
          session.micCtrl.setState('processing');
          handleTranscript(transcript, confidence);
        }
      },
      onError(message) {
        addMessage(chat, 'system', '', escapeHtml(message));
        session.micCtrl.setState('idle');
      },
      onEnd() {
        if (session.micCtrl.getState() === 'listening') session.micCtrl.setState('idle');
      },
    });
    recognizer.start();
  }

  function stopListening() {
    if (recognizer) recognizer.stop();
  }

  function init() {
    const { chat, mic, status } = els();
    if (!chat || !mic) return;
    cancelled = false;
    chat.innerHTML = '';
    session = {
      passageOrder: shuffledIndices(CONTENT.COMMUNICATION_PASSAGES.length),
      passageCursor: 0,
      lastPassageIdx: null,
      correctCount: 0,
    };
    session.micCtrl = createMicButton(mic, status, {
      onStart: startListening,
      onStop: stopListening,
    });

    if (!window.AIRC_SPEECH_RECOGNITION.isSupported()) {
      addMessage(chat, 'system', '', 'Speech recognition is not supported in this browser. You can still listen to the passages, but the microphone will not work here. Try Google Chrome on desktop or Android for the full experience.');
    }

    addMentorBubble(chat, "Hello! I'm Neha, your communication coach. I'll explain a short technology topic, then ask you to repeat one sentence from it. Let's begin!");
    VOICE.speakAsNeha("Hello! I'm Neha, your communication coach. Let's begin.", { rate: NEHA_RATE, pitch: NEHA_PITCH }).then(() => {
      if (!cancelled) presentPassage();
    });
  }

  function teardown() {
    cancelled = true;
    if (recognizer) recognizer.stop();
    VOICE.stop();
    session = null;
  }

  window.AIRC_COMMUNICATION_PRACTICE = { init, teardown };
})();
