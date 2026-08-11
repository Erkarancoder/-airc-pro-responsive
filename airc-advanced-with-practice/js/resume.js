/* ─────────────────────────────────────────────
   js/resume.js — A.I.R.C. Pro
   Resume-based interview question generation.
   Supports .txt directly; .pdf via pdf.js (loaded from CDN
   on demand). Extracts skill/tech keywords + rough "project"
   sentences, then builds a tailored question set by pulling
   matching questions from QUESTION_BANK_EXT / FOLLOWUP_BANK
   and generating direct "tell me about X" prompts.
───────────────────────────────────────────── */
'use strict';

const RESUME_SKILL_KEYWORDS = [
  'javascript','typescript','react','node','express','mongodb','sql','mysql','postgresql',
  'python','java','c++','c#','django','flask','spring','docker','kubernetes','aws','azure',
  'gcp','git','redux','graphql','rest','api','html','css','tailwind','next.js','vue','angular',
  'machine learning','data science','pandas','numpy','tensorflow','pytorch','dsa','system design',
];

let pdfJsLoaded = false;
async function ensurePdfJs() {
  if (pdfJsLoaded || window.pdfjsLib) { pdfJsLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfJsLoaded = true;
}

async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const doc = await window.pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  }
  // plain text / anything else: read as text
  return await file.text();
}

function extractSkills(text) {
  const lower = (text || '').toLowerCase();
  return RESUME_SKILL_KEYWORDS.filter(kw => lower.includes(kw));
}

function extractProjectLines(text) {
  const lines = (text || '').split(/\n|(?<=[.!?])\s+/).map(l => l.trim()).filter(Boolean);
  return lines.filter(l => /\bproject|built|developed|designed|implemented\b/i.test(l) && l.length > 20 && l.length < 220).slice(0, 5);
}

/**
 * Build a tailored question set from resume text.
 * Pulls 1-2 questions per matched skill from QUESTION_BANK_EXT/QUESTION_BANK
 * plus custom "tell me about" prompts for detected project lines.
 */
function buildResumeQuestionSet(text) {
  const skills = extractSkills(text);
  const projectLines = extractProjectLines(text);
  const questions = [];

  const skillToCategory = {
    javascript: 'javascript', react: 'react', node: 'mern', express: 'mern', mongodb: 'mern',
    sql: 'sql', mysql: 'sql', postgresql: 'sql', java: 'java', python: 'javascript',
    docker: 'devops', kubernetes: 'devops', aws: 'devops', 'system design': 'system-design', dsa: 'dsa',
  };

  const banks = { ...(window.QUESTION_BANK || {}), ...(window.QUESTION_BANK_EXT || {}) };
  const usedTexts = new Set();
  skills.forEach(skill => {
    const cat = skillToCategory[skill];
    if (!cat || !banks[cat]) return;
    const pool = [...(banks[cat].beginner || []), ...(banks[cat].mid || [])];
    const pick = pool.find(q => !usedTexts.has(q.q));
    if (pick) { questions.push(pick); usedTexts.add(pick.q); }
  });

  projectLines.forEach(line => {
    const short = line.length > 140 ? line.slice(0, 140) + '…' : line;
    questions.push({
      q: `Your resume mentions: "${short}" — can you walk me through what you built and the technical decisions involved?`,
      hint: 'architecture, challenges, your specific contribution',
      tags: ['project'],
    });
  });

  if (!questions.length) {
    questions.push({ q: 'Walk me through your resume, starting with your most recent experience.', hint: 'chronological, relevant highlights', tags: ['intro'] });
  }

  return { skills, projectLines, questions };
}

window.AIRC_RESUME = { extractTextFromFile, extractSkills, extractProjectLines, buildResumeQuestionSet };
