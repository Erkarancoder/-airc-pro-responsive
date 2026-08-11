/* ─────────────────────────────────────────────
   index.js — A.I.R.C. Pro (Advanced Version 2)
   Full round-based interview flow wiring together:
   questionBank.js, companyBank.js, followUpEngine.js,
   introEvaluation.js, answerEvaluation.js, voiceAnalysis.js,
   faceAnalysis.js, resume.js, coding.js, dashboard.js,
   reportPdf.js, db.js
───────────────────────────────────────────── */
'use strict';

// ════════════════════════════════════════════
// DATA SOURCES (provided by js/*.js modules)
// ════════════════════════════════════════════
const QBANK     = window.QUESTION_BANK_ALL || window.QUESTION_BANK || {};
const CBANK     = window.COMPANY_BANK || {};
const CATLABELS = window.CATEGORY_LABELS || {};

// ════════════════════════════════════════════
// DOM REFS
// ════════════════════════════════════════════
const video          = document.getElementById('video');
const overlay        = document.getElementById('overlay');
const overlayCtx     = overlay?.getContext?.('2d');
const noCam          = document.getElementById('noCam');
const waveformEl     = document.getElementById('waveform');
const timerBadge     = document.getElementById('timerBadge');

const welcomeCard      = document.getElementById('welcomeCard');
const dismissWelcomeBtn= document.getElementById('dismissWelcomeBtn');
const roundStepper     = document.getElementById('roundStepper');

const startBtn        = document.getElementById('startBtn');
const nextBtn         = document.getElementById('nextBtn');
const stopBtn          = document.getElementById('stopBtn');
const reportBtn         = document.getElementById('reportBtn');
const reportPdfBtn      = document.getElementById('reportPdfBtn');

const categorySelect  = document.getElementById('categorySelect');
const companySelect   = document.getElementById('companySelect');
const diffSelect      = document.getElementById('difficultySelect');
const modeSelect      = document.getElementById('modeSelect');
const resumeInput     = document.getElementById('resumeInput');
const resumeStatus    = document.getElementById('resumeStatus');

const sessionStatus   = document.getElementById('sessionStatus');
const permChip        = document.getElementById('permChip');
const permBanner      = document.getElementById('permBanner');
const bannerTitle     = document.getElementById('bannerTitle');
const bannerMessage   = document.getElementById('bannerMessage');
const retryPermBtn    = document.getElementById('retryPermBtn');
const useManualBtn    = document.getElementById('useManualBtn');

const introBanner     = document.getElementById('introBanner');

const questionCard    = document.getElementById('questionCard');
const qBadge          = document.getElementById('qBadge');
const qProgressBar    = document.getElementById('qProgressBar');
const qTimerEl        = document.getElementById('qTimer');
const questionText    = document.getElementById('questionText');
const hintChip        = document.getElementById('hintChip');
const currentAnswer   = document.getElementById('currentAnswer');
const manualControls  = document.getElementById('manualControls');
const manualInput     = document.getElementById('manualInput');
const manualSubmitBtn = document.getElementById('manualSubmitBtn');
const manualNextBtn   = document.getElementById('manualNextBtn');
const answerFeedback  = document.getElementById('answerFeedback');
const prevQBtn        = document.getElementById('prevQBtn');
const skipQBtn         = document.getElementById('skipQBtn');

const codingCard      = document.getElementById('codingCard');
const codeBadge       = document.getElementById('codeBadge');
const codeProgressBar = document.getElementById('codeProgressBar');
const codeTimerEl     = document.getElementById('codeTimer');
const codeTitle       = document.getElementById('codeTitle');
const codePrompt      = document.getElementById('codePrompt');
const codeEditor      = document.getElementById('codeEditor');
const runCodeBtn        = document.getElementById('runCodeBtn');
const nextCodeBtn       = document.getElementById('nextCodeBtn');
const codeResults       = document.getElementById('codeResults');

const feedbackCard    = document.getElementById('feedbackCard');
const feedbackGrid    = document.getElementById('feedbackGrid');
const strengthsList   = document.getElementById('strengthsList');
const weaknessesList  = document.getElementById('weaknessesList');
const suggestionsList = document.getElementById('suggestionsList');

const eyeContactEl   = document.getElementById('eyeContact');
const eyeBar         = document.getElementById('eyeBar');
const fillersEl      = document.getElementById('fillers');
const fillersList    = document.getElementById('fillersList');
const wpmEl          = document.getElementById('wpm');
const scoreRingFill  = document.getElementById('scoreRingFill');
const scoreLabel     = document.getElementById('scoreLabel');
const liveTranscript = document.getElementById('liveTranscript');
const notesEl        = document.getElementById('notes');

const historyList    = document.getElementById('historyList');
const clearHistoryBtn= document.getElementById('clearHistoryBtn');

const sessionModal   = document.getElementById('sessionModal');
const modalClose     = document.getElementById('modalClose');
const modalContent   = document.getElementById('modalContent');

const statTotal      = document.getElementById('statTotal');
const statAvgScore   = document.getElementById('statAvgScore');
const statAvgWPM     = document.getElementById('statAvgWPM');
const statAvgFillers = document.getElementById('statAvgFillers');
const trendChart     = document.getElementById('trendChart');
const wpmChart       = document.getElementById('wpmChart');

const dashTotal = document.getElementById('dashTotal');
const dashAvgScore = document.getElementById('dashAvgScore');
const dashStreak = document.getElementById('dashStreak');
const dashXP = document.getElementById('dashXP');
const badgeGrid = document.getElementById('badgeGrid');
const strongTopicsEl = document.getElementById('strongTopics');
const weakTopicsEl = document.getElementById('weakTopics');
const dashWeekCount = document.getElementById('dashWeekCount');
const dashWeekAvg = document.getElementById('dashWeekAvg');
const dashMonthCount = document.getElementById('dashMonthCount');
const dashMonthAvg = document.getElementById('dashMonthAvg');

const FILLER_WORDS   = ['um','uh','like','you know','i mean','basically','so','actually','literally','right','sort of','kind of'];
const FILLER_RE      = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let rounds            = [];
let roundIndex         = 0;
let questions          = [];
let qIndex             = 0;
let totalWords         = 0;
let fillerCount        = 0;
let fillerMap          = {};
let fillerCountAtQStart = 0;
let transcriptSoFar    = '';
let answers            = [];
let answerEvaluations  = [];
let followUpsAskedSet  = new Set();
let sessionStart       = null;

let faceTracker        = null;
let voiceAnalyzer      = null;
let stream             = null;
let recognition        = null;
let isRunning          = false;
let isManual           = false;
let appFaceApiReady       = false;
let faceInterval       = null;

let qCountdownSec      = 120;
let qCountdownTimer    = null;
let sessionSeconds     = 0;
let sessionClock       = null;

let resumeQuestionSet  = null;
let companyMode        = false;
let companyKey         = '';

let codingProblems      = [];
let codeIndex            = 0;
let codeResultsBySlot    = [];
let codeTimerTimer       = null;
let codeCountdownSec     = 300;

// ── AI VOICE INTERVIEWER (Text-to-Speech + silence detection) ──
let isAISpeaking         = false;
let silenceWatchTimer    = null;
let lastSpeechTimestamp  = 0;
const AI_SILENCE_MS      = 3200;   // pause length that signals the user is done answering
const AI_MIN_ANSWER_WORDS= 3;      // don't auto-advance on an essentially empty answer
const AI_GREETING_TEXT   = "Hello! Welcome to AIRC. I will be your AI interviewer today. Let's begin with a simple introduction. Please introduce yourself.";

