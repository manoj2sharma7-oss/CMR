/** Shared constants. Change these to tune the whole game. */

export const MAX_LEVEL = 30;

export const GAME_MODES = Object.freeze({
  VS: 'vs', // race against the black rival cat
  SOLO: 'solo', // no rival, just you, steps and time
});

export const STORAGE_KEY = 'catMazeRace.v2';
/** Key used by the first version of the game (we import it once). */
export const LEGACY_LEVEL_KEY = 'cat_maze_level';
