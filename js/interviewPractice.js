/* ─────────────────────────────────────────────
   js/interviewPractice.js — Practice module (isolated)

   Interview Practice session controller, guided by
   "Deep Sir" (male Indian-English TTS voice). Category
   selection, question flow, per-answer feedback, final report.
───────────────────────────────────────────── */
'use strict';

(function () {
  const { addMessage, typingIndicator, createMicButton, escapeHtml, metricRow } = window.AIRC_PRACTICE_COMMON;
  const VOICE = window.AIRC_VOICE_SERVICE;
  const COMPARE = window.AIRC_SPEECH_COMPARISON;
  const CONTENT = window.AIRC_PRACTICE_CONTENT;

  let session = null;
  let recognizer = null;
  const TOTAL_QUESTIONS = 5;

  function els() {
    return {
      chat: document.getElementById('intChatList'),
      mic: document.getElementById('intMicBtn'),
      status: document.getElementById('intMicStatus'),
      catBadge: document.getElementById('intCategoryBadge'),
      progress: document.getElementById('intProgress'),
      report: document.getElementById('intReportPanel'),
      categoryPicker: document.getElementById('intCategoryPicker'),
      session: document.getElementById('intSessionArea'),
    };
  }

  function stripHtmlForSpeech(text) { return text.replace(/<[^>]+>/g, ''); }

  async function speakMentor(text, chat) {
    const remove = typingIndicator(chat, 'Deep Sir');
    await new Promise((r) => setTimeout(r, 350));
    remove();
    addMessage(chat, 'mentor', 'Deep Sir', text.replace(/\n/g, '<br>'));
    VOICE.speakAsDeep(stripHtmlForSpeech(text));
  }

  function pickQuestions(category, count) {
    const pool = (CONTENT.INTERVIEW_QUESTIONS[category] || []).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(count, pool.length));
  }

  function evaluateAnswer(transcript) {
    const analysis = COMPARE.analyzeSpeech(transcript);
    session.metrics.answers++;
    session.metrics.wordCount += analysis.wordCount;
    session.metrics.fillerCount += analysis.fillerCount;
    session.metrics.vocabSamples.push(analysis.vocabRichness);

    const notes = [];
    let tone = 'Good answer.';
    if (analysis.wordCount < 8) {
      tone = 'That was quite short.';
      notes.push('Try to add one more supporting detail or example.');
    } else if (analysis.wordCount > 90) {
      notes.push('Your answer was slightly long — try to answer in a more structured, concise way.');
    }
    if (analysis.fillerCount > 1) notes.push('Watch your filler words to sound more confident.');
    if (!notes.length) notes.push('Clear and well-structured. Keep this up.');

    return `${tone}${notes.length ? '<br>Improve:<br>' + notes.join('<br>') : ''}`;
  }

  async function askNext() {
    const { chat, progress } = els();
    if (session.qIndex >= session.questions.length) {
      finishSession();
      return;
    }
    if (progress) progress.textContent = `Question ${session.qIndex + 1} of ${session.questions.length}`;
    const q = session.questions[session.qIndex];
    const lead = session.qIndex === 0
      ? `Hello ${escapeHtml(session.studentName)}.<br>Let's begin your interview.<br><br>${escapeHtml(q)}`
      : `Thank you.<br><br>${escapeHtml(q)}`;
    await speakMentor(lead, chat);
  }

  function handleTranscript(transcript) {
    const { chat } = els();
    addMessage(chat, 'student', 'You', escapeHtml(transcript));
    const feedback = evaluateAnswer(transcript);
    speakMentor(feedback, chat).then(() => {
      session.qIndex++;
      askNext();
    });
    session.micCtrl.setState('idle');
  }

  function startListening() {
    const { chat } = els();
    recognizer = window.AIRC_SPEECH_RECOGNITION.create({
      onResult(transcript, isFinal) {
        if (isFinal) {
          session.micCtrl.setState('processing');
          handleTranscript(transcript);
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

  function stopListening() { if (recognizer) recognizer.stop(); }

  function finishSession() {
    const { chat, report } = els();
    const m = session.metrics;
    const avgVocab = m.vocabSamples.length ? m.vocabSamples.reduce((a, b) => a + b, 0) / m.vocabSamples.length : 0;
    const communication = Math.max(35, Math.min(96, 90 - m.fillerCount * 4));
    const structure = Math.max(35, Math.min(95, 85 - Math.max(0, TOTAL_QUESTIONS - m.answers) * 8));
    const vocabulary = Math.max(30, Math.min(95, Math.round(avgVocab * 100)));
    const overall = Math.round((communication + structure + vocabulary) / 3);

    speakMentor('That concludes your interview. Here is your performance report.', chat).then(() => {
      if (report) {
        report.hidden = false;
        report.innerHTML = `
          <h3>Interview Practice Report</h3>
          ${metricRow('Communication', communication)}
          ${metricRow('Answer Structure', structure)}
          ${metricRow('Vocabulary', vocabulary)}
          <div class="pz-metric-row"><span class="pz-metric-label">Filler Words</span><span class="pz-metric-value">${m.fillerCount}</span></div>
          <div class="pz-metric-row pz-overall"><span class="pz-metric-label">Overall Performance</span><span class="pz-metric-value">${overall}%</span></div>
        `;
        report.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function startCategory(category) {
    const { chat, catBadge, categoryPicker, session: sessionArea, report } = els();
    if (categoryPicker) categoryPicker.hidden = true;
    if (sessionArea) sessionArea.hidden = false;
    if (report) { report.hidden = true; report.innerHTML = ''; }
    chat.innerHTML = '';

    let studentName = 'there';
    try {
      const username = window.AIRC_AUTH && AIRC_AUTH.currentUser ? AIRC_AUTH.currentUser() : null;
      if (username) studentName = username.includes('@') ? username.split('@')[0] : username;
    } catch (e) { /* non-fatal */ }

    session = {
      category,
      studentName,
      questions: pickQuestions(category, TOTAL_QUESTIONS),
      qIndex: 0,
      metrics: { answers: 0, wordCount: 0, fillerCount: 0, vocabSamples: [] },
    };
    session.micCtrl = createMicButton(els().mic, els().status, { onStart: startListening, onStop: stopListening });
    if (catBadge) catBadge.textContent = CONTENT.INTERVIEW_CATEGORY_LABELS[category] || category;

    if (!window.AIRC_SPEECH_RECOGNITION.isSupported()) {
      addMessage(chat, 'system', '', 'Speech recognition is not supported in this browser. Try Google Chrome on desktop or Android for the full experience.');
    }
    askNext();
  }

  function initCategoryButtons() {
    const { categoryPicker } = els();
    if (!categoryPicker) return;
    categoryPicker.querySelectorAll('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => startCategory(btn.dataset.category));
    });
  }

  function init() {
    const { categoryPicker, session: sessionArea, report } = els();
    if (categoryPicker) categoryPicker.hidden = false;
    if (sessionArea) sessionArea.hidden = true;
    if (report) { report.hidden = true; report.innerHTML = ''; }
    initCategoryButtons();
  }

  function teardown() {
    if (recognizer) recognizer.stop();
    VOICE.stop();
    session = null;
  }

  window.AIRC_INTERVIEW_PRACTICE = { init, teardown };
})();