// ════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    if (panel) panel.classList.add('active');
    if (btn.dataset.tab === 'history')   renderHistory();
    if (btn.dataset.tab === 'analytics') renderAnalytics();
    if (btn.dataset.tab === 'dashboard') renderDashboard();
  });
});

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ════════════════════════════════════════════
// SETUP: populate company select + welcome dismiss
// ════════════════════════════════════════════
function populateCompanySelect() {
  Object.entries(CBANK).forEach(([key, c]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = c.label;
    companySelect.appendChild(opt);
  });
}
populateCompanySelect();

companySelect.addEventListener('change', () => {
  const on = !!companySelect.value;
  categorySelect.disabled = on;
  categorySelect.parentElement.style.opacity = on ? '.4' : '1';
});

dismissWelcomeBtn.addEventListener('click', () => { welcomeCard.style.display = 'none'; });

// ════════════════════════════════════════════
// RESUME UPLOAD
// ════════════════════════════════════════════
resumeInput.addEventListener('change', async () => {
  const file = resumeInput.files[0];
  if (!file || !window.AIRC_RESUME) return;
  resumeStatus.style.display = 'inline-block';
  resumeStatus.className = 'hint-chip';
  resumeStatus.textContent = 'Reading resume…';
  try {
    const text = await window.AIRC_RESUME.extractTextFromFile(file);
    resumeQuestionSet = window.AIRC_RESUME.buildResumeQuestionSet(text);
    resumeStatus.className = 'hint-chip ok';
    resumeStatus.textContent = `✓ ${resumeQuestionSet.skills.length} skills detected — ${resumeQuestionSet.questions.length} tailored questions ready`;
    toast('Resume parsed — tailored questions added to Technical round', 'ok');
  } catch (e) {
    resumeStatus.className = 'hint-chip';
    resumeStatus.textContent = 'Could not read resume — continuing without it.';
  }
});

