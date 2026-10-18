import { LEGACY_LEVEL_KEY, MAX_LEVEL, STORAGE_KEY } from '../config/constants.js';

export const DEFAULT_PROGRESS = Object.freeze({ unlocked: 1, stars: {}, muted: false });

/**
 * Turns anything (corrupt JSON, hand-edited values, old versions) into a
 * valid progress object. This is what stops a bad save from breaking the game.
 */
export function sanitizeProgress(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const unlocked = Math.floor(Number(data.unlocked));
  const stars = {};
  if (data.stars && typeof data.stars === 'object') {
    for (const [level, value] of Object.entries(data.stars)) {
      const l = Math.floor(Number(level));
      const s = Math.floor(Number(value));
      if (l >= 1 && l <= MAX_LEVEL && s >= 1 && s <= 3) stars[l] = s;
    }
  }
  return {
    unlocked: Number.isFinite(unlocked) ? Math.min(MAX_LEVEL, Math.max(1, unlocked)) : 1,
    stars,
    muted: data.muted === true,
  };
}

/** localStorage can throw (private mode, blocked cookies), so every call is guarded. */
export function loadProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return sanitizeProgress(JSON.parse(saved));
    const legacy = window.localStorage.getItem(LEGACY_LEVEL_KEY);
    if (legacy !== null) return sanitizeProgress({ unlocked: parseInt(legacy, 10) });
  } catch {
    /* fall through to defaults */
  }
  return sanitizeProgress(DEFAULT_PROGRESS);
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* progress just won't persist */
  }
}
