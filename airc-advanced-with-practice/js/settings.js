/* ─────────────────────────────────────────────
   js/settings.js — A.I.R.C. Pro
   Controller for settings.html.
   Depends on: auth.js, db.js, js/settingsStore.js,
   js/profileCore.js, js/profileDb.js.
   Fully self-contained — does not read/write any global used by
   index.js, dashboard.js, profile.js, or any other existing module,
   beyond the shared AIRC_SETTINGS / AIRC_DB / AIRC_PROFILE_DB / AIRC_AUTH
   / AIRC_PLAN APIs those modules already expose for this purpose.
───────────────────────────────────────────── */
(function () {
  'use strict';

  const STORE = window.AIRC_SETTINGS;
  const CORE  = window.AIRC_PROFILE_CORE;
  const PDB   = window.AIRC_PROFILE_DB;

  const username = window.AIRC_AUTH ? window.AIRC_AUTH.currentUser() : null;

  const $ = (id) => document.getElementById(id);

  let current  = STORE ? STORE.get() : null; // last-saved state
  let isDirty  = false;

  /* ════════════════════════════════════════════
     TOAST (self-contained; reuses .toast CSS from index.css)
  ════════════════════════════════════════════ */
  function toast(msg, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type || ''}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /* ════════════════════════════════════════════
     CONFIRM DIALOG (shared, promise-based)
  ════════════════════════════════════════════ */
  function confirmDialog(title, msg) {
    return new Promise((resolve) => {
      const backdrop = $('sConfirmBackdrop');
      $('sConfirmTitle').textContent = title;
      $('sConfirmMsg').textContent = msg;
      backdrop.style.display = 'flex';

      const cleanup = (result) => {
        backdrop.style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      };
      const okBtn = $('sConfirmOk');
      const cancelBtn = $('sConfirmCancel');
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  /* ════════════════════════════════════════════
     SECTION NAV (click-to-scroll + scroll-spy)
  ════════════════════════════════════════════ */
  function wireNav() {
    const buttons = Array.from(document.querySelectorAll('#settingsNav button'));
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    if ('IntersectionObserver' in window) {
      const sections = document.querySelectorAll('.s-section');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          buttons.forEach((b) => b.classList.toggle('active', b.dataset.target === entry.target.id));
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      sections.forEach((s) => observer.observe(s));
    }
  }

  /* ════════════════════════════════════════════
     FORM <-> SETTINGS OBJECT
  ════════════════════════════════════════════ */
  function readFormIntoSettings() {
    const themeInput = document.querySelector('input[name="theme"]:checked');
    const visInput   = document.querySelector('input[name="profileVisibility"]:checked');
    return {
      notifications: {
        enabled:            $('notifEnabled').checked,
        interviewReminders: $('notifInterview').checked,
        dailyPractice:      $('notifDaily').checked,
        email:               $('notifEmail').checked,
      },
      appearance: {
        theme: themeInput ? themeInput.value : STORE.DEFAULTS.appearance.theme,
      },
      privacy: {
        profileVisibility: visInput ? visInput.value : STORE.DEFAULTS.privacy.profileVisibility,
      },
      interview: {
        language:      $('prefLanguage').value,
        difficulty:    $('prefDifficulty').value,
        duration:      Number($('prefDuration').value) || STORE.DEFAULTS.interview.duration,
        cameraDefault: $('prefCamera').checked,
        micDefault:    $('prefMic').checked,
      },
      ai: {
        feedback:            $('aiFeedback').checked,
        autoFollowUps:        $('aiFollowUps').checked,
        confidenceAnalysis:   $('aiConfidence').checked,
        voiceAnalysis:        $('aiVoice').checked,
        faceAnalysis:         $('aiFace').checked,
      },
    };
  }

  function writeSettingsIntoForm(settings) {
    $('notifEnabled').checked  = settings.notifications.enabled;
    $('notifInterview').checked = settings.notifications.interviewReminders;
    $('notifDaily').checked     = settings.notifications.dailyPractice;
    $('notifEmail').checked     = settings.notifications.email;

    document.querySelectorAll('input[name="theme"]').forEach((r) => { r.checked = (r.value === settings.appearance.theme); });
    refreshThemeCards();

    document.querySelectorAll('input[name="profileVisibility"]').forEach((r) => { r.checked = (r.value === settings.privacy.profileVisibility); });

    $('prefLanguage').value   = settings.interview.language;
    $('prefDifficulty').value = settings.interview.difficulty;
    $('prefDuration').value   = String(settings.interview.duration);
    $('prefCamera').checked   = settings.interview.cameraDefault;
    $('prefMic').checked      = settings.interview.micDefault;

    $('aiFeedback').checked    = settings.ai.feedback;
    $('aiFollowUps').checked   = settings.ai.autoFollowUps;
    $('aiConfidence').checked  = settings.ai.confidenceAnalysis;
    $('aiVoice').checked       = settings.ai.voiceAnalysis;
    $('aiFace').checked        = settings.ai.faceAnalysis;

    markClean();
  }

  function refreshThemeCards() {
    document.querySelectorAll('.s-theme-card').forEach((card) => {
      const input = card.querySelector('input');
      card.classList.toggle('active', input && input.checked);
    });
  }

  function markDirty() {
    isDirty = true;
    $('sUnsavedHint').classList.add('show');
  }
  function markClean() {
    isDirty = false;
    $('sUnsavedHint').classList.remove('show');
  }

  function wireDirtyTracking() {
    document.getElementById('settingsForm').addEventListener('input', markDirty);
    document.getElementById('settingsForm').addEventListener('change', markDirty);
  }

  /* ════════════════════════════════════════════
     APPEARANCE — live preview on change (persists immediately,
     independent of the Save button, so the theme never "reverts"
     if the user navigates away without saving the rest of the form)
  ════════════════════════════════════════════ */
  function wireThemeLivePreview() {
    document.querySelectorAll('input[name="theme"]').forEach((input) => {
      input.addEventListener('change', () => {
        refreshThemeCards();
        STORE.applyTheme(input.value);
        const next = readFormIntoSettings();
        current = STORE.set(next);
        toast(`Theme set to ${input.value === 'auto' ? 'Auto / System' : input.value === 'light' ? 'Light Mode' : 'Dark Mode'} ✓`, 'ok');
      });
    });
  }

  /* ════════════════════════════════════════════
     SAVE / RESET
  ════════════════════════════════════════════ */
  function wireSaveReset() {
    const doSave = () => {
      try {
        const next = readFormIntoSettings();
        current = STORE.set(next);
        markClean();
        toast('Settings saved ✓', 'ok');
      } catch (e) {
        toast('Could not save settings', 'err');
      }
    };

    $('sSaveBtn').addEventListener('click', doSave);

    const doReset = async () => {
      const ok = await confirmDialog('Reset all settings?', 'Every setting on this page will be restored to its default value. This does not affect your account, profile, or interview history.');
      if (!ok) return;
      current = STORE.reset();
      writeSettingsIntoForm(current);
      toast('Settings reset to defaults', 'ok');
    };

    $('sResetBtn').addEventListener('click', doReset);
    $('sResetAllBtn').addEventListener('click', doReset);
  }

  /* ════════════════════════════════════════════
     PRIVACY — DANGER ZONE ACTIONS
  ════════════════════════════════════════════ */
  function wireDangerZone() {
    $('sClearHistoryBtn').addEventListener('click', async () => {
      const ok = await confirmDialog('Clear interview history?', 'This permanently deletes every saved session from History, Analytics and Dashboard. This cannot be undone.');
      if (!ok) return;
      try {
        if (window.AIRC_DB) await window.AIRC_DB.dbClearAll();
        toast('Interview history cleared', 'ok');
        refreshDataCounts();
      } catch (e) {
        toast('Could not clear history', 'err');
      }
    });

    $('sClearStorageBtn').addEventListener('click', async () => {
      const ok = await confirmDialog('Clear local storage?', 'This clears cached preferences and chat assistant history on this device. Your login and account stay intact.');
      if (!ok) return;
      try {
        localStorage.removeItem(STORE.KEY);
        localStorage.removeItem('airc_chat_history_v1');
        current = STORE.get(); // back to defaults
        writeSettingsIntoForm(current);
        toast('Local storage cleared', 'ok');
      } catch (e) {
        toast('Could not clear local storage', 'err');
      }
    });

    $('sResetAccountBtn').addEventListener('click', async () => {
      const ok = await confirmDialog('Reset account?', 'This removes your local account and signs you out. You will need to register again.');
      if (!ok) return;
      window.AIRC_AUTH.resetLocalAccount();
      window.location.href = 'auth.html';
    });
  }

  /* ════════════════════════════════════════════
     DATA MANAGEMENT
  ════════════════════════════════════════════ */
  async function refreshDataCounts() {
    const el = $('sDataSessionCount');
    if (!el) return;
    try {
      const sessions = window.AIRC_DB ? await window.AIRC_DB.dbGetAllSessions() : [];
      el.textContent = `${sessions.length} interview session${sessions.length === 1 ? '' : 's'} saved on this device.`;
    } catch (e) {
      el.textContent = 'Unable to read session count.';
    }
  }

  function wireExport() {
    $('sExportSettingsBtn').addEventListener('click', () => {
      try {
        const data = JSON.stringify(current || STORE.get(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'airc-pro-settings.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast('Settings exported ✓', 'ok');
      } catch (e) {
        toast('Export failed', 'err');
      }
    });
  }

  /* ════════════════════════════════════════════
     ACCOUNT + PROFILE SUMMARY CARDS
  ════════════════════════════════════════════ */
  async function renderAccountAndProfile() {
    $('settingsUserBadge').textContent = username ? '◈ ' + username : '';
    $('sAccountName').textContent = username || 'Guest';

    let createdAt = null;
    try {
      const raw = localStorage.getItem('airc_user');
      if (raw) createdAt = JSON.parse(raw).createdAt;
    } catch (e) {}
    $('sAccountMeta').textContent = createdAt
      ? `Member since ${new Date(createdAt).toLocaleDateString()}`
      : 'Local account';

    if (window.AIRC_PLAN) {
      const plan = window.AIRC_PLAN.get();
      const badge = $('sAccountPlanBadge');
      badge.textContent = '◆ ' + window.AIRC_PLAN.label(plan).toUpperCase();
      badge.className = 'plan-badge ' + plan;
    }

    if (CORE) {
      $('sAccountAvatar').innerHTML = CORE.buildDefaultAvatarSvg(username || 'U');
    }

    // Profile summary (from the separate Profile System, read-only preview here)
    let profile = null;
    if (PDB && username) {
      try { profile = await PDB.dbGetProfile(username); } catch (e) {}
    }
    profile = profile || { fullName: username, skills: [], avatar: null };

    $('sProfileName').textContent = profile.fullName || username || 'Guest';
    const completion = CORE ? CORE.computeCompletion(profile) : 0;
    const skillCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    $('sProfileMeta').textContent = `${completion}% complete · ${skillCount} skill${skillCount === 1 ? '' : 's'} listed`;
    $('sProfileAvatar').innerHTML = profile.avatar
      ? `<img src="${profile.avatar}" alt="Profile photo" />`
      : (CORE ? CORE.buildDefaultAvatarSvg(profile.fullName || username || 'U') : '');
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    if (!STORE) { toast('Settings module unavailable', 'err'); return; }
    current = STORE.get();
    writeSettingsIntoForm(current);
    wireNav();
    wireDirtyTracking();
    wireThemeLivePreview();
    wireSaveReset();
    wireDangerZone();
    wireExport();
    renderAccountAndProfile();
    refreshDataCounts();

    // Warn before leaving with unsaved (non-theme) changes
    window.addEventListener('beforeunload', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
