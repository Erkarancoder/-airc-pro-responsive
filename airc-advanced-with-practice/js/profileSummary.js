/* ─────────────────────────────────────────────
   js/profileSummary.js — A.I.R.C. Pro
   Injects two small, purely-additive UI pieces into index.html
   at runtime (no existing markup is edited):
     1. A profile avatar link in the topbar (→ profile.html)
     2. A "Profile Summary" card at the top of the Dashboard tab
   Depends on: auth.js, db.js, js/profileCore.js, js/profileDb.js.
   Adds its OWN event listeners alongside index.js's — it never
   removes or replaces any existing listener or function.
───────────────────────────────────────────── */
(function () {
  'use strict';

  const CORE = window.AIRC_PROFILE_CORE;
  const PDB  = window.AIRC_PROFILE_DB;

  function injectTopbarLink() {
    const topbarRight = document.querySelector('.topbar-right');
    const logoutBtn   = topbarRight && topbarRight.querySelector('button[onclick*="logout"]');
    if (!topbarRight || document.getElementById('profileNavLink')) return;

    const link = document.createElement('a');
    link.href = 'profile.html';
    link.id = 'profileNavLink';
    link.className = 'profile-nav-link';
    link.title = 'My Profile';
    link.innerHTML = CORE ? CORE.buildDefaultAvatarSvg(window.AIRC_AUTH ? window.AIRC_AUTH.currentUser() : 'U') : '';

    if (logoutBtn) topbarRight.insertBefore(link, logoutBtn);
    else topbarRight.appendChild(link);
  }

  function buildSummaryCard() {
    const card = document.createElement('div');
    card.className = 'card dash-profile-card';
    card.id = 'dashProfileCard';
    card.innerHTML = `
      <div class="p-avatar-circle" id="dashProfileAvatar"></div>
      <div class="dash-profile-info">
        <div class="dash-profile-name" id="dashProfileName">—</div>
        <div class="dash-profile-meta" id="dashProfileMeta">Complete your profile to personalize your dashboard.</div>
        <div class="dash-profile-skills" id="dashProfileSkills"></div>
      </div>
      <div class="dash-profile-side">
        <span class="p-level-chip" id="dashProfileLevel">🌱 Beginner</span>
        <a href="profile.html" class="btn sm accent">Edit Profile</a>
      </div>
    `;
    return card;
  }

  function injectDashboardCard() {
    const dashGrid = document.querySelector('#tab-dashboard .dash-grid');
    if (!dashGrid || document.getElementById('dashProfileCard')) return;
    const card = buildSummaryCard();
    dashGrid.insertBefore(card, dashGrid.firstChild);
  }

  async function refreshDashboardCard() {
    if (!document.getElementById('dashProfileCard')) return;
    const username = window.AIRC_AUTH ? window.AIRC_AUTH.currentUser() : null;
    if (!username || !PDB || !CORE) return;

    let profile;
    try { profile = (await PDB.dbGetProfile(username)) || { username, fullName: username, skills: [] }; }
    catch (e) { profile = { username, fullName: username, skills: [] }; }

    const avatarEl = document.getElementById('dashProfileAvatar');
    avatarEl.innerHTML = profile.avatar
      ? `<img src="${profile.avatar}" alt="Profile photo" />`
      : CORE.buildDefaultAvatarSvg(profile.fullName || username);

    document.getElementById('dashProfileName').textContent = profile.fullName || username;

    let sessionCount = 0;
    try { if (window.AIRC_DB) sessionCount = (await window.AIRC_DB.dbGetAllSessions()).length; } catch (e) {}

    const completion = CORE.computeCompletion(profile);
    document.getElementById('dashProfileMeta').textContent =
      `${completion}% profile complete · ${sessionCount} interview${sessionCount === 1 ? '' : 's'} completed`;

    const skillsEl = document.getElementById('dashProfileSkills');
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    skillsEl.innerHTML = skills.length
      ? skills.slice(0, 6).map((s) => `<span class="dash-skill-pill">${s}</span>`).join('')
      : '<span class="dash-skill-pill" style="opacity:.6">Add skills on your profile</span>';

    const badge = CORE.computeLevelBadge(sessionCount);
    const levelEl = document.getElementById('dashProfileLevel');
    levelEl.textContent = `${badge.icon} ${badge.label}`;
    levelEl.className = `p-level-chip ${badge.id}`;

    // topbar avatar mirrors the current profile picture once loaded
    const navLink = document.getElementById('profileNavLink');
    if (navLink) {
      navLink.innerHTML = profile.avatar
        ? `<img src="${profile.avatar}" alt="Profile" />`
        : CORE.buildDefaultAvatarSvg(profile.fullName || username);
    }
  }

  function wireDashboardRefresh() {
    // Additive listener alongside index.js's own tab-click listener — does not replace it.
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'dashboard') refreshDashboardCard();
      });
    });
  }

  function init() {
    if (!window.AIRC_AUTH || !window.AIRC_AUTH.isLoggedIn()) return;
    injectTopbarLink();
    injectDashboardCard();
    refreshDashboardCard();
    wireDashboardRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
