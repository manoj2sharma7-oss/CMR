/**
 * Small seedable random generator (mulberry32).
 * The game uses Math.random; tests pass a seed so results are repeatable.
 */
export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandom(list, rng = Math.random) {
  return list[Math.floor(rng() * list.length)];
}
