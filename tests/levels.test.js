import test from 'node:test';
import assert from 'node:assert/strict';
import { clampLevel, getLevelConfig } from '../src/config/levels.js';
import { MAX_LEVEL } from '../src/config/constants.js';
import { calculateStars, formatTime } from '../src/engine/scoring.js';
import { sanitizeProgress } from '../src/engine/storage.js';

test('maze size keeps growing and reaches 15 well before the last level', () => {
  const sizes = Array.from({ length: MAX_LEVEL }, (_, i) => getLevelConfig(i + 1).size);
  assert.equal(sizes[0], 5);
  assert.equal(Math.max(...sizes), 15);
  for (let i = 1; i < sizes.length; i++) assert.ok(sizes[i] >= sizes[i - 1]);
  assert.equal(getLevelConfig(10).size, 11); // original code capped at 15 here AND stayed flat
});

test('difficulty goes UP with level: fewer loops (more dead ends), faster rival', () => {
  // Compare the loop RATIO so maze size does not hide the trend.
  const ratio = (l) => { const c = getLevelConfig(l); return c.extraLoops / (c.size * c.size); };
  assert.ok(ratio(1) > ratio(15));
  assert.ok(ratio(15) > ratio(30));
  for (let l = 2; l <= MAX_LEVEL; l++) {
    assert.ok(getLevelConfig(l).aiIntervalMs <= getLevelConfig(l - 1).aiIntervalMs);
  }
  assert.equal(getLevelConfig(1).aiIntervalMs, 2800);
  assert.equal(getLevelConfig(30).aiIntervalMs, 1200);
});

test('rival slide is always shorter than the gap between moves', () => {
  for (let l = 1; l <= MAX_LEVEL; l++) {
    const c = getLevelConfig(l);
    assert.ok(c.aiMoveMs < c.aiIntervalMs);
  }
});

test('clampLevel survives bad input', () => {
  assert.equal(clampLevel(NaN), 1);
  assert.equal(clampLevel('abc'), 1);
  assert.equal(clampLevel(-5), 1);
  assert.equal(clampLevel(999), MAX_LEVEL);
  assert.equal(clampLevel('7'), 7);
});

test('corrupt or hand-edited saves become a valid state (parseInt NaN bug)', () => {
  assert.equal(sanitizeProgress({ unlocked: 'abc' }).unlocked, 1);
  assert.equal(sanitizeProgress({ unlocked: 500 }).unlocked, MAX_LEVEL);
  assert.equal(sanitizeProgress(null).unlocked, 1);
  assert.deepEqual(sanitizeProgress({ stars: { 3: 2, 99: 3, x: 1, 4: 9 } }).stars, { 3: 2 });
  assert.equal(sanitizeProgress({ muted: 'yes' }).muted, false);
});

test('star rating and time formatting', () => {
  assert.equal(calculateStars(10, 10), 3);
  assert.equal(calculateStars(13, 10), 3);
  assert.equal(calculateStars(18, 10), 2);
  assert.equal(calculateStars(40, 10), 1);
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(-3), '00:00');
});
