/* ─────────────────────────────────────────────
   js/gdPractice.js — Practice module (isolated)

   Group Discussion session controller, guided by
   "Breesh Sir" (male Indian-English TTS voice).
   Walks the student through Opening -> Reason -> Example
   -> Counterpoint -> Conclusion, then a final report.
───────────────────────────────────────────── */
'use strict';

(function () {
  const { addMessage, typingIndicator, createMicButton, escapeHtml, metricRow } = window.AIRC_PRACTICE_COMMON;
  const VOICE = window.AIRC_VOICE_SERVICE;
  const COMPARE = window.AIRC_SPEECH_COMPARISON;
  const CONTENT = window.AIRC_PRACTICE_CONTENT;

  let session = null;
  let recognizer = null;

  function els() {
    return {
      chat: document.getElementById('gdChatList'),
      mic: document.getElementById('gdMicBtn'),
      status: document.getElementById('gdMicStatus'),
      topic: document.getElementById('gdTopicBadge'),
      stage: document.getElementById('gdStageBadge'),
      report: document.getElementById('gdReportPanel'),
    };
  }

  function stripHtmlForSpeech(text) { return text.replace(/<[^>]+>/g, ''); }

  async function speakMentor(text, chat) {
    const remove = typingIndicator(chat, 'Breesh Sir');
    await new Promise((r) => setTimeout(r, 350));
    remove();
    addMessage(chat, 'mentor', 'Breesh Sir', text.replace(/\n/g, '<br>'));
    VOICE.speakAsBreesh(stripHtmlForSpeech(text));
  }

  /** Turn a rough transcript into one gently improved sentence (rule-based). */
  function suggestBetterSentence(transcript) {
    let s = transcript.trim();
    if (!s) return s;
    s = s.charAt(0).toUpperCase() + s.slice(1);
    // Very light rule-based smoothing — not a real grammar engine, but
    // enough to model "here's a stronger way to phrase that".
    s = s.replace(/\bgives many knowledge\b/gi, 'provides access to a wide range of knowledge');
    s = s.replace(/\bis good because\b/gi, 'is useful because');
    s = s.replace(/\bi think that\b/gi, 'I believe');
    s = s.replace(/\ba lot of\b/gi, 'a significant amount of');
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
  }

  function analyzeAndRespond(transcript) {
    const analysis = COMPARE.analyzeSpeech(transcript);
    session.metrics.wordCount += analysis.wordCount;
    session.metrics.fillerCount += analysis.fillerCount;
    session.metrics.repeats += analysis.repeats;
    session.metrics.vocabSamples.push(analysis.vocabRichness);
    session.metrics.turns++;

    const notes = [];
    if (analysis.fillerCount > 0) notes.push(`Try to reduce filler words like "um" or "actually" — I noticed ${analysis.fillerCount}.`);
    if (analysis.repeats > 0) notes.push('You repeated a word — take a breath instead of repeating.');
    if (analysis.wordCount < 6) notes.push('Try to elaborate a little more on your point.');

    let feedback = notes.length ? `Good point. 👍<br>${notes.join('<br>')}` : 'Good point. 👍';
    if (notes.length) {
      const better = suggestBetterSentence(transcript);
      feedback += `<br><br>A stronger way to phrase it:<br><strong>"${escapeHtml(better)}"</strong>`;
    }
    return feedback;
  }

  function currentStage() { return CONTENT.GD_STAGES[session.stageIndex]; }

  async function presentStage() {
    const { chat, stage } = els();
    if (session.stageIndex >= CONTENT.GD_STAGES.length) {
      finishSession();
      return;
    }
    const s = currentStage();
    if (stage) stage.textContent = s.key[0].toUpperCase() + s.key.slice(1);
    await speakMentor(s.prompt, chat);
  }

  function handleTranscript(transcript) {
    const { chat } = els();
    addMessage(chat, 'student', 'You', escapeHtml(transcript));
    const feedback = analyzeAndRespond(transcript);
    speakMentor(feedback, chat).then(() => {
      session.stageIndex++;
      presentStage();
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
    const turns = Math.max(1, m.turns);
    const avgVocab = m.vocabSamples.length ? m.vocabSamples.reduce((a, b) => a + b, 0) / m.vocabSamples.length : 0;

    const clarity = Math.max(35, Math.min(96, 90 - m.fillerCount * 4 - m.repeats * 3));
    const vocabulary = Math.max(30, Math.min(95, Math.round(avgVocab * 100)));
    const grammar = Math.max(40, Math.min(95, 88 - m.repeats * 5));
    const relevance = Math.max(50, Math.min(97, 92 - Math.max(0, 3 - turns) * 5));
    const overall = Math.round((clarity + vocabulary + grammar + relevance) / 4);

    speakMentor("That completes our discussion. Here is your performance report.", chat).then(() => {
      if (report) {
        report.hidden = false;
        report.innerHTML = `
          <h3>GD Practice Report</h3>
          ${metricRow('Speaking Clarity', clarity)}
          ${metricRow('Vocabulary', vocabulary)}
          ${metricRow('Grammar', grammar)}
          ${metricRow('Topic Relevance', relevance)}
          <div class="pz-metric-row"><span class="pz-metric-label">Filler Words</span><span class="pz-metric-value">${m.fillerCount}</span></div>
          <div class="pz-report-split">
            <div>
              <div class="pz-report-heading">What you did well</div>
              <ul><li>Completed all discussion stages</li><li>Stayed on topic throughout</li></ul>
            </div>
            <div>
              <div class="pz-report-heading">Improve next time</div>
              <ul>
                <li>${m.fillerCount > 2 ? 'Reduce filler words' : 'Keep filler words this low'}</li>
                <li>Use stronger, more specific vocabulary</li>
                <li>Speak at a steady, confident pace</li>
              </ul>
            </div>
          </div>
          <div class="pz-metric-row pz-overall"><span class="pz-metric-label">Overall Performance</span><span class="pz-metric-value">${overall}%</span></div>
        `;
        report.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function init() {
    const { chat, mic, status, topic, report } = els();
    if (!chat || !mic) return;
    chat.innerHTML = '';
    if (report) { report.hidden = true; report.innerHTML = ''; }

    const gdTopic = CONTENT.GD_TOPICS[Math.floor(Math.random() * CONTENT.GD_TOPICS.length)];
    if (topic) topic.textContent = gdTopic;

    session = {
      topic: gdTopic,
      stageIndex: 0,
      metrics: { wordCount: 0, fillerCount: 0, repeats: 0, vocabSamples: [], turns: 0 },
    };
    session.micCtrl = createMicButton(mic, status, { onStart: startListening, onStop: stopListening });

    if (!window.AIRC_SPEECH_RECOGNITION.isSupported()) {
      addMessage(chat, 'system', '', 'Speech recognition is not supported in this browser. Try Google Chrome on desktop or Android for the full experience.');
    }

    addMessage(chat, 'mentor', 'Breesh Sir', `Welcome! Today's topic is:<br><strong>"${escapeHtml(gdTopic)}"</strong><br>You will have about a minute for each point. Let's begin.`);
    VOICE.speakAsBreesh(`Welcome. Today's topic is: ${gdTopic}. Let's begin.`);
    setTimeout(presentStage, 900);
  }

  function teardown() {
    if (recognizer) recognizer.stop();
    VOICE.stop();
    session = null;
  }

  window.AIRC_GD_PRACTICE = { init, teardown };
})();