// ════════════════════════════════════════════
// FACE-API (via faceAnalysis.js)
// ════════════════════════════════════════════
async function loadModels() {
  if (!window.AIRC_FACE) return;
  const res = await window.AIRC_FACE.loadFaceModels();
  appFaceApiReady = res.faceApiReady;
}
window.addEventListener('load', loadModels);

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
function isSecureCtx() {
  const h = location.hostname;
  return location.protocol === 'https:' || h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function setRunning(v) {
  startBtn.disabled = v;
  nextBtn.disabled  = !v;
  stopBtn.disabled  = !v;
  sessionStatus.textContent = v ? '● RUNNING' : '● IDLE';
  sessionStatus.className   = 'status-pill' + (v ? ' running' : '');
  timerBadge.style.display = v ? 'block' : 'none';
}

function resetMetrics() {
  totalWords = 0; fillerCount = 0; fillerMap = {}; fillerCountAtQStart = 0;
  transcriptSoFar = ''; answers = []; answerEvaluations = [];
  followUpsAskedSet = new Set();
  qIndex = 0; roundIndex = 0; sessionSeconds = 0;
  codeResultsBySlot = []; codeIndex = 0;
  eyeContactEl.textContent = '—'; eyeBar.style.width = '0%';
  fillersEl.textContent    = '—'; fillersList.textContent = '';
  wpmEl.textContent        = '—';
  liveTranscript.textContent = 'No transcript yet…';
  currentAnswer.textContent  = 'Start speaking or type below…';
  notesEl.textContent        = 'Ready to begin.';
  timerBadge.textContent     = '00:00';
  introBanner.style.display  = 'none';
  answerFeedback.style.display = 'none';
  feedbackCard.style.display = 'none';
  questionCard.style.display = 'none';
  codingCard.style.display   = 'none';
  reportBtn.disabled = true; reportPdfBtn.disabled = true;
  updateScore(0);
}

// ════════════════════════════════════════════
// ROUND STEPPER UI
// ════════════════════════════════════════════
function renderStepper() {
  roundStepper.style.display = 'flex';
  document.querySelectorAll('.round-step').forEach(el => {
    const r = el.dataset.round;
    const idx = rounds.indexOf(r);
    el.style.display = rounds.includes(r) ? 'flex' : 'none';
    el.classList.remove('active','done');
    if (idx < roundIndex) el.classList.add('done');
    else if (idx === roundIndex) el.classList.add('active');
  });
}

// ════════════════════════════════════════════
// QUESTION SET BUILDERS
// ════════════════════════════════════════════
function shuffled(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildIntroQuestions() {
  return [{ q: "Let's begin — please introduce yourself: your background, education, skills, and what you're looking for.", hint: 'greeting, name, education, skills, experience, projects, career goals', tags: ['intro'] }];
}

function buildHrQuestions(diff) {
  const bank = QBANK.hr?.[diff] || QBANK.general?.[diff] || [];
  return shuffled(bank).slice(0, 4);
}

function buildTechnicalQuestions(cat, diff) {
  const bank = QBANK[cat]?.[diff] || QBANK.general?.[diff] || [];
  let qs = shuffled(bank).slice(0, 5);
  if (resumeQuestionSet && resumeQuestionSet.questions.length) {
    qs = [...resumeQuestionSet.questions.slice(0, 3), ...qs].slice(0, 7);
  }
  return qs;
}

function buildCompanyQuestions(key, diff) {
  const bank = CBANK[key]?.[diff] || [];
  return shuffled(bank).slice(0, 6);
}

function buildCodingProblems(diff) {
  const all = (window.AIRC_CODING && window.AIRC_CODING.CODING_PROBLEMS) || [];
  const easy = all.filter(p => p.difficulty === 'Easy');
  const med  = all.filter(p => p.difficulty === 'Medium');
  if (diff === 'senior') { const m = shuffled(med).slice(0,2); return m.length === 2 ? m : [...m, ...shuffled(easy)].slice(0,2); }
  if (diff === 'mid')    return [shuffled(easy)[0], shuffled(med)[0]].filter(Boolean);
  return shuffled(easy).slice(0, 2);
}

function questionsForRound(round) {
  const diff = diffSelect.value;
  if (round === 'intro')      return buildIntroQuestions();
  if (round === 'hr')         return buildHrQuestions(diff);
  if (round === 'technical')  return buildTechnicalQuestions(categorySelect.value, diff);
  if (round === 'company')    return buildCompanyQuestions(companyKey, diff);
  return [];
}

// ════════════════════════════════════════════
// ROUND FLOW
// ════════════════════════════════════════════
function startRound(idx) {
  roundIndex = idx;
  renderStepper();
  const round = rounds[roundIndex];

  if (round === 'coding') { startCodingRound(); return; }
  if (round === 'feedback') { showFeedback(); return; }

  questions = questionsForRound(round);
  answers = new Array(questions.length).fill('');
  qIndex = 0;
  questionCard.style.display = 'block';
  codingCard.style.display = 'none';
  introBanner.style.display = 'none';
  answerFeedback.style.display = 'none';
  showQuestion();
  toast(`${roundLabel(round)} round started`, 'ok');
}

function roundLabel(round) {
  if (round === 'intro') return 'Introduction';
  if (round === 'hr') return 'HR';
  if (round === 'technical') return 'Technical';
  if (round === 'company') return (CBANK[companyKey]?.label || 'Company') + ' Interview';
  if (round === 'coding') return 'Coding';
  return round;
}

function showQuestion() {
  const q = questions[qIndex];
  if (!q) return;
  fillerCountAtQStart = fillerCount;
  answerFeedback.style.display = 'none';
  const round = rounds[roundIndex];
  qBadge.textContent = (q.isFollowUp ? '↳ Follow-up · ' : '') + `${roundLabel(round)} — Q ${qIndex + 1} / ${questions.length}`;
  qProgressBar.style.width   = `${(qIndex / questions.length) * 100}%`;
  questionText.textContent   = q.q;
  currentAnswer.textContent  = answers[qIndex] || 'Start speaking or type below…';
  if (q.hint) {
    hintChip.textContent     = '💡 Covers: ' + q.hint;
    hintChip.style.display   = 'block';
  } else {
    hintChip.style.display   = 'none';
  }
  startQTimer();
  if (prevQBtn) prevQBtn.disabled = qIndex === 0;

  // AI voice interviewer: speak the question aloud, then automatically listen for the answer.
  if (!isManual) {
    const textToSpeak = (round === 'intro' && qIndex === 0) ? AI_GREETING_TEXT : q.q;
    speakQuestion(textToSpeak);
  }
}

// ════════════════════════════════════════════
// PER-QUESTION COUNTDOWN
// ════════════════════════════════════════════
function startQTimer() {
  clearInterval(qCountdownTimer);
  qCountdownSec = 120;
  updateQTimerDisplay();
  qCountdownTimer = setInterval(() => {
    qCountdownSec--;
    updateQTimerDisplay();
    if (qCountdownSec <= 0) {
      clearInterval(qCountdownTimer);
      toast('⏰ Time up for this question!', 'err');
      qTimerEl.classList.remove('urgent');
    }
    if (qCountdownSec <= 20) qTimerEl.classList.add('urgent');
    else                     qTimerEl.classList.remove('urgent');
  }, 1000);
}
function updateQTimerDisplay() {
  const m = Math.floor(qCountdownSec / 60);
  const s = qCountdownSec % 60;
  qTimerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
}

// ════════════════════════════════════════════
// SESSION CLOCK
// ════════════════════════════════════════════
function startSessionClock() {
  clearInterval(sessionClock);
  sessionClock = setInterval(() => {
    sessionSeconds++;
    const m = Math.floor(sessionSeconds / 60);
    const s = sessionSeconds % 60;
    timerBadge.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }, 1000);
}

// ════════════════════════════════════════════
// SCORE CALCULATION (overall live confidence ring)
// ════════════════════════════════════════════
function calcScore() {
  const avgEye   = faceTracker ? faceTracker.getSummary().avgEye : 0;
  const wpmVal   = parseInt(wpmEl.textContent) || 0;
  const wpmScore = wpmVal === 0 ? 0 : wpmVal < 80 ? 40 : wpmVal > 200 ? 50 : 100 - Math.abs(wpmVal - 140) * 0.4;
  const fillerPen = Math.min(fillerCount * 3, 40);
  const answerAvg = answerEvaluations.length
    ? answerEvaluations.reduce((a,e)=>a+e.overall,0) / answerEvaluations.length : 60;
  const rawScore = (avgEye * 0.2) + (wpmScore * 0.25) + ((100 - fillerPen) * 0.15) + (answerAvg * 0.4);
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

function updateScore(val) {
  const circumference = 2 * Math.PI * 34;
  const offset        = circumference - (val / 100) * circumference;
  scoreRingFill.style.strokeDashoffset = offset;
  scoreLabel.textContent = val;
  const color = val >= 75 ? '#00ddb4' : val >= 50 ? '#ffa502' : '#ff4757';
  scoreRingFill.style.stroke = color;
  scoreLabel.style.color     = color;
}

// ════════════════════════════════════════════
// MEDIA & FACE TRACKING
// ════════════════════════════════════════════
async function startFaceLoop() {
  if (!overlayCtx || !video.videoWidth) return;
  overlay.width  = video.videoWidth;
  overlay.height = video.videoHeight;
  if (!appFaceApiReady || !window.faceapi || !window.AIRC_FACE) return;
  faceTracker = window.AIRC_FACE.createFaceTracker();

  faceInterval = setInterval(async () => {
    if (video.paused || video.ended) return;
    try {
      let det = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      overlayCtx.clearRect(0,0,overlay.width,overlay.height);
      const sample = faceTracker.sample(det || null, overlay.width, overlay.height);
      if (sample) {
        const box = sample.box;
        overlayCtx.strokeStyle = '#00ddb4';
        overlayCtx.lineWidth   = 2;
        overlayCtx.strokeRect(box.x, box.y, box.width, box.height);
        eyeContactEl.textContent = sample.eyePct + '%';
        eyeBar.style.width       = sample.eyePct + '%';
        updateScore(calcScore());
      } else {
        eyeContactEl.textContent = 'No face';
      }
    } catch(e) {
      clearInterval(faceInterval); faceInterval = null;
    }
  }, 900);
}

async function tryStartMedia() {
  hideBanner();
  noCam.style.display = 'none';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640 }, audio: true });
    permChip.textContent  = '⬤ Camera & Mic OK';
    permChip.className    = 'perm-chip ok';
    video.srcObject       = stream;
    video.muted            = true;
    await new Promise(r => { video.onloadedmetadata = () => r(); });
    video.play();
    startFaceLoop();
    recognition = setupSpeech();
    if (recognition) {
      sessionStart = Date.now();
      // If the AI greeting is still speaking, let its onend handler (resumeListening) start recognition instead.
      if (!isAISpeaking) { recognition.start(); startSilenceWatch(); }
    }
    waveformEl.classList.add('active');
    notesEl.textContent = 'Recording… Speak now.';
  } catch(err) {
    handleMediaError(err);
  }
}

function handleMediaError(err) {
  noCam.style.display = 'flex';
  waveformEl.classList.remove('active');
  permChip.textContent = '⬤ No device';
  permChip.className   = 'perm-chip err';
  const n = err?.name || '';
  let title = 'Media error', msg = err?.message || n;
  if (/NotAllowed|PermissionDenied/.test(n)) { title='Permission denied'; msg='Allow camera & mic in browser settings, then retry.'; }
  else if (/NotFound|DevicesNotFound/.test(n)) { title='Device not found'; msg='No camera/microphone detected.'; }
  showBanner(title, msg);
  manualControls.style.display = 'block';
  toast('Camera/Mic unavailable — manual mode enabled', 'err');
}

// ════════════════════════════════════════════
// SPEECH RECOGNITION
// ════════════════════════════════════════════
function setupSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { notesEl.textContent='Speech recognition not supported (use Chrome).'; return null; }
  const r      = new SR();
  r.continuous = true; r.interimResults = true; r.lang = 'en-IN';

  r.onresult = (e) => {
    let interim='', final='';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) final += res[0].transcript + ' ';
      else              interim += res[0].transcript + ' ';
    }
    lastSpeechTimestamp = Date.now(); // any detected speech resets the AI's silence watch
    const combined = (answers[qIndex]||'') + ' ' + interim;
    currentAnswer.textContent = combined.trim() || '—';
    liveTranscript.textContent = (transcriptSoFar + ' ' + interim).trim();

    if (final) {
      transcriptSoFar += ' ' + final;
      answers[qIndex]  = ((answers[qIndex]||'') + ' ' + final.trim()).trim();
      currentAnswer.textContent  = answers[qIndex];
      liveTranscript.textContent = transcriptSoFar.trim();
      liveTranscript.scrollTop   = liveTranscript.scrollHeight;
      if (voiceAnalyzer) voiceAnalyzer.onChunk(final);
      analyzeChunk(final);
    }
  };
  r.onerror = (e) => { notesEl.textContent = 'Speech error: ' + (e.error||e.message); };
  r.onend   = () => { if (isRunning && !isManual && !isAISpeaking) { try { r.start(); } catch(e){} } };
  return r;
}

