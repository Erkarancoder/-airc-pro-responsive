/* ─────────────────────────────────────────────
   js/settingsStore.js — A.I.R.C. Pro Settings Store
   Shared, framework-free settings persistence layer used by the
   Settings page (settings.html/js/settings.js) and applied
   app-wide (theme + profile visibility) on every authenticated page.

   Storage: localStorage, under its own key — exactly the same
   storage mechanism already used by auth.js (AUTH_KEY/SESSION_KEY)
   and js/plan.js (PLAN_KEY). Nothing here reads/writes any key
   used by those modules, so existing auth/plan behaviour is
   untouched.

   This file is intentionally NOT deferred and is included as early
   as possible in <head> so the saved theme can be applied before
   first paint (no flash of the wrong theme).
───────────────────────────────────────────── */
'use strict';

(function () {
  const KEY = 'airc_settings_v1';

  const DEFAULTS = {
    notifications: {
      enabled: true,
      interviewReminders: true,
      dailyPractice: true,
      email: false,
    },
    appearance: {
      theme: 'dark', // 'dark' | 'light' | 'auto'
    },
    privacy: {
      profileVisibility: 'public', // 'public' | 'private'
    },
    interview: {
      language: 'en-IN',
      difficulty: 'mid',
      duration: 30,       // minutes
      cameraDefault: true,
      micDefault: true,
    },
    ai: {
      feedback: true,
      autoFollowUps: true,
      confidenceAnalysis: true,
      voiceAnalysis: true,
      faceAnalysis: true,
    },
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /** Recursively merges saved values on top of the defaults, so new
      fields added later always have a sane fallback. */
  function deepMerge(base, override) {
    const out = clone(base);
    if (!override || typeof override !== 'object') return out;
    Object.keys(base).forEach((k) => {
      const bv = base[k];
      const ov = override[k];
      if (bv && typeof bv === 'object' && !Array.isArray(bv)) {
        out[k] = deepMerge(bv, ov && typeof ov === 'object' ? ov : {});
      } else if (ov !== undefined) {
        out[k] = ov;
      }
    });
    return out;
  }

  function readRaw() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** Returns the full, merged settings object (defaults + saved overrides). */
  function getAll() {
    return deepMerge(DEFAULTS, readRaw());
  }

  /** Persists the full settings object and applies its visible side-effects. */
  function setAll(settings) {
    const merged = deepMerge(DEFAULTS, settings);
    try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch (e) { /* storage unavailable — non-fatal */ }
    applySideEffects(merged);
    return merged;
  }

  /** Restores factory defaults. */
  function reset() {
    try { localStorage.setItem(KEY, JSON.stringify(DEFAULTS)); } catch (e) {}
    applySideEffects(DEFAULTS);
    return clone(DEFAULTS);
  }

  function systemPrefersLight() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  }

  function resolveTheme(pref) {
    if (pref === 'auto') return systemPrefersLight() ? 'light' : 'dark';
    return pref === 'light' ? 'light' : 'dark';
  }

  function applyTheme(pref) {
    const theme = resolveTheme(pref || getAll().appearance.theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  /** Non-destructive, purely additive DOM effects — never removes or
      rewires any existing element/listener from index.js, profile.js, etc. */
  function applySideEffects(settings) {
    applyTheme(settings.appearance.theme);
    const applyBodyFlags = () => {
      if (!document.body) return;
      document.body.setAttribute(
        'data-profile-hidden',
        settings.privacy.profileVisibility === 'private' ? 'true' : 'false'
      );
    };
    if (document.body) applyBodyFlags();
    else document.addEventListener('DOMContentLoaded', applyBodyFlags, { once: true });
  }

  // Apply the saved (or default) theme immediately — before DOMContentLoaded —
  // so pages never flash the wrong theme on load.
  applyTheme();

  document.addEventListener('DOMContentLoaded', function () {
    applySideEffects(getAll());
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
        if (getAll().appearance.theme === 'auto') applyTheme('auto');
      });
    }
  });

  window.AIRC_SETTINGS = {
    KEY,
    DEFAULTS: clone(DEFAULTS),
    get: getAll,
    set: setAll,
    reset,
    applyTheme,
    resolveTheme,
  };
})();
