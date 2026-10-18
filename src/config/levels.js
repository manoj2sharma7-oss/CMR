import { MAX_LEVEL } from './constants.js';

const lerp = (a, b, t) => a + (b - a) * t;

/** Keeps any value inside 1..MAX_LEVEL. Bad input (NaN, text) becomes level 1. */
export function clampLevel(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, n));
}

/**
 * Difficulty curve for a level.
 *
 *  - size:          maze is size x size cells (5 -> 15, grows every 3 levels)
 *  - extraLoops:    walls removed AFTER the perfect maze is built. Fewer loops
 *                   means more dead ends, so this goes DOWN as levels go up.
 *  - aiIntervalMs:  time between rival moves (2.8s -> 1.2s, smooth)
 *  - aiMoveMs:      how long the rival's slide animation lasts
 */
export function getLevelConfig(level) {
  const lvl = clampLevel(level);
  const progress = (lvl - 1) / (MAX_LEVEL - 1); // 0 at level 1, 1 at last level

  const size = Math.min(15, 5 + 2 * Math.floor((lvl - 1) / 3));
  const extraLoops = Math.round(size * size * lerp(0.1, 0.02, progress));
  const aiIntervalMs = Math.round(lerp(2800, 1200, progress) / 50) * 50;
  const aiMoveMs = Math.min(400, Math.round(aiIntervalMs * 0.45));

  return { level: lvl, size, extraLoops, aiIntervalMs, aiMoveMs };
}

export function formatRivalSpeed(aiIntervalMs) {
  return `${(aiIntervalMs / 1000).toFixed(1)}s per move`;
}
