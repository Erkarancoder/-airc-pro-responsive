/* ─────────────────────────────────────────────
   js/faceAnalysis.js — A.I.R.C. Pro
   Face analysis engine built on face-api.js.

   NOTE ON A FIX: the original project's ./model/ folder
   contained weight files that did not match the file names
   face-api.js expects (e.g. tiny_face_detector_model-weights_manifest.json),
   so faceapi.nets.*.loadFromUri('./model/') was silently
   failing and eye-contact tracking never actually ran.
   This module tries the local ./model/ folder first (in
   case it's ever repopulated correctly) and falls back to
   a public CDN of official face-api.js model weights.
───────────────────────────────────────────── */
'use strict';

const FACE_MODEL_LOCAL = './model/';
const FACE_MODEL_CDN    = 'https://justadudewhohacks.github.io/face-api.js/models/';

let faceApiReady   = false;
let expressionsReady = false;

async function loadFaceModels() {
  if (!window.faceapi) return { faceApiReady: false, expressionsReady: false };
  const attempts = [FACE_MODEL_LOCAL, FACE_MODEL_CDN];
  for (const base of attempts) {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(base);
      await faceapi.nets.faceLandmark68Net.loadFromUri(base);
      faceApiReady = true;
      try {
        await faceapi.nets.faceExpressionNet.loadFromUri(base);
        expressionsReady = true;
      } catch (e) { expressionsReady = false; }
      break;
    } catch (e) { /* try next source */ }
  }
  return { faceApiReady, expressionsReady };
}

/** Eye-contact estimate: how centered the face is horizontally */
function estimateEyeContact(box, vw) {
  const cx = box.x + box.width / 2;
  const dist = Math.abs(cx - vw / 2);
  return Math.max(0, Math.round(100 - (dist / (vw / 2)) * 100));
}

/** Head movement: distance between consecutive box centroids, normalised */
function estimateHeadMovement(prevBox, box, vw, vh) {
  if (!prevBox || !box) return 0;
  const dx = (box.x + box.width / 2) - (prevBox.x + prevBox.width / 2);
  const dy = (box.y + box.height / 2) - (prevBox.y + prevBox.height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const diag = Math.sqrt(vw * vw + vh * vh);
  return Math.min(100, Math.round((dist / diag) * 400)); // 0=still, 100=very jumpy
}

/** Smile / expression summary from face-api expressions object */
function summarizeExpressions(expressions) {
  if (!expressions) return { dominant: null, smilePct: 0 };
  const entries = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const smilePct = Math.round((expressions.happy || 0) * 100);
  return { dominant: entries[0]?.[0] || null, smilePct };
}

/**
 * Create a running face-tracking session.
 * Call .sample(detection, vw, vh) each frame with a face-api detection
 * (or null if no face found) to accumulate stats.
 */
function createFaceTracker() {
  const eyeContactSamples = [];
  const movementSamples = [];
  const smileSamples = [];
  let framesTotal = 0;
  let framesWithFace = 0;
  let prevBox = null;

  return {
    sample(det, vw, vh) {
      framesTotal++;
      if (!det) { prevBox = null; return null; }
      framesWithFace++;
      const box = det.detection ? det.detection.box : det.box;
      const eyePct = estimateEyeContact(box, vw);
      eyeContactSamples.push(eyePct);
      const movement = estimateHeadMovement(prevBox, box, vw, vh);
      movementSamples.push(movement);
      prevBox = box;

      let smilePct = null;
      if (det.expressions) {
        const { smilePct: sp } = summarizeExpressions(det.expressions);
        smileSamples.push(sp);
        smilePct = sp;
      }
      return { eyePct, movement, smilePct, box };
    },
    getSummary() {
      const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const cameraPresence = framesTotal ? Math.round((framesWithFace / framesTotal) * 100) : 0;
      const avgEye = avg(eyeContactSamples);
      const avgMovement = avg(movementSamples);
      const avgSmile = avg(smileSamples);
      const stability = Math.max(0, 100 - avgMovement); // low movement = stable/attentive
      const attentionLevel = Math.round(avgEye * 0.5 + stability * 0.3 + cameraPresence * 0.2);
      return { avgEye, avgMovement, avgSmile, cameraPresence, attentionLevel, samples: eyeContactSamples.length };
    },
    eyeContactSamples,
  };
}

window.AIRC_FACE = { loadFaceModels, createFaceTracker, estimateEyeContact, estimateHeadMovement, summarizeExpressions };
