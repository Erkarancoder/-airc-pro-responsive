/* ─────────────────────────────────────────────
   js/plan.js — A.I.R.C. Pro subscription plan
   Client-side plan state (Free / Pro / Premium).

   NOTE: This app has no payment backend, so
   "upgrading" here simulates the subscription
   choice locally (per-browser) and is used to
   drive the UI — badges, "PRO/PREMIUM" tags,
   and soft upgrade prompts. No existing feature
   is removed or hard-locked for Free users; this
   keeps the current app fully working while
   giving it a real pricing/plan surface.
───────────────────────────────────────────── */
'use strict';

const PLAN_KEY = 'airc_plan';

const PLAN_DEFS = {
  free:    { label: 'Free',    rank: 0 },
  pro:     { label: 'Pro',     rank: 1 },
  premium: { label: 'Premium', rank: 2 },
};

// Features considered Pro/Premium-tier for labelling purposes
const FEATURE_TIER = {
  unlimitedInterviews:   'pro',
  resumeInterviews:      'pro',
  companyInterviews:     'pro',
  pdfReports:             'pro',
  performanceAnalytics:  'pro',
  aiFollowUps:            'premium',
  codingRound:             'premium',
  voiceAnalysis:           'premium',
  faceAnalysis:            'premium',
  hrSimulation:            'premium',
  advancedDashboard:      'premium',
};

const AIRC_PLAN = {
  get() {
    return localStorage.getItem(PLAN_KEY) || 'free';
  },
  set(plan) {
    if (!PLAN_DEFS[plan]) plan = 'free';
    localStorage.setItem(PLAN_KEY, plan);
    this.renderBadge();
    return plan;
  },
  label(plan = this.get()) {
    return PLAN_DEFS[plan]?.label || 'Free';
  },
  atLeast(minPlan) {
    return PLAN_DEFS[this.get()].rank >= PLAN_DEFS[minPlan].rank;
  },
  tierOf(featureKey) {
    return FEATURE_TIER[featureKey] || 'free';
  },
  /** Renders the plan badge into #planBadge if present on the page */
  renderBadge() {
    const el = document.getElementById('planBadge');
    if (!el) return;
    const plan = this.get();
    el.textContent = '◆ ' + this.label(plan).toUpperCase();
    el.className = 'plan-badge ' + plan;
    el.onclick = () => { window.location.href = 'pricing.html'; };
    el.style.cursor = 'pointer';
    el.title = 'Manage plan';
  },
};

window.AIRC_PLAN = AIRC_PLAN;
window.addEventListener('DOMContentLoaded', () => AIRC_PLAN.renderBadge());
