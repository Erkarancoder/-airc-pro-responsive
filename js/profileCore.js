/* ─────────────────────────────────────────────
   js/profileCore.js — A.I.R.C. Pro
   Shared, framework-free helpers for the User Profile System:
   field schema, validation, completion %, skill-level badges,
   initials-avatar generation, and client-side image compression.

   Consumed by js/profile.js (full Profile page) and
   js/profileSummary.js (Dashboard summary card) so the logic
   lives in exactly one place.
───────────────────────────────────────────── */
'use strict';

const PROFILE_FIELDS = [
  { key: 'fullName',  label: 'Full Name',              required: true  },
  { key: 'email',     label: 'Email',                  required: true  },
  { key: 'phone',     label: 'Phone Number',           required: false },
  { key: 'college',   label: 'College / University',   required: false },
  { key: 'degree',    label: 'Degree',                 required: false },
  { key: 'branch',    label: 'Branch / Department',    required: false },
  { key: 'gradYear',  label: 'Graduation Year',        required: false },
  { key: 'skills',    label: 'Skills',                 required: false },
  { key: 'bio',       label: 'Bio / About Me',         required: false },
  { key: 'github',    label: 'GitHub Profile',         required: false },
  { key: 'linkedin',  label: 'LinkedIn Profile',       required: false },
  { key: 'portfolio', label: 'Portfolio Website',      required: false },
  { key: 'avatar',    label: 'Profile Picture',        required: false },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const YEAR_RE  = /^(19[5-9]\d|20[0-4]\d|2050)$/;
const URL_RE   = /^https?:\/\/[^\s]+\.[^\s]+$/i;

/** Normalizes a bare domain/handle into a full https:// URL when possible */
function normalizeUrl(value) {
  if (!value) return '';
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return 'https://' + v.replace(/^\/+/, '');
}

/** Validates a profile object. Returns { valid, errors } where errors is keyed by field name. */
function validateProfile(data) {
  const errors = {};

  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Full name looks too short.';
  } else if (!/^[a-zA-Z\u00C0-\u024F' .-]{2,60}$/.test(data.fullName.trim())) {
    errors.fullName = 'Use letters, spaces, hyphens or apostrophes only.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(data.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (data.phone && data.phone.trim() && !PHONE_RE.test(data.phone.trim())) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (data.gradYear && String(data.gradYear).trim() && !YEAR_RE.test(String(data.gradYear).trim())) {
    errors.gradYear = 'Enter a valid 4-digit year (1950–2050).';
  }

  ['github', 'linkedin', 'portfolio'].forEach((key) => {
    const v = data[key] && data[key].trim();
    if (v && !URL_RE.test(normalizeUrl(v))) {
      errors[key] = 'Enter a valid URL (e.g. https://…).';
    }
  });

  if (data.bio && data.bio.length > 400) {
    errors.bio = 'Bio must be 400 characters or fewer.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** % of profile fields that are filled in (0–100) */
function computeCompletion(data) {
  if (!data) return 0;
  let filled = 0;
  PROFILE_FIELDS.forEach((f) => {
    const v = data[f.key];
    if (Array.isArray(v) ? v.length : (v && String(v).trim())) filled++;
  });
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

/** Skill-level badge derived from number of completed interview sessions */
function computeLevelBadge(sessionCount) {
  const n = sessionCount || 0;
  if (n >= 15) return { id: 'advanced',     label: 'Advanced',     icon: '🚀' };
  if (n >= 5)  return { id: 'intermediate', label: 'Intermediate', icon: '📈' };
  return              { id: 'beginner',     label: 'Beginner',     icon: '🌱' };
}

/** Up to 2 uppercase initials from a name (falls back to "U") */
function getInitials(name) {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join('');
}

/** Deterministic accent-pair gradient index from a string, so the same user always gets the same colors */
function initialsGradient(seed) {
  const gradients = [
    ['#00ddb4', '#00aaff'],
    ['#00aaff', '#7c5cff'],
    ['#ff9f43', '#ff4757'],
    ['#7c5cff', '#ff4757'],
    ['#00ddb4', '#7c5cff'],
  ];
  let h = 0;
  for (let i = 0; i < (seed || '').length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

/** Builds a data-URL-free "default avatar" as inline SVG markup (initials on a gradient circle) */
function buildDefaultAvatarSvg(name) {
  const initials = getInitials(name);
  const [c1, c2] = initialsGradient(name || 'AIRC');
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Default avatar">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#g)"/>
      <text x="50" y="58" font-family="Syne, sans-serif" font-size="34" font-weight="800"
            text-anchor="middle" fill="#04121c">${initials}</text>
    </svg>`;
}

/**
 * Compresses an uploaded image file client-side (resize + JPEG re-encode)
 * before it's stored, to keep IndexedDB usage small.
 * Returns a Promise<string> resolving to a compressed data URL.
 */
function compressImageFile(file, maxDim, quality) {
  maxDim  = maxDim  || 320;
  quality = quality || 0.72;

  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file provided.')); return; }
    if (!/^image\//.test(file.type)) { reject(new Error('Please choose an image file.')); return; }
    if (file.size > 12 * 1024 * 1024) { reject(new Error('Image is too large (max 12MB).')); return; }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode the selected image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0d1420';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(new Error('Could not process the image.'));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Parses a free-typed skills string into a clean, de-duplicated array */
function parseSkillsInput(str) {
  if (Array.isArray(str)) str = str.join(',');
  return Array.from(new Set(
    (str || '')
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  )).slice(0, 30);
}

window.AIRC_PROFILE_CORE = {
  PROFILE_FIELDS,
  validateProfile,
  computeCompletion,
  computeLevelBadge,
  getInitials,
  buildDefaultAvatarSvg,
  compressImageFile,
  parseSkillsInput,
  normalizeUrl,
};
