/* ─────────────────────────────────────────────
   db.js  —  IndexedDB wrapper for A.I.R.C. Pro
   Stores sessions permanently across page reloads.
───────────────────────────────────────────── */
'use strict';

const DB_NAME = 'airc_pro_db';
const DB_VER  = 1;
const STORE   = 'sessions';

// Open / upgrade DB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('startedAt', 'startedAt', { unique: false });
        store.createIndex('category',  'category',  { unique: false });
        store.createIndex('score',     'score',     { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ── CRUD ──

/** Save a new session, returns the generated id */
async function dbSaveSession(session) {
  const db    = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.add({ ...session, savedAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Get all sessions ordered newest-first */
async function dbGetAllSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.getAll();
    req.onsuccess = () => resolve([...req.result].reverse());
    req.onerror   = () => reject(req.error);
  });
}

/** Get one session by id */
async function dbGetSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Delete one session by id */
async function dbDeleteSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Delete all sessions */
async function dbClearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// Expose globally
window.AIRC_DB = { dbSaveSession, dbGetAllSessions, dbGetSession, dbDeleteSession, dbClearAll };
