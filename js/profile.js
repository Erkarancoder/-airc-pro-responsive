/* ─────────────────────────────────────────────
   js/profile.js — A.I.R.C. Pro
   Controller for profile.html (the User Profile page).
   Depends on: auth.js, db.js, js/profileCore.js, js/profileDb.js.
   Fully self-contained — does not read/write any global used by
   index.js, dashboard.js, or any other existing module.
───────────────────────────────────────────── */
(function () {
  'use strict';

  const CORE = window.AIRC_PROFILE_CORE;
  const PDB  = window.AIRC_PROFILE_DB;

  const username = window.AIRC_AUTH ? window.AIRC_AUTH.currentUser() : null;

  let profile = null;       // last-saved state (source of truth when cancelling)
  let draftSkills = [];     // working copy of skills while editing
  let isEditing = false;

  const $ = (id) => document.getElementById(id);

  const els = {
    avatarCircle: $('pAvatarCircle'),
    avatarInput: $('pAvatarInput'),
    avatarEditBtn: $('pAvatarEditBtn'),
    changePhotoBtn: $('pChangePhotoBtn'),
    removePhotoBtn: $('pRemovePhotoBtn'),
    heroName: $('pHeroName'),
    heroEmail: $('pHeroEmail'),
    levelChip: $('pLevelChip'),
    completionPct: $('pCompletionPct'),
    completionFill: $('pCompletionFill'),
    editBtn: $('pEditBtn'),
    saveBtn: $('pSaveBtn'),
    cancelBtn: $('pCancelBtn'),
    banner: $('pMsgBanner'),
    userBadge: $('profileUserBadge'),
    skillsBox: $('pSkillsBox'),
    skillsEntry: $('inSkillsEntry'),
    bioCount: $('pBioCount'),
  };

  const FIELD_INPUTS = {
    fullName: 'inFullName', email: 'inEmail', phone: 'inPhone',
    college: 'inCollege', degree: 'inDegree', branch: 'inBranch', gradYear: 'inGradYear',
    bio: 'inBio', github: 'inGithub', linkedin: 'inLinkedin', portfolio: 'inPortfolio',
  };

  function defaultProfile() {
    return {
      username, fullName: username || '', email: '', phone: '',
      college: '', degree: '', branch: '', gradYear: '',
      skills: [], bio: '', github: '', linkedin: '', portfolio: '',
      avatar: null,
    };
  }

  /* ════════════════════════════════════════════
     TOAST + BANNER (self-contained; reuses .toast CSS from index.css)
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

  function showBanner(msg, type) {
    els.banner.textContent = msg;
    els.banner.className = `p-msg-banner show ${type}`;
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => els.banner.classList.remove('show'), 4000);
  }

  /* ════════════════════════════════════════════
     AVATAR
  ════════════════════════════════════════════ */
  function renderAvatar() {
    els.avatarCircle.innerHTML = profile.avatar
      ? `<img src="${profile.avatar}" alt="Profile photo" />`
      : CORE.buildDefaultAvatarSvg(profile.fullName || username || 'User');
  }

  async function handleAvatarFile(file) {
    try {
      const dataUrl = await CORE.compressImageFile(file, 320, 0.72);
      profile.avatar = dataUrl;
      renderAvatar();
      await PDB.dbSaveProfile(profile);
      toast('Profile photo updated', 'ok');
      renderCompletion();
    } catch (e) {
      toast(e.message || 'Could not update photo', 'err');
    }
  }

  async function removeAvatar() {
    profile.avatar = null;
    renderAvatar();
    try {
      await PDB.dbSaveProfile(profile);
      toast('Profile photo removed', 'ok');
    } catch (e) { /* non-fatal */ }
    renderCompletion();
  }

  /* ════════════════════════════════════════════
     SKILLS TAG INPUT
  ════════════════════════════════════════════ */
  function renderSkillChips() {
    els.skillsBox.querySelectorAll('.p-skill-chip').forEach((c) => c.remove());
    draftSkills.forEach((skill, i) => {
      const chip = document.createElement('span');
      chip.className = 'p-skill-chip';
      chip.innerHTML = `${escapeHtml(skill)} <button type="button" aria-label="Remove ${escapeHtml(skill)}">✕</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        if (!isEditing) return;
        draftSkills.splice(i, 1);
        renderSkillChips();
      });
      els.skillsBox.insertBefore(chip, els.skillsEntry);
    });
  }

  function addSkillFromInput() {
    const raw = els.skillsEntry.value;
    const parts = CORE.parseSkillsInput(raw);
    parts.forEach((p) => { if (!draftSkills.includes(p)) draftSkills.push(p); });
    els.skillsEntry.value = '';
    renderSkillChips();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ════════════════════════════════════════════
     RENDERING
  ════════════════════════════════════════════ */
  function renderHero() {
    els.heroName.textContent = profile.fullName || username || 'Your Name';
    els.heroEmail.textContent = profile.email || 'No email set yet';
  }

  async function renderLevelBadge() {
    let count = 0;
    try {
      if (window.AIRC_DB) count = (await window.AIRC_DB.dbGetAllSessions()).length;
    } catch (e) { count = 0; }
    const badge = CORE.computeLevelBadge(count);
    els.levelChip.textContent = `${badge.icon} ${badge.label}`;
    els.levelChip.className = `p-level-chip ${badge.id}`;
  }

  function renderCompletion() {
    const pct = CORE.computeCompletion({ ...profile, skills: draftSkills.length ? draftSkills : profile.skills });
    els.completionPct.textContent = pct + '%';
    els.completionFill.style.width = pct + '%';
  }

  function renderFields() {
    Object.entries(FIELD_INPUTS).forEach(([key, id]) => { $(id).value = profile[key] || ''; });
    els.bioCount.textContent = String(($('inBio').value || '').length);
    draftSkills = Array.isArray(profile.skills) ? profile.skills.slice() : [];
    renderSkillChips();
  }

  function clearFieldErrors() {
    document.querySelectorAll('.p-field').forEach((f) => {
      f.classList.remove('has-error');
      const errEl = f.querySelector('.p-error');
      if (errEl) errEl.textContent = '';
    });
  }

  function applyFieldErrors(errors) {
    clearFieldErrors();
    const fieldElMap = {
      fullName: 'fFullName', email: 'fEmail', phone: 'fPhone', gradYear: 'fGradYear',
      github: 'fGithub', linkedin: 'fLinkedin', portfolio: 'fPortfolio', bio: 'fBio',
    };
    Object.entries(errors).forEach(([key, msg]) => {
      const wrapId = fieldElMap[key];
      if (!wrapId) return;
      const wrap = $(wrapId);
      wrap.classList.add('has-error');
      const errEl = wrap.querySelector('.p-error');
      if (errEl) errEl.textContent = msg;
    });
  }

  /* ════════════════════════════════════════════
     EDIT MODE
  ════════════════════════════════════════════ */
  function setInputsDisabled(disabled) {
    Object.values(FIELD_INPUTS).forEach((id) => { $(id).disabled = disabled; });
    els.skillsEntry.disabled = disabled;
  }

  function enterEditMode() {
    isEditing = true;
    setInputsDisabled(false);
    els.editBtn.style.display = 'none';
    els.saveBtn.style.display = '';
    els.cancelBtn.style.display = '';
    $('inFullName').focus();
  }

  function exitEditMode() {
    isEditing = false;
    setInputsDisabled(true);
    els.editBtn.style.display = '';
    els.saveBtn.style.display = 'none';
    els.cancelBtn.style.display = 'none';
  }

  function cancelEdit() {
    clearFieldErrors();
    renderFields();
    renderCompletion();
    exitEditMode();
  }

  function gatherFormData() {
    const data = { ...profile };
    Object.entries(FIELD_INPUTS).forEach(([key, id]) => { data[key] = $(id).value.trim(); });
    if (els.skillsEntry.value.trim()) addSkillFromInput();
    data.skills = draftSkills.slice();
    return data;
  }

  async function saveProfile() {
    const data = gatherFormData();
    const { valid, errors } = CORE.validateProfile(data);
    if (!valid) {
      applyFieldErrors(errors);
      showBanner('Please fix the highlighted fields before saving.', 'err');
      toast('Please fix the highlighted fields', 'err');
      return;
    }
    clearFieldErrors();

    ['github', 'linkedin', 'portfolio'].forEach((k) => {
      if (data[k]) data[k] = CORE.normalizeUrl(data[k]);
    });

    profile = { ...profile, ...data, username };
    try {
      await PDB.dbSaveProfile(profile);
      renderHero();
      renderCompletion();
      exitEditMode();
      showBanner('Profile saved successfully!', 'ok');
      toast('Profile saved', 'ok');
    } catch (e) {
      showBanner('Could not save profile — please try again.', 'err');
      toast('Save failed', 'err');
    }
  }

  /* ════════════════════════════════════════════
     WIRE UP EVENTS
  ════════════════════════════════════════════ */
  function wireEvents() {
    els.editBtn.addEventListener('click', enterEditMode);
    els.saveBtn.addEventListener('click', saveProfile);
    els.cancelBtn.addEventListener('click', cancelEdit);

    els.avatarEditBtn.addEventListener('click', () => els.avatarInput.click());
    els.changePhotoBtn.addEventListener('click', () => els.avatarInput.click());
    els.removePhotoBtn.addEventListener('click', removeAvatar);
    els.avatarInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleAvatarFile(file);
      e.target.value = '';
    });

    els.skillsEntry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addSkillFromInput();
      }
    });
    els.skillsBox.addEventListener('click', (e) => {
      if (e.target === els.skillsBox && isEditing) els.skillsEntry.focus();
    });

    $('inBio').addEventListener('input', () => {
      els.bioCount.textContent = String($('inBio').value.length);
      renderCompletion();
    });

    Object.values(FIELD_INPUTS).forEach((id) => {
      $(id).addEventListener('input', renderCompletion);
    });

    // Numeric-only gentle guard on graduation year, without blocking paste/typing harshly
    $('inGradYear').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
    });

    document.querySelector('#pProfileForm').addEventListener('submit', (e) => e.preventDefault());
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  async function init() {
    if (!username) return; // auth guard in <head> already redirects; extra safety
    if (els.userBadge) els.userBadge.textContent = '◈ ' + username;

    try {
      profile = (PDB && await PDB.dbGetProfile(username)) || defaultProfile();
    } catch (e) {
      profile = defaultProfile();
    }
    if (!profile.fullName) profile.fullName = username;

    renderHero();
    renderAvatar();
    renderFields();
    renderCompletion();
    await renderLevelBadge();
    exitEditMode();
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