// ════════════════════════════════════════════
// AI VOICE INTERVIEWER — Text-to-Speech (SpeechSynthesis API)
// ════════════════════════════════════════════
let ttsVoicesCache = null;
function pickInterviewerVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;
  ttsVoicesCache = voices;
  const preferredNames = [
    'Google US English', 'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)', 'Samantha',
    'Google UK English Female', 'Microsoft Zira'
  ];
  for (const name of preferredNames) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return voices.find(v => /en[-_](US|GB|IN)/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0];
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => { ttsVoicesCache = window.speechSynthesis.getVoices(); };
}

/**
 * Speaks the given text aloud, pausing speech-recognition while the AI talks
 * so it doesn't transcribe its own voice, then resumes listening afterwards.
 */
function speakQuestion(text, onDone) {
  isAISpeaking = true;
  if (!isManual && recognition) { try { recognition.stop(); } catch(e){} }
  clearSilenceWatch();

  if (!('speechSynthesis' in window)) { isAISpeaking = false; if (onDone) onDone(); return; }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate  = 0.98;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  utter.lang  = 'en-US';
  const voice = pickInterviewerVoice();
  if (voice) utter.voice = voice;

  const finish = () => {
    isAISpeaking = false;
    resumeListening();
    if (onDone) onDone();
  };
  utter.onend   = finish;
  utter.onerror = finish;
  window.speechSynthesis.speak(utter);
}

/** Restarts speech recognition (if in voice mode) and the silence watch after the AI finishes speaking. */
function resumeListening() {
  if (!isRunning || isManual || isAISpeaking) return;
  if (recognition) { try { recognition.start(); } catch(e){} }
  startSilenceWatch();
}

/** Watches for a pause in the user's speech long enough to mean "I'm done answering". */
function startSilenceWatch() {
  clearInterval(silenceWatchTimer);
  lastSpeechTimestamp = Date.now();
  silenceWatchTimer = setInterval(() => {
    if (!isRunning || isManual || isAISpeaking) return;
    const round = rounds[roundIndex];
    if (round === 'coding' || round === 'feedback') return;
    const wordCount = (answers[qIndex] || '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount >= AI_MIN_ANSWER_WORDS && Date.now() - lastSpeechTimestamp >= AI_SILENCE_MS) {
      clearSilenceWatch();
      autoAdvanceAfterSilence();
    }
  }, 400);
}
function clearSilenceWatch() { clearInterval(silenceWatchTimer); silenceWatchTimer = null; }

/** Called automatically once the user has finished speaking their answer — advances the interview by voice. */
function autoAdvanceAfterSilence() {
  if (!isRunning || isManual) return;
  const round = rounds[roundIndex];
  if (round === 'coding' || round === 'feedback') return;
  finalizeCurrentAnswer();
  if (round === 'intro') {
    // Mirrors the manual Next-button behaviour: the intro round only advances
    // once the introduction checklist passes (handled inside showIntroBanner).
    // If it hasn't passed yet, keep listening in case the user adds more.
    startSilenceWatch();
    return;
  }
  advance();
}

// ════════════════════════════════════════════
// TRANSCRIPT ANALYSIS
// ════════════════════════════════════════════
function analyzeChunk(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  totalWords += words.length;

  const matches = text.match(FILLER_RE);
  if (matches) {
    fillerCount += matches.length;
    matches.forEach(w => {
      const k = w.toLowerCase();
      fillerMap[k] = (fillerMap[k] || 0) + 1;
    });
  }
  fillersEl.textContent = fillerCount;
  fillersList.textContent = Object.entries(fillerMap).sort((a,b)=>b[1]-a[1])
    .slice(0,4).map(([w,c])=>`${w}×${c}`).join('  ');

  const elapsed = sessionSeconds || 1;
  const wpm     = Math.round((totalWords / elapsed) * 60);
  wpmEl.textContent = wpm;

  updateScore(calcScore());
  updateNotes(wpm);
}

function updateNotes(wpm) {
  const tips = [];
  if (fillerCount > 10) tips.push('Reduce filler words (um, uh, like…)');
  if (wpm > 180)        tips.push("Slow down a little — you're speaking fast");
  if (wpm < 80 && wpm > 0) tips.push('Speak a bit faster to maintain energy');
  const eyePct = faceTracker ? faceTracker.getSummary().avgEye : 0;
  if (eyePct && eyePct < 40) tips.push('Look more towards the camera');
  notesEl.textContent = tips.length ? tips.join(' · ') : 'Good pace — keep going!';
}

// ════════════════════════════════════════════
// PERMISSION BANNER
// ════════════════════════════════════════════
function showBanner(t,m) { bannerTitle.textContent=t; bannerMessage.textContent=m; permBanner.style.display='block'; }
function hideBanner()    { permBanner.style.display='none'; }

// ════════════════════════════════════════════
// ANSWER SUBMISSION / EVALUATION / FOLLOW-UPS / LEARNING MODE
// ════════════════════════════════════════════
function finalizeCurrentAnswer() {
  const round = rounds[roundIndex];
  const q = questions[qIndex];
  if (!q) return;
  const text = (answers[qIndex] || '').trim();
  const fillerForThis = Math.max(0, fillerCount - fillerCountAtQStart);
  const wpmVal = parseInt(wpmEl.textContent) || 0;

  if (round === 'intro') {
    const result = window.AIRC_INTRO_EVAL
      ? window.AIRC_INTRO_EVAL.evaluateIntroduction(text, fillerForThis)
      : null;
    showIntroBanner(result);
    answerEvaluations.push({ round, q: q.q, hint: q.hint, tags: q.tags, text, breakdown: {}, overall: result ? result.score : 50 });
    return result;
  }

  if (window.AIRC_ANSWER_EVAL) {
    const evalResult = window.AIRC_ANSWER_EVAL.evaluateAnswer({ text, hint: q.hint, tags: q.tags, fillerCount: fillerForThis, wpm: wpmVal });
    answerEvaluations.push({ round, q: q.q, hint: q.hint, tags: q.tags, text, breakdown: evalResult.breakdown, overall: evalResult.overall });
    renderAnswerFeedback(evalResult, q);
  }

  if (window.AIRC_FOLLOWUP && text.split(/\s+/).length >= 4) {
    const followUpCountInRound = questions.filter(x => x.isFollowUp).length;
    if (followUpCountInRound < 2) {
      const fups = window.AIRC_FOLLOWUP.generateFollowUps(text, followUpsAskedSet, 1);
      fups.forEach(fq => {
        followUpsAskedSet.add(fq);
        questions.splice(qIndex + 1, 0, { q: fq, hint: '', tags: ['followup'], isFollowUp: true });
        answers.splice(qIndex + 1, 0, '');
      });
    }
  }
}

