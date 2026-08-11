/* ─────────────────────────────────────────────
   js/aiTutor.js — AIRC Practice / AI Communication Coach
   (rebuilt — replaces the old placeholder subject-card UI)

   Responsibilities only:
     - Greet the logged-in user (reuses AIRC_PROFILE_DB, read-only)
     - Sidebar navigation + view switching between:
         Home (3 practice cards) / Communication / GD / Interview
     - Global voice-speed control (applies to AIRC_VOICE_SERVICE)
     - Delegates all session logic to:
         AIRC_COMMUNICATION_PRACTICE / AIRC_GD_PRACTICE / AIRC_INTERVIEW_PRACTICE

   Does not touch any existing AIRC interview/resume code,
   APIs, database schema, or routes.
───────────────────────────────────────────── */
'use strict';

(function () {
  const VIEWS = ['home', 'communication', 'gd', 'interview'];
  let activeView = 'home';

  function showView(view) {
    if (!VIEWS.includes(view)) view = 'home';

    // Tear down whichever session view we're leaving
    if (activeView === 'communication' && window.AIRC_COMMUNICATION_PRACTICE) window.AIRC_COMMUNICATION_PRACTICE.teardown();
    if (activeView === 'gd' && window.AIRC_GD_PRACTICE) window.AIRC_GD_PRACTICE.teardown();
    if (activeView === 'interview' && window.AIRC_INTERVIEW_PRACTICE) window.AIRC_INTERVIEW_PRACTICE.teardown();

    VIEWS.forEach((v) => {
      const el = document.getElementById('pzView-' + v);
      if (el) el.classList.toggle('pz-view-active', v === view);
    });

    document.querySelectorAll('.pz-nav-item[data-view]').forEach((item) => {
      item.classList.toggle('pz-nav-active', item.dataset.view === view);
    });

    activeView = view;

    if (view === 'communication' && window.AIRC_COMMUNICATION_PRACTICE) window.AIRC_COMMUNICATION_PRACTICE.init();
    if (view === 'gd' && window.AIRC_GD_PRACTICE) window.AIRC_GD_PRACTICE.init();
    if (view === 'interview' && window.AIRC_INTERVIEW_PRACTICE) window.AIRC_INTERVIEW_PRACTICE.init();

    const main = document.querySelector('.pz-main');
    if (main) main.scrollTop = 0;
  }

  /* ── Greet with the logged-in user's name (read-only, same pattern as before) ── */
  async function greetUser() {
    let displayName = 'there';
    try {
      const username = window.AIRC_AUTH && AIRC_AUTH.currentUser ? AIRC_AUTH.currentUser() : null;
      if (username && window.AIRC_PROFILE_DB && AIRC_PROFILE_DB.dbGetProfile) {
        const profile = await AIRC_PROFILE_DB.dbGetProfile(username);
        if (profile && profile.fullName) {
          displayName = profile.fullName.trim().split(/\s+/)[0];
        } else if (username.includes('@')) {
          displayName = username.split('@')[0];
        } else if (username) {
          displayName = username;
        }
      }
    } catch (e) {
      console.warn('[aiTutor] Could not load profile name:', e);
    }
    const heroName = document.getElementById('pzHeroName');
    if (heroName) heroName.textContent = displayName;
    const badge = document.getElementById('pzUserBadge');
    if (badge) badge.textContent = displayName;
  }

  function initSidebarNav() {
    document.querySelectorAll('.pz-nav-item[data-view]').forEach((item) => {
      item.addEventListener('click', () => showView(item.dataset.view));
    });
    document.querySelectorAll('[data-nav="home"]').forEach((el) => {
      el.addEventListener('click', () => { window.location.href = 'index.html'; });
    });
    document.querySelectorAll('[data-nav="profile"]').forEach((el) => {
      el.addEventListener('click', () => { window.location.href = 'profile.html'; });
    });
  }

  function initHomeCards() {
    document.querySelectorAll('.pz-card[data-open]').forEach((card) => {
      const btn = card.querySelector('.pz-card-btn');
      const open = () => showView(card.dataset.open);
      if (btn) btn.addEventListener('click', open);
    });
  }

  function initVoiceSpeed() {
    const select = document.getElementById('pzVoiceSpeed');
    if (!select) return;
    select.value = String(window.AIRC_VOICE_SERVICE.getRate());
    select.addEventListener('change', () => {
      window.AIRC_VOICE_SERVICE.setRate(select.value);
    });
  }

  function initBackButtons() {
    document.querySelectorAll('[data-back-home]').forEach((btn) => {
      btn.addEventListener('click', () => showView('home'));
    });
  }

  /* ── Mobile / tablet off-canvas drawers (sidebar + member panel) ──
     Desktop layout / functionality is untouched; this only toggles
     CSS classes that matter under the ≤1024px media queries. */
  function initResponsiveDrawers() {
    const sidebar = document.getElementById('pzSidebar');
    const membersPanel = document.getElementById('pzMembersPanel');
    const overlay = document.getElementById('pzOverlay');
    const hamburgerBtn = document.getElementById('pzHamburgerBtn');
    const sidebarCloseBtn = document.getElementById('pzSidebarCloseBtn');
    const membersToggleBtn = document.getElementById('pzMembersToggleBtn');
    const membersCloseBtn = document.getElementById('pzMembersCloseBtn');
    if (!sidebar || !membersPanel || !overlay) return;

    function closeAll() {
      sidebar.classList.remove('pz-sidebar-open');
      membersPanel.classList.remove('pz-members-open');
      overlay.classList.remove('pz-overlay-active');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
      if (membersToggleBtn) membersToggleBtn.setAttribute('aria-expanded', 'false');
    }

    function openSidebar() {
      membersPanel.classList.remove('pz-members-open');
      sidebar.classList.add('pz-sidebar-open');
      overlay.classList.add('pz-overlay-active');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
      if (membersToggleBtn) membersToggleBtn.setAttribute('aria-expanded', 'false');
    }

    function openMembers() {
      sidebar.classList.remove('pz-sidebar-open');
      membersPanel.classList.add('pz-members-open');
      overlay.classList.add('pz-overlay-active');
      if (membersToggleBtn) membersToggleBtn.setAttribute('aria-expanded', 'true');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    }

    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('pz-sidebar-open')) closeAll();
        else openSidebar();
      });
    }
    if (membersToggleBtn) {
      membersToggleBtn.addEventListener('click', () => {
        if (membersPanel.classList.contains('pz-members-open')) closeAll();
        else openMembers();
      });
    }
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeAll);
    if (membersCloseBtn) membersCloseBtn.addEventListener('click', closeAll);
    overlay.addEventListener('click', closeAll);

    // Selecting a nav item or going back should close the drawer on mobile
    document.querySelectorAll('.pz-nav-item[data-view], [data-nav], [data-back-home]').forEach((el) => {
      el.addEventListener('click', closeAll);
    });

    // If the viewport grows past the tablet/phone breakpoint, make sure
    // the drawers reset so the desktop layout is never left mid-transition.
    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const handleBreakpointChange = (e) => { if (e.matches) closeAll(); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleBreakpointChange);
    else if (desktopQuery.addListener) desktopQuery.addListener(handleBreakpointChange);
  }

  /* Mirror the live member count ("N Members") onto the compact mobile
     toggle button, without modifying practicePresence.js. */
  function initMobileMemberCountSync() {
    const source = document.getElementById('pzMembersCount');
    const target = document.getElementById('pzMobileMembersCount');
    if (!source || !target) return;
    const sync = () => {
      const match = source.textContent.match(/\d+/);
      target.textContent = match ? match[0] : source.textContent.trim();
    };
    sync();
    new MutationObserver(sync).observe(source, { childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    greetUser();
    initSidebarNav();
    initHomeCards();
    initVoiceSpeed();
    initBackButtons();
    initResponsiveDrawers();
    initMobileMemberCountSync();
    showView('home');
  });
})();
