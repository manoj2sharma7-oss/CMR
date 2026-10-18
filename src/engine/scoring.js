/**
 * Star rating from how close the player was to the shortest route.
 * 3 stars: very direct, 2 stars: a few detours, 1 star: finished.
 */
export function calculateStars(steps, optimalSteps) {
  if (optimalSteps <= 0) return 3;
  const ratio = steps / optimalSteps;
  if (ratio <= 1.3) return 3;
  if (ratio <= 2) return 2;
  return 1;
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