function showIntroBanner(result) {
  introBanner.style.display = 'block';
  if (!result) { introBanner.innerHTML = ''; return; }
  introBanner.className = 'card intro-banner' + (result.isGood ? '' : ' warn');
  const chips = result.results.map(r =>
    `<span class="intro-check-chip ${r.passed ? 'pass' : 'fail'}">${r.passed ? '✓' : '○'} ${r.label}</span>`).join('');
  introBanner.innerHTML = `
    <div class="intro-banner-title">${result.isGood ? '✅ Introduction Completed Successfully' : '⚠ Introduction Could Be Stronger'}</div>
    <div style="font-size:12px;color:var(--text2)">Checklist score: ${result.passedCount}/${result.total} (${result.score}/100)</div>
    <div class="intro-checklist">${chips}</div>
  `;
  if (result.isGood) {
    toast('Introduction completed — moving to next round ✓', 'ok');
    setTimeout(() => { if (isRunning) advance(); }, 1600);
  }
}

const TIP_LIBRARY = {
  technicalAccuracy:  'Mention the specific technical terms/keywords the question is looking for.',
  explanationQuality: 'Use connector words (because, therefore, for example) to explain your reasoning, not just state facts.',
  confidence:         'Cut filler words (um, uh, like) — pause silently instead of filling gaps.',
  communication:      'Aim for a natural pace around 120–160 words per minute.',
  grammar:            'Watch for repeated words and keep sentences a reasonable length.',
  vocabulary:         'Vary your word choice — avoid repeating the same terms.',
  completeness:       'Expand your answer — aim for at least 25-30 words with concrete detail.',
  professionalism:    'Avoid casual filler phrases (gonna, kinda, stuff like that) in interview answers.',
};

function renderAnswerFeedback(evalResult, q) {
  const breakdown = evalResult.breakdown;
  const entries = Object.entries(breakdown).sort((a,b) => a[1]-b[1]);
  const weakest = entries.slice(0, 2);
  const chips = Object.entries(breakdown).map(([k,v]) =>
    `<span class="af-score-chip">${labelize(k)}: <b>${v}</b></span>`).join('');
  const tips = weakest.map(([k]) => `<li>${TIP_LIBRARY[k] || 'Keep practicing this area.'}</li>`).join('');
  answerFeedback.style.display = 'block';
  answerFeedback.innerHTML = `
    <h4>Learning Mode — Answer Score: ${evalResult.overall}/100</h4>
    <div class="af-score-row">${chips}</div>
    <div class="af-block"><b>Suggested answer points:</b> ${q.hint || 'General clarity and structure.'}</div>
    <div class="af-block"><b>Tips for improvement:</b><ul style="margin-left:16px">${tips}</ul></div>
  `;
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// ════════════════════════════════════════════
// ROUND / QUESTION ADVANCEMENT
// ════════════════════════════════════════════
function advance() {
  if (qIndex < questions.length - 1) {
    qIndex++;
    showQuestion();
  } else {
    goToNextRound();
  }
}

/* ── Review a previously-answered question (read-only, does not lose progress) ── */
function reviewPreviousQuestion() {
  if (!isRunning || qIndex <= 0) return;
  qIndex--;
  showQuestion();
  toast('Reviewing previous answer', '');
}

/* ── Skip the current question without scoring it, move straight to the next ── */
function skipCurrentQuestion() {
  if (!isRunning) return;
  if (!answers[qIndex]) answers[qIndex] = '';
  answerEvaluations.push({ round: rounds[roundIndex], q: questions[qIndex]?.q, hint: questions[qIndex]?.hint, tags: questions[qIndex]?.tags, text: '[Skipped]', breakdown: {}, overall: 0, skipped: true });
  toast('Question skipped', '');
  advance();
}

prevQBtn?.addEventListener('click', reviewPreviousQuestion);
skipQBtn?.addEventListener('click', skipCurrentQuestion);

function goToNextRound() {
  clearInterval(qCountdownTimer);
  if (roundIndex < rounds.length - 1) {
    startRound(roundIndex + 1);
  } else {
    finishSession();
  }
}

// ════════════════════════════════════════════
// CODING ROUND
// ════════════════════════════════════════════
function startCodingRound() {
  codingProblems = buildCodingProblems(diffSelect.value);
  if (!codingProblems.length) { goToNextRound(); return; }
  codeIndex = 0;
  questionCard.style.display = 'none';
  codingCard.style.display = 'block';
  showCodeProblem();
}

function showCodeProblem() {
  const p = codingProblems[codeIndex];
  codeBadge.textContent = `Problem ${codeIndex + 1} / ${codingProblems.length} · ${p.difficulty}`;
  codeProgressBar.style.width = `${(codeIndex / codingProblems.length) * 100}%`;
  codeTitle.textContent = p.title;
  codePrompt.textContent = p.prompt;
  codeEditor.value = p.starter;
  codeResults.innerHTML = '';
  startCodeTimer();
}

function startCodeTimer() {
  clearInterval(codeTimerTimer);
  codeCountdownSec = 300;
  updateCodeTimerDisplay();
  codeTimerTimer = setInterval(() => {
    codeCountdownSec--;
    updateCodeTimerDisplay();
    if (codeCountdownSec <= 0) { clearInterval(codeTimerTimer); toast('⏰ Time up for this problem!', 'err'); }
  }, 1000);
}
function updateCodeTimerDisplay() {
  const m = Math.floor(codeCountdownSec/60), s = codeCountdownSec%60;
  codeTimerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
}

runCodeBtn.addEventListener('click', async () => {
  const p = codingProblems[codeIndex];
  if (!window.AIRC_CODING) return;
  runCodeBtn.disabled = true;
  codeResults.innerHTML = '<div class="code-test-row">Running tests…</div>';
  const result = await window.AIRC_CODING.evaluateSubmission(codeEditor.value, p);
  runCodeBtn.disabled = false;

  if (result.error && !result.testResults.length) {
    codeResults.innerHTML = `<div class="code-test-row fail">Error: ${escapeHtml(result.error)}</div>`;
  } else {
    codeResults.innerHTML = result.testResults.map((t,i) =>
      `<div class="code-test-row ${t.pass?'pass':'fail'}">
        <span>Test ${i+1}: ${t.pass ? '✓ Pass' : '✗ Fail'}</span>
        <span style="color:var(--muted)">${t.error ? escapeHtml(t.error) : `expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(t.actual)}`}</span>
      </div>`).join('') +
      `<div class="code-summary">${result.passed}/${result.total} tests passed · Code quality: ${result.quality}/100</div>`;
  }
  codeResultsBySlot[codeIndex] = { problemId: p.id, title: p.title, ...result };
});

nextCodeBtn.addEventListener('click', () => {
  clearInterval(codeTimerTimer);
  if (codeIndex < codingProblems.length - 1) {
    codeIndex++;
    showCodeProblem();
  } else {
    goToNextRound();
  }
});

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ════════════════════════════════════════════
// FINAL FEEDBACK
// ════════════════════════════════════════════
function showFeedback() {
  questionCard.style.display = 'none';
  codingCard.style.display = 'none';
  feedbackCard.style.display = 'block';
  renderFeedback();
}

function avgBreakdown(evals, key) {
  const vals = evals.map(e => e.breakdown?.[key]).filter(v => typeof v === 'number');
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
}

