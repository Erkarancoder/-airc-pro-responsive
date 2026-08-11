/* ─────────────────────────────────────────────
   js/settingsApply.js — A.I.R.C. Pro
   Injects a purely-additive "Settings" link into index.html's
   topbar (same pattern as js/profileSummary.js's profile link) and
   applies the user's saved Interview Preferences as *default* form
   values on the setup card — the user can still change them before
   starting, and index.js's own logic is completely untouched.
   Depends on: auth.js, js/settingsStore.js.
───────────────────────────────────────────── */
(function () {
  'use strict';

  function injectTopbarLink() {
    const topbarRight = document.querySelector('.topbar-right');
    const logoutBtn = topbarRight && topbarRight.querySelector('button[onclick*="logout"]');
    if (!topbarRight || document.getElementById('settingsNavLink')) return;

    const link = document.createElement('a');
    link.href = 'settings.html';
    link.id = 'settingsNavLink';
    link.title = 'Settings';
    link.textContent = '⚙';
    link.style.cssText = 'font-size:16px;color:var(--muted);text-decoration:none;display:flex;align-items:center;transition:color .18s ease,transform .18s ease';
    link.onmouseover = () => { link.style.color = 'var(--accent)'; link.style.transform = 'rotate(25deg)'; };
    link.onmouseout  = () => { link.style.color = 'var(--muted)'; link.style.transform = 'rotate(0deg)'; };

    if (logoutBtn) topbarRight.insertBefore(link, logoutBtn);
    else topbarRight.appendChild(link);
  }

  /** Prefills the setup card with saved Interview Preferences.
      Only sets values once on load — never overwrites what the
      user picks afterwards, and never touches index.js's listeners. */
  function applyInterviewDefaults() {
    if (!window.AIRC_SETTINGS) return;
    const settings = window.AIRC_SETTINGS.get();

    const diffSelect = document.getElementById('difficultySelect');
    if (diffSelect && settings.interview.difficulty) diffSelect.value = settings.interview.difficulty;

    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
      // If the user has disabled both camera & mic defaults, default to manual typing.
      modeSelect.value = (settings.interview.micDefault === false) ? 'manual' : 'voice';
    }
  }

  /** A lightweight, purely local "daily practice" nudge — no server,
      no push notifications; just a toast, gated by the saved setting. */
  function maybeShowDailyReminder() {
    if (!window.AIRC_SETTINGS) return;
    const settings = window.AIRC_SETTINGS.get();
    if (!settings.notifications.enabled || !settings.notifications.dailyPractice) return;

    const LAST_KEY = 'airc_last_practice_nudge';
    const today = new Date().toDateString();
    let last = null;
    try { last = localStorage.getItem(LAST_KEY); } catch (e) {}
    if (last === today) return;

    try { localStorage.setItem(LAST_KEY, today); } catch (e) {}

    setTimeout(() => {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = '🔥 Keep your streak going — start a quick practice interview today!';
      container.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, 1200);
  }

  function init() {
    if (!window.AIRC_AUTH || !window.AIRC_AUTH.isLoggedIn()) return;
    injectTopbarLink();
    applyInterviewDefaults();
    maybeShowDailyReminder();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
