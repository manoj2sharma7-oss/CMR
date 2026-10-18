import { useCallback, useEffect, useState } from 'react';
import { MAX_LEVEL } from '@/config/constants';
import { DEFAULT_PROGRESS, loadProgress, sanitizeProgress, saveProgress } from '@/engine/storage';

/**
 * Saved progress: highest unlocked level, best stars per level, sound on/off.
 * Updates use the functional form of setState, so they can never read a
 * stale value (the first version compared against an old `unlockedLevel`).
 */
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const recordWin = useCallback((level, stars) => {
    setProgress((prev) => ({
      ...prev,
      unlocked: Math.max(prev.unlocked, Math.min(level + 1, MAX_LEVEL)),
      stars: { ...prev.stars, [level]: Math.max(prev.stars[level] ?? 0, stars) },
    }));
  }, []);

  const setMuted = useCallback((muted) => setProgress((prev) => ({ ...prev, muted })), []);

  const resetProgress = useCallback(
    () => setProgress((prev) => sanitizeProgress({ ...DEFAULT_PROGRESS, muted: prev.muted })),
    []
  );

  const totalStars = Object.values(progress.stars).reduce((sum, n) => sum + n, 0);

  return { progress, totalStars, recordWin, setMuted, resetProgress };
}