function renderFeedback() {
  const talkEvals = answerEvaluations.filter(e => e.round !== 'intro');
  const overall = calcScore();
  const technicalEvals = answerEvaluations.filter(e => e.round === 'technical' || e.round === 'company');
  const hrEvals = answerEvaluations.filter(e => e.round === 'hr');
  const technicalScore = technicalEvals.length ? Math.round(technicalEvals.reduce((a,e)=>a+e.overall,0)/technicalEvals.length) : null;
  const hrScore = hrEvals.length ? Math.round(hrEvals.reduce((a,e)=>a+e.overall,0)/hrEvals.length) : null;
  const communicationScore = avgBreakdown(talkEvals,'communication');
  const grammarScore = avgBreakdown(talkEvals,'grammar');
  const confidenceScore = avgBreakdown(talkEvals,'confidence');
  const eyeContactScore = faceTracker ? faceTracker.getSummary().avgEye : null;
  const codingPassed = codeResultsBySlot.reduce((a,r)=>a+(r?.passed||0),0);
  const codingTotal   = codeResultsBySlot.reduce((a,r)=>a+(r?.total||0),0);
  const codingScore   = codingTotal ? Math.round((codingPassed/codingTotal)*100) : null;

  const items = [
    ['Overall', overall], ['Technical', technicalScore], ['HR / Behavioural', hrScore],
    ['Coding', codingScore], ['Communication', communicationScore], ['Grammar', grammarScore],
    ['Confidence', confidenceScore], ['Eye Contact', eyeContactScore],
  ].filter(([,v]) => v !== null);

  feedbackGrid.innerHTML = items.map(([label,val]) =>
    `<div class="fb-item"><div class="fb-label">${label}</div><div class="fb-val">${val}${label==='Eye Contact'||label==='Coding'?'%':''}</div></div>`).join('');

  const factorKeys = ['technicalAccuracy','explanationQuality','confidence','communication','grammar','vocabulary','completeness','professionalism'];
  const factorAverages = factorKeys.map(k => [k, avgBreakdown(talkEvals,k)]).filter(([,v]) => v !== null);
  factorAverages.sort((a,b) => b[1]-a[1]);
  const strengths = factorAverages.slice(0,3).filter(([,v])=>v>=60);
  const weaknesses = [...factorAverages].sort((a,b)=>a[1]-b[1]).slice(0,3).filter(([,v])=>v<75);

  strengthsList.innerHTML = strengths.length
    ? strengths.map(([k,v]) => `<li>${labelize(k)} — ${v}/100</li>`).join('')
    : '<li>Keep practicing to build up measurable strengths.</li>';
  weaknessesList.innerHTML = weaknesses.length
    ? weaknesses.map(([k,v]) => `<li>${labelize(k)} — ${v}/100</li>`).join('')
    : '<li>No major weak areas detected — solid, balanced performance.</li>';
  suggestionsList.innerHTML = weaknesses.length
    ? weaknesses.map(([k]) => `<li>${TIP_LIBRARY[k] || 'Keep practicing this area.'}</li>`).join('')
    : '<li>Try a harder difficulty or a company-specific mode next time.</li>';

  reportBtn.disabled = false;
  reportPdfBtn.disabled = false;
  notesEl.textContent = `Interview complete — overall score: ${overall}/100`;
}

// ════════════════════════════════════════════
// CONTROLS
// ════════════════════════════════════════════
startBtn.addEventListener('click', async () => {
  if (isRunning) return;
  resetMetrics();
  companyKey = companySelect.value;
  companyMode = !!companyKey;
  rounds = companyMode ? ['intro','company','coding','feedback'] : ['intro','hr','technical','coding','feedback'];
  voiceAnalyzer = window.AIRC_VOICE_ANALYZER ? window.AIRC_VOICE_ANALYZER() : null;
  faceTracker = null;
  setRunning(true);
  isRunning = true; isManual = (modeSelect.value === 'manual');
  manualControls.style.display = isManual ? 'block' : 'none';
  welcomeCard.style.display = 'none';
  startRound(0);
  startSessionClock();
  toast('Interview started — good luck! 🎤', 'ok');
  if (!isManual) {
    if (!isSecureCtx()) { showBanner('HTTPS required','Use localhost or HTTPS.'); return; }
    await tryStartMedia();
  } else {
    notesEl.textContent = 'Manual mode — type your answers below.';
    noCam.style.display = 'flex';
  }
});

nextBtn.addEventListener('click', () => {
  if (!isRunning) return;
  const round = rounds[roundIndex];
  if (round === 'coding') return;
  finalizeCurrentAnswer();
  if (round === 'intro') return;
  advance();
});

stopBtn.addEventListener('click', () => {
  if (!isRunning) return;
  finishSession();
});

function finishSession() {
  clearInterval(faceInterval); faceInterval = null;
  clearInterval(qCountdownTimer); qCountdownTimer = null;
  clearInterval(codeTimerTimer); codeTimerTimer = null;
  clearInterval(sessionClock); sessionClock = null;
  clearSilenceWatch();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  isAISpeaking = false;
  if (stream) { stream.getTracks().forEach(t=>t.stop()); stream = null; }
  if (recognition) { try { recognition.stop(); } catch(e){} recognition = null; }
  isRunning = false;
  waveformEl.classList.remove('active');
  setRunning(false);
  showFeedback();
  const score = calcScore();
  updateScore(score);
  toast('Session saved to history ✓', 'ok');
  saveSession(score);
}

reportBtn.addEventListener('click', exportHTMLReport);
reportPdfBtn.addEventListener('click', exportPdfReportHandler);

retryPermBtn.addEventListener('click', () => { hideBanner(); tryStartMedia(); });
useManualBtn.addEventListener('click', () => { hideBanner(); isManual=true; manualControls.style.display='block'; });

manualSubmitBtn.addEventListener('click', () => {
  const text = manualInput.value.trim(); if(!text) return;
  transcriptSoFar += ' ' + text;
  answers[qIndex]  = ((answers[qIndex]||'') + ' ' + text).trim();
  currentAnswer.textContent  = answers[qIndex];
  liveTranscript.textContent = transcriptSoFar.trim();
  if (voiceAnalyzer) voiceAnalyzer.onChunk(text);
  analyzeChunk(text);
  manualInput.value = '';
});

manualNextBtn.addEventListener('click', () => {
  if (!isRunning) return;
  const round = rounds[roundIndex];
  finalizeCurrentAnswer();
  if (round === 'intro') return;
  advance();
});

// resize overlay
function resizeOverlay() {
  if (!overlay || !video) return;
  overlay.width  = video.videoWidth  || overlay.clientWidth;
  overlay.height = video.videoHeight || overlay.clientHeight;
}
window.addEventListener('resize', resizeOverlay);
video.addEventListener('loadedmetadata', resizeOverlay);

// ════════════════════════════════════════════
// DB: SAVE SESSION
// ════════════════════════════════════════════
async function saveSession(score) {
  const avgEye = faceTracker ? faceTracker.getSummary().avgEye : 0;
  const wpmVal = parseInt(wpmEl.textContent) || 0;
  const allQuestions = []; const allAnswers = [];
  answerEvaluations.forEach(e => { allQuestions.push(e.q); allAnswers.push(e.text); });

  const breakdownAverages = ['technicalAccuracy','explanationQuality','confidence','communication','grammar','vocabulary','completeness','professionalism']
    .map(k => ({ label: labelize(k), value: avgBreakdown(answerEvaluations.filter(e=>e.round!=='intro'),k) }))
    .filter(b => b.value !== null);

  const session = {
    startedAt:   new Date().toISOString(),
    category:    companyMode ? null : categorySelect.value,
    company:     companyMode ? companyKey : null,
    difficulty:  diffSelect.value,
    duration:    sessionSeconds,
    totalWords,
    wpm:         wpmVal,
    fillers:     fillerCount,
    fillerMap,
    eyeContact:  avgEye,
    score,
    transcript:  transcriptSoFar.trim(),
    questions:   allQuestions,
    answers:     allAnswers,
    breakdowns:  breakdownAverages,
    codingResults: codeResultsBySlot.filter(Boolean),
  };
  try {
    await AIRC_DB.dbSaveSession(session);
  } catch(e) {
    console.error('DB save error', e);
  }
}

