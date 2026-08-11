/* ─────────────────────────────────────────────
   js/profileDb.js — A.I.R.C. Pro
   IndexedDB wrapper for the User Profile System.

   Uses its OWN database ('airc_pro_profile_db'), completely
   separate from db.js's 'airc_pro_db' (sessions store) — this
   means the existing session storage/reporting logic is never
   touched or put at risk by adding the profile feature.

   Profiles are keyed by the logged-in username (from AIRC_AUTH),
   so the correct profile is automatically loaded on every login.
───────────────────────────────────────────── */
'use strict';

const PROFILE_DB_NAME = 'airc_pro_profile_db';
const PROFILE_DB_VER   = 1;
const PROFILE_STORE    = 'profiles';

function openProfileDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PROFILE_DB_NAME, PROFILE_DB_VER);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'username' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Fetch the stored profile for a username, or null if none exists yet */
async function dbGetProfile(username) {
  if (!username) return null;
  const db = await openProfileDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(PROFILE_STORE, 'readonly');
    const store = tx.objectStore(PROFILE_STORE);
    const req   = store.get(username);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

/** Create or fully overwrite the profile for a username */
async function dbSaveProfile(profile) {
  if (!profile || !profile.username) throw new Error('Profile requires a username');
  const db = await openProfileDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(PROFILE_STORE, 'readwrite');
    const store = tx.objectStore(PROFILE_STORE);
    const req   = store.put({ ...profile, updatedAt: Date.now() });
    req.onsuccess = () => resolve(profile);
    req.onerror   = () => reject(req.error);
  });
}

/** Remove a stored profile entirely (not used by the UI by default, exposed for completeness) */
async function dbDeleteProfile(username) {
  const db = await openProfileDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(PROFILE_STORE, 'readwrite');
    const store = tx.objectStore(PROFILE_STORE);
    const req   = store.delete(username);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

window.AIRC_PROFILE_DB = { dbGetProfile, dbSaveProfile, dbDeleteProfile };
