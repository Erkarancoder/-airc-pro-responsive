/* ─────────────────────────────────────────────
   auth.js — A.I.R.C. Pro Authentication
   • Single account system (1 user only) for Email/Password
   • Login / Register / Logout
   • Session stored in sessionStorage (or localStorage if "Remember Me")
   • Credentials stored in localStorage
   • Optional Google / Facebook sign-in via Firebase Authentication
     (only activates if Firebase SDK + real project config are present;
     otherwise gracefully falls back to Email login — nothing breaks)
───────────────────────────────────────────── */
'use strict';

const AUTH_KEY    = 'airc_user';
const SESSION_KEY = 'airc_session';

/* ── Simple hash (FNV-1a 32-bit) for password ── */
function hashPassword(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

/* ─────────────────────────────────────────────
   OPTIONAL — Firebase config for social login.
   Replace the placeholder values below with your own
   Firebase project's web config to enable
   "Continue with Google" / "Continue with Facebook".
   Leave as-is (or remove) to keep Email/Password-only auth —
   the app works perfectly fine without it.
───────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:         "YOUR_PROJECT.firebaseapp.com",
  projectId:          "YOUR_PROJECT_ID",
  storageBucket:       "YOUR_PROJECT.appspot.com",
  messagingSenderId:   "YOUR_SENDER_ID",
  appId:               "YOUR_APP_ID"
};

function isFirebaseConfigured() {
  return !!(FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).startsWith('YOUR_'));
}

let _fbAuth  = null;
let _fbTried = false;

/* Lazily init Firebase only when needed, never throws */
function ensureFirebase() {
  if (_fbAuth) return _fbAuth;
  if (_fbTried) return null;
  _fbTried = true;
  try {
    if (typeof firebase === 'undefined' || !firebase.apps) return null; // SDK not loaded
    if (!isFirebaseConfigured()) return null;                            // not configured
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    _fbAuth = firebase.auth(app);
    return _fbAuth;
  } catch (e) {
    console.warn('[AIRC_AUTH] Firebase unavailable — falling back to Email login only.', e);
    return null;
  }
}

const AIRC_AUTH = {

  /* Check if an account exists */
  hasAccount() {
    return !!localStorage.getItem(AUTH_KEY);
  },

  /* Register — only allowed if NO account exists */
  register(username, password) {
    if (this.hasAccount()) {
      return { ok: false, msg: 'An account already exists. Only one account is allowed.' };
    }
    if (!username || username.trim().length < 3) {
      return { ok: false, msg: 'Username must be at least 3 characters.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, msg: 'Password must be at least 6 characters.' };
    }
    const user = {
      username: username.trim(),
      passHash: hashPassword(password),
      createdAt: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this._startSession(user.username);
    return { ok: true };
  },

  /* Login — remember=true persists the session across browser restarts */
  login(username, password, remember) {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { ok: false, msg: 'No account found. Please register first.' };
    const user = JSON.parse(raw);
    if (user.username.toLowerCase() !== username.trim().toLowerCase()) {
      return { ok: false, msg: 'Incorrect username or password.' };
    }
    if (user.passHash !== hashPassword(password)) {
      return { ok: false, msg: 'Incorrect username or password.' };
    }
    this._startSession(user.username, remember);
    return { ok: true };
  },

  /* Logout */
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'auth.html';
  },

  /* Check if logged in (session OR remembered login) */
  isLoggedIn() {
    return !!(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY));
  },

  /* Get current username */
  currentUser() {
    return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || null;
  },

  /* Guard — call from index.html to redirect if not logged in */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'auth.html';
    }
  },

  /* Reset the local account (used by "Forgot Password" flow) */
  resetLocalAccount() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  },

  /* ── Social login availability (true only if Firebase SDK + config are present) ── */
  isGoogleAvailable() {
    return !!ensureFirebase() && typeof firebase.auth.GoogleAuthProvider === 'function';
  },
  isFacebookAvailable() {
    return !!ensureFirebase() && typeof firebase.auth.FacebookAuthProvider === 'function';
  },

  /* ── Continue with Google ── */
  async loginWithGoogle(remember) {
    const auth = ensureFirebase();
    if (!auth) {
      return { ok: false, fallback: true, msg: 'Google sign-in isn\u2019t set up yet — continue with email below.' };
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result   = await auth.signInWithPopup(provider);
      const name      = (result.user && (result.user.displayName || result.user.email)) || 'Google User';
      this._startSession(name, remember);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e && e.message ? e.message : 'Google sign-in failed. Please try again.' };
    }
  },

  /* ── Continue with Facebook ── */
  async loginWithFacebook(remember) {
    const auth = ensureFirebase();
    if (!auth) {
      return { ok: false, fallback: true, msg: 'Facebook sign-in isn\u2019t set up yet — continue with email below.' };
    }
    try {
      const provider = new firebase.auth.FacebookAuthProvider();
      const result   = await auth.signInWithPopup(provider);
      const name      = (result.user && (result.user.displayName || result.user.email)) || 'Facebook User';
      this._startSession(name, remember);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e && e.message ? e.message : 'Facebook sign-in failed. Please try again.' };
    }
  },

  /* Internal — remember=true stores in localStorage (persists), else sessionStorage (tab-only) */
  _startSession(username, remember) {
    if (remember) {
      localStorage.setItem(SESSION_KEY, username);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, username);
      localStorage.removeItem(SESSION_KEY);
    }
  }
};

window.AIRC_AUTH = AIRC_AUTH;