// ════════════════════════════════════════════
// HISTORY TAB
// ════════════════════════════════════════════
function sessionCategoryLabel(s) {
  if (s.company) return (CBANK[s.company]?.label || s.company) + ' (Company)';
  return CATLABELS[s.category] || s.category || 'General';
}

async function renderHistory() {
  historyList.innerHTML = `
    <div class="skeleton skel-card" style="margin-bottom:10px"></div>
    <div class="skeleton skel-card" style="margin-bottom:10px"></div>
    <div class="skeleton skel-card"></div>`;
  let sessions;
  try { sessions = await AIRC_DB.dbGetAllSessions(); } catch(e) { sessions=[]; }
  historyList.innerHTML = '';
  if (!sessions.length) {
    historyList.innerHTML = '<div class="empty-state">No sessions recorded yet.<br>Complete an interview to see history.</div>';
    return;
  }
  sessions.forEach(s => {
    const card = document.createElement('div');
    card.className = 'session-card';
    const grade = s.score>=80?'A':s.score>=65?'B':s.score>=50?'C':'D';
    card.innerHTML = `
      <div>
        <div class="session-date">${new Date(s.startedAt).toLocaleString()} · ${formatDuration(s.duration)}</div>
        <div class="session-title">${sessionCategoryLabel(s)} — ${s.difficulty}</div>
        <div class="session-chips">
          <span class="chip hi">WPM: ${s.wpm}</span>
          <span class="chip">Fillers: ${s.fillers}</span>
          <span class="chip">Eye: ${s.eyeContact}%</span>
          <span class="chip">${s.questions?.length||0} Qs</span>
        </div>
      </div>
      <div style="text-align:right">
        <div class="session-score">${s.score}</div>
        <div class="score-grade">Grade ${grade}</div>
        <div class="session-actions" style="margin-top:6px">
          <button class="btn sm view-btn">View</button>
          <button class="btn sm danger del-btn">Del</button>
        </div>
      </div>
    `;
    card.querySelector('.view-btn').addEventListener('click', (e) => { e.stopPropagation(); openModal(s); });
    card.querySelector('.del-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      await AIRC_DB.dbDeleteSession(s.id);
      toast('Session deleted');
      renderHistory();
      renderAnalytics();
    });
    historyList.appendChild(card);
  });
}

clearHistoryBtn.addEventListener('click', async () => {
  if (!confirm('Delete all sessions?')) return;
  await AIRC_DB.dbClearAll();
  toast('All sessions cleared');
  renderHistory(); renderAnalytics();
});

function formatDuration(s) {
  const m = Math.floor((s||0)/60), sec=(s||0)%60;
  return `${m}m ${sec}s`;
}

// ════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════
function openModal(s) {
  const grade = s.score>=80?'A':s.score>=65?'B':s.score>=50?'C':'D';
  modalContent.innerHTML = `
    <h2 style="font-family:var(--font-head);font-size:18px;font-weight:800;margin-bottom:16px">
      ${sessionCategoryLabel(s)} — ${s.difficulty}
      <small style="font-size:12px;color:var(--muted);font-weight:400;margin-left:8px">${new Date(s.startedAt).toLocaleString()}</small>
    </h2>
    <div class="modal-section">
      <h3>Performance Metrics</h3>
      <div class="modal-meta-grid">
        <div class="modal-meta-item"><div class="modal-meta-label">Score</div><div class="modal-meta-val">${s.score}/100 (${grade})</div></div>
        <div class="modal-meta-item"><div class="modal-meta-label">WPM</div><div class="modal-meta-val">${s.wpm}</div></div>
        <div class="modal-meta-item"><div class="modal-meta-label">Eye Contact</div><div class="modal-meta-val">${s.eyeContact}%</div></div>
        <div class="modal-meta-item"><div class="modal-meta-label">Fillers</div><div class="modal-meta-val">${s.fillers}</div></div>
        <div class="modal-meta-item"><div class="modal-meta-label">Duration</div><div class="modal-meta-val">${formatDuration(s.duration)}</div></div>
        <div class="modal-meta-item"><div class="modal-meta-label">Words</div><div class="modal-meta-val">${s.totalWords}</div></div>
      </div>
    </div>
    ${s.breakdowns?.length ? `<div class="modal-section"><h3>Score Breakdown</h3><div class="modal-meta-grid">
        ${s.breakdowns.map(b=>`<div class="modal-meta-item"><div class="modal-meta-label">${b.label}</div><div class="modal-meta-val">${b.value}</div></div>`).join('')}
      </div></div>` : ''}
    <div class="modal-section">
      <h3>Q&A Review</h3>
      <div class="modal-qa">
        ${(s.questions||[]).map((q,i)=>`
          <div class="modal-qa-item">
            <div class="modal-qa-q">Q${i+1}: ${q}</div>
            <div class="modal-qa-a">${s.answers?.[i]||'<em style="color:var(--muted)">No answer recorded</em>'}</div>
          </div>`).join('')}
      </div>
    </div>
    ${s.transcript ? `<div class="modal-section"><h3>Full Transcript</h3><div class="modal-transcript">${s.transcript}</div></div>` : ''}
  `;
  sessionModal.style.display = 'flex';
}
modalClose.addEventListener('click', () => sessionModal.style.display = 'none');
sessionModal.addEventListener('click', (e) => { if(e.target===sessionModal) sessionModal.style.display='none'; });

// ════════════════════════════════════════════
// ANALYTICS TAB
// ════════════════════════════════════════════
async function renderAnalytics() {
  let sessions;
  try { sessions = (await AIRC_DB.dbGetAllSessions()).reverse(); } catch(e) { sessions=[]; }
  statTotal.textContent    = sessions.length;
  if (!sessions.length) {
    statAvgScore.textContent = statAvgWPM.textContent = statAvgFillers.textContent = '—';
    return;
  }
  const avgScore   = Math.round(sessions.reduce((a,s)=>a+s.score,0)/sessions.length);
  const avgWPM     = Math.round(sessions.reduce((a,s)=>a+s.wpm,0)/sessions.length);
  const avgFillers = Math.round(sessions.reduce((a,s)=>a+s.fillers,0)/sessions.length);
  statAvgScore.textContent   = avgScore;
  statAvgWPM.textContent     = avgWPM;
  statAvgFillers.textContent = avgFillers;

  const labels = sessions.map((_,i)=>`S${i+1}`);
  drawLineChart(trendChart, labels, sessions.map(s=>s.score), '#00ddb4');
  drawLineChart(wpmChart,   labels, sessions.map(s=>s.wpm),   '#00aaff');
}

