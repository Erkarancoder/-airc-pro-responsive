/* ─────────────────────────────────────────────
   js/practicePresence.js — A.I.R.C. Pro · Practice module ONLY
   Right-side "Member Panel" — real, dynamic presence tracking.

   • NO fixed member count/limit — reads however many real sessions
     are actually active right now (1, 5, 50, 500 — whatever it is).
   • Every logged-in user who opens the Practice page registers a
     real presence record (username, real name, real profile photo)
     via a heartbeat, so the list/count update live.
   • Reuses the EXISTING account/profile data only (AIRC_AUTH +
     AIRC_PROFILE_DB / AIRC_PROFILE_CORE) — no fake/demo users are
     ever generated. Nothing here touches auth, sessions, reports,
     or any other AIRC page/feature.

   HOW "active" is detected (fully client-side, no server required):
   Each open Practice tab writes a small heartbeat record (its own
   username + real name + real avatar + a "last seen" timestamp)
   into a single shared localStorage key. Every browser tab/window
   on this device that has the Practice page open is picked up
   instantly via the native `storage` event; stale records (tab
   closed / heartbeat stopped) automatically expire and disappear
   from the list within a few seconds — nothing is ever hardcoded.

   Note: because this build's login system is intentionally a
   single-account client-side system with no backend/database
   (see auth.js), this panel accurately reflects every REAL active
   Practice session on THIS device/browser. Showing separate
   students who log in from other devices at the same time would
   require a real multi-user backend (e.g. Firebase / a server +
   database) wired into auth.js — this file is written so that,
   the moment such a backend exists, only the two small marked
   spots below (readIdentity / writeHeartbeat) need to point at it
   instead of localStorage — the rest of the panel needs no change.
───────────────────────────────────────────── */
'use strict';