function drawLineChart(canvas, labels, data, color) {
  const ctx = canvas.getContext('2d');
  const W=canvas.offsetWidth||500, H=120;
  canvas.width=W; canvas.height=H;
  ctx.clearRect(0,0,W,H);
  if (!data.length) return;

  const pad=20, maxVal=Math.max(...data,1), minVal=Math.min(...data,0);
  const scaleY = v => H - pad - ((v-minVal)/(maxVal-minVal||1))*(H-pad*2);
  const scaleX = i => pad + (i/(data.length-1||1))*(W-pad*2);

  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  [0,0.25,0.5,0.75,1].forEach(t => {
    const y=scaleY(minVal+(maxVal-minVal)*t);
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke();
  });

  const grad=ctx.createLinearGradient(0,pad,0,H-pad);
  grad.addColorStop(0,color+'55'); grad.addColorStop(1,color+'00');
  ctx.beginPath();
  data.forEach((v,i)=>{ const x=scaleX(i),y=scaleY(v); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.lineTo(scaleX(data.length-1),H-pad);
  ctx.lineTo(scaleX(0),H-pad);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();

  ctx.beginPath();
  data.forEach((v,i)=>{ const x=scaleX(i),y=scaleY(v); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();

  data.forEach((v,i)=>{
    ctx.beginPath(); ctx.arc(scaleX(i),scaleY(v),3,0,Math.PI*2);
    ctx.fillStyle=color; ctx.fill();
  });
}

// ════════════════════════════════════════════
// DASHBOARD TAB
// ════════════════════════════════════════════
async function renderDashboard() {
  if (!window.AIRC_DASHBOARD) return;
  dashTotal.innerHTML = '<span class="spinner"></span>';
  let sessions;
  try { sessions = await AIRC_DB.dbGetAllSessions(); } catch(e) { sessions = []; }
  const d = window.AIRC_DASHBOARD.computeDashboard(sessions);
  dashTotal.textContent = d.total;
  dashAvgScore.textContent = d.total ? d.avgScore : '—';
  dashStreak.innerHTML = d.streak + '<span class="dash-unit">d</span>';
  dashXP.textContent = d.xp;
  dashWeekCount.textContent = d.weeklyCount;
  dashWeekAvg.textContent = d.weeklyCount ? d.weeklyAvg : '—';
  dashMonthCount.textContent = d.monthlyCount;
  dashMonthAvg.textContent = d.monthlyCount ? d.monthlyAvg : '—';

  badgeGrid.innerHTML = d.badges.length
    ? d.badges.map(b => `<div class="badge-pill"><span class="b-icon">${b.icon}</span>${b.label}</div>`).join('')
    : '<div class="empty-state" style="padding:20px 0">Complete an interview to earn badges.</div>';

  const catLabel = c => CATLABELS[c] || (CBANK[c]?.label) || c;
  strongTopicsEl.innerHTML = d.strong.length
    ? d.strong.map(t => `<div class="topic-row"><span>${catLabel(t.cat)}</span><b>${t.avg}/100</b></div>`).join('')
    : '<div class="empty-state" style="padding:10px 0">No data yet.</div>';
  weakTopicsEl.innerHTML = d.weak.length
    ? d.weak.map(t => `<div class="topic-row"><span>${catLabel(t.cat)}</span><b>${t.avg}/100</b></div>`).join('')
    : '<div class="empty-state" style="padding:10px 0">No data yet.</div>';

  const sugEl = document.getElementById('dashSuggestions');
  if (sugEl) sugEl.innerHTML = (d.suggestions || []).map(s => `<li>${s}</li>`).join('');
}

// ════════════════════════════════════════════
// HTML / PDF REPORT EXPORT
// ════════════════════════════════════════════
function reportData() {
  const avgEye = faceTracker ? faceTracker.getSummary().avgEye : 0;
  const wpmVal = parseInt(wpmEl.textContent)||0;
  const score  = calcScore();
  const cat    = companyMode ? (CBANK[companyKey]?.label || companyKey) : (CATLABELS[categorySelect.value]||categorySelect.value);
  const diff   = diffSelect.value;
  const allQuestions = answerEvaluations.map(e => e.q);
  const allAnswers = answerEvaluations.map(e => e.text);
  const breakdowns = ['technicalAccuracy','explanationQuality','confidence','communication','grammar','vocabulary','completeness','professionalism']
    .map(k => ({ label: labelize(k), value: avgBreakdown(answerEvaluations.filter(e=>e.round!=='intro'),k) }))
    .filter(b => b.value !== null);
  return { category: cat, difficulty: diff, score, wpm: wpmVal, eyeContact: avgEye, fillers: fillerCount,
    totalWords, duration: formatDuration(sessionSeconds), questions: allQuestions, answers: allAnswers, breakdowns };
}

function exportHTMLReport() {
  const d = reportData();
  const grade  = d.score>=80?'A':d.score>=65?'B':d.score>=50?'C':'D';

  const qaRows = d.questions.map((q,i)=>
    `<div style="margin-bottom:14px;padding:12px;background:#111926;border-radius:8px;border-left:3px solid #00ddb4">
      <p style="font-size:12px;color:#4d6480;margin-bottom:6px">Q${i+1}: ${q}</p>
      <p style="font-size:14px;color:#cde0f0">${d.answers[i]||'<em>No answer</em>'}</p>
    </div>`).join('');

  const breakdownRows = d.breakdowns.map(b =>
    `<div class="meta-item"><div class="meta-label">${b.label}</div><div class="meta-val" style="font-size:18px">${b.value}</div></div>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>A.I.R.C. Pro Report</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
body{font-family:'JetBrains Mono',monospace;background:#080c12;color:#cde0f0;margin:0;padding:40px;max-width:800px;margin:0 auto}
h1{font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#00ddb4}
h2{font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:#00aaff;margin:24px 0 10px;letter-spacing:1px;text-transform:uppercase}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.meta-item{background:#111926;border-radius:8px;padding:12px}
.meta-label{font-size:10px;color:#4d6480;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.meta-val{font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#00ddb4}
.transcript{background:#111926;border-radius:8px;padding:16px;font-size:13px;line-height:1.8;color:#7a99b8;max-height:300px;overflow:auto}
footer{margin-top:40px;font-size:11px;color:#4d6480}
</style>
</head><body>
<h1>◈ A.I.R.C. Pro — Interview Report</h1>
<p style="color:#4d6480;font-size:13px">${d.category} · ${d.difficulty} · ${new Date().toLocaleString()}</p>
<h2>Performance Summary</h2>
<div class="meta">
  <div class="meta-item"><div class="meta-label">Confidence Score</div><div class="meta-val">${d.score}/100 (${grade})</div></div>
  <div class="meta-item"><div class="meta-label">Words Per Minute</div><div class="meta-val">${d.wpm}</div></div>
  <div class="meta-item"><div class="meta-label">Eye Contact</div><div class="meta-val">${d.eyeContact}%</div></div>
  <div class="meta-item"><div class="meta-label">Filler Words</div><div class="meta-val">${d.fillers}</div></div>
  <div class="meta-item"><div class="meta-label">Total Words</div><div class="meta-val">${d.totalWords}</div></div>
  <div class="meta-item"><div class="meta-label">Duration</div><div class="meta-val">${d.duration}</div></div>
</div>
${breakdownRows ? `<h2>Detailed Score Breakdown</h2><div class="meta">${breakdownRows}</div>` : ''}
<h2>Q&A Review</h2>
${qaRows}
<h2>Full Transcript</h2>
<div class="transcript">${transcriptSoFar.trim()||'No transcript recorded.'}</div>
<footer>Generated by A.I.R.C. Pro · ${new Date().toISOString()}</footer>
</body></html>`;

  const blob = new Blob([html], { type:'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `airc_report_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Report downloaded ✓', 'ok');
}

async function exportPdfReportHandler() {
  if (!window.AIRC_PDF) { toast('PDF module unavailable', 'err'); return; }
  try {
    await window.AIRC_PDF.exportPdfReport(reportData());
    toast('PDF downloaded ✓', 'ok');
  } catch (e) {
    toast('PDF generation failed', 'err');
  }
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
resetMetrics();