(function () {
  const PRESENCE_KEY   = 'airc_practice_presence_v1';
  const SESSION_ID_KEY = 'airc_practice_session_id';
  const HEARTBEAT_MS   = 4000;   // how often this tab announces "still here"
  const STALE_MS        = 12000; // if no heartbeat for this long, tab is treated as gone

  let identity   = null;  // { username, name, avatarUrl }
  let sessionId  = null;
  let heartbeatTimer = null;
  let renderTimer    = null;

  /* ── unique id per browser tab (survives reloads of the same tab, not shared across tabs) ── */
  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : ('sess_' + Date.now() + '_' + Math.random().toString(16).slice(2));
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  }

  /* ── read the REAL logged-in identity for this tab (name + photo) ──
     Single integration point — swap for a real backend call later
     without touching anything else in this file. */
  async function readIdentity() {
    let username = null;
    try {
      username = (window.AIRC_AUTH && AIRC_AUTH.currentUser) ? AIRC_AUTH.currentUser() : null;
    } catch (e) { /* ignore */ }
    if (!username) return null;

    let fullName  = username;
    let avatarUrl = null;
    try {
      if (window.AIRC_PROFILE_DB && AIRC_PROFILE_DB.dbGetProfile) {
        const profile = await AIRC_PROFILE_DB.dbGetProfile(username);
        if (profile) {
          if (profile.fullName && profile.fullName.trim()) fullName = profile.fullName.trim();
          if (profile.avatar) avatarUrl = profile.avatar; // real uploaded photo (data URL), if set in Profile Edit
        }
      }
    } catch (e) {
      console.warn('[practicePresence] Could not read profile for presence:', e);
    }
    if (!fullName && username.includes('@')) fullName = username.split('@')[0];

    return { username, name: fullName, avatarUrl };
  }

  /* ── safe read/write of the shared presence map ── */
  function readPresenceMap() {
    try {
      const raw = localStorage.getItem(PRESENCE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writePresenceMap(map) {
    try {
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('[practicePresence] Could not persist presence:', e);
    }
  }

  /* ── announce "still active" for this tab/session ── */
  function writeHeartbeat() {
    if (!identity) return;
    const map = readPresenceMap();
    map[sessionId] = {
      username: identity.username,
      name: identity.name,
      avatarUrl: identity.avatarUrl || null,
      lastSeen: Date.now()
    };
    writePresenceMap(map);
    render();
  }

  /* ── remove this tab's own record (called on tab close) ── */
  function removeSelf() {
    const map = readPresenceMap();
    if (map[sessionId]) {
      delete map[sessionId];
      writePresenceMap(map);
    }
  }

  /* ── drop anyone whose heartbeat has gone stale, return the live list ── */
  function getActiveMembers() {
    const map  = readPresenceMap();
    const now  = Date.now();
    let changed = false;
    const bySession = [];

    Object.keys(map).forEach((sid) => {
      const rec = map[sid];
      if (!rec || (now - rec.lastSeen) > STALE_MS) {
        delete map[sid];
        changed = true;
      } else {
        bySession.push(rec);
      }
    });
    if (changed) writePresenceMap(map);

    // De-duplicate by username: the same real student open in two tabs
    // still counts once — "actual number of users", not tabs.
    const byUser = new Map();
    bySession.forEach((rec) => {
      const existing = byUser.get(rec.username);
      if (!existing || rec.lastSeen > existing.lastSeen) byUser.set(rec.username, rec);
    });

    return Array.from(byUser.values()).sort((a, b) => {
      if (identity) {
        if (a.username === identity.username) return -1;
        if (b.username === identity.username) return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /* ── avatar markup: real uploaded photo if present, else initials avatar ── */
  function buildAvatarMarkup(name, avatarUrl) {
    if (avatarUrl) {
      const safeName = String(name || 'User').replace(/"/g, '&quot;');
      return `<img class="pz-member-avatar" src="${avatarUrl}" alt="${safeName}" />`;
    }
    if (window.AIRC_PROFILE_CORE && AIRC_PROFILE_CORE.buildDefaultAvatarSvg) {
      return `<span class="pz-member-avatar">${AIRC_PROFILE_CORE.buildDefaultAvatarSvg(name)}</span>`;
    }
    // minimal local fallback if profileCore.js hasn't loaded yet
    const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
    return `<span class="pz-member-avatar" style="display:flex;align-items:center;justify-content:center;background:#4f6df5;color:#fff;font-weight:700;font-size:13px;">${initial}</span>`;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ── render the panel from the current live member list ── */
  function render() {
    const countEl = document.getElementById('pzMembersCount');
    const listEl  = document.getElementById('pzMembersList');
    if (!countEl || !listEl) return;

    const members = getActiveMembers();
    const n = members.length;
    countEl.textContent = `${n} Member${n === 1 ? '' : 's'}`;

    if (!n) {
      listEl.innerHTML = '<div class="pz-members-empty">No one active in Practice right now.</div>';
      return;
    }

    listEl.innerHTML = members.map((m) => {
      const isSelf = identity && m.username === identity.username;
      return `
        <div class="pz-member-row${isSelf ? ' pz-member-self' : ''}">
          <div class="pz-member-avatar-wrap">
            ${buildAvatarMarkup(m.name, m.avatarUrl)}
            <span class="pz-member-status-dot" title="Online"></span>
          </div>
          <div class="pz-member-info">
            <div class="pz-member-name">
              <span class="pz-member-ico">👤</span><span class="pz-member-name-text">${escapeHtml(m.name)}</span>${isSelf ? '<span class="pz-member-you-tag">You</span>' : ''}
            </div>
            <div class="pz-member-sub">🟢 Active in Practice</div>
          </div>
        </div>`;
    }).join('');
  }

  async function init() {
    identity  = await readIdentity();
    sessionId = getSessionId();
    if (!identity) { render(); return; }

    writeHeartbeat();
    heartbeatTimer = setInterval(writeHeartbeat, HEARTBEAT_MS);
    // Even with no new heartbeats arriving, re-check every couple of
    // seconds so entries from tabs that crashed/lost network still expire.
    renderTimer = setInterval(render, 2000);

    // Instant updates the moment another tab/window on this device joins or leaves.
    window.addEventListener('storage', (e) => {
      if (e.key === PRESENCE_KEY) render();
    });

    // Leave cleanly when this tab is closed/navigated away.
    window.addEventListener('pagehide', removeSelf);
    window.addEventListener('beforeunload', removeSelf);

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
