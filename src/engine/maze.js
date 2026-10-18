import { pickRandom } from './random.js';

/**
 * Each direction knows its row/column offset, which wall it crosses,
 * and which wall of the neighbour is the same physical wall.
 */
export const DIRECTIONS = Object.freeze({
  up: { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
  right: { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
  down: { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
  left: { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
});

const DIRECTION_LIST = Object.values(DIRECTIONS);

/** @typedef {{r:number, c:number, walls:{top:boolean,right:boolean,bottom:boolean,left:boolean}}} Cell */
/** @typedef {{rows:number, cols:number, grid:Cell[][]}} Maze */

export function isInside(maze, r, c) {
  return r >= 0 && r < maze.rows && c >= 0 && c < maze.cols;
}

/** Removes the wall between two touching cells (both sides). */
function openWallBetween(a, b) {
  const dir = DIRECTION_LIST.find((d) => a.r + d.dr === b.r && a.c + d.dc === b.c);
  if (!dir) return;
  a.walls[dir.wall] = false;
  b.walls[dir.opposite] = false;
}

/**
 * Builds a maze.
 *  1. Carve a "perfect" maze with depth-first search (exactly one route
 *     between any two cells, so the maze can always be solved).
 *  2. Knock out `extraLoops` more walls to create shortcuts.
 *
 * @param {number} size   cells per side
 * @param {{extraLoops?: number, rng?: () => number}} options
 * @returns {Maze}
 */
export function createMaze(size, { extraLoops = 0, rng = Math.random } = {}) {
  const grid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      r,
      c,
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );
  const maze = { rows: size, cols: size, grid };

  carvePerfectMaze(maze, rng);
  openExtraWalls(maze, extraLoops, rng);
  return maze;
}

function carvePerfectMaze(maze, rng) {
  // "visited" lives here, NOT on the cells, so the maze data stays clean.
  const visited = Array.from({ length: maze.rows }, () => new Array(maze.cols).fill(false));
  const stack = [maze.grid[0][0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const options = DIRECTION_LIST.map((d) => ({ r: current.r + d.dr, c: current.c + d.dc }))
      .filter((p) => isInside(maze, p.r, p.c) && !visited[p.r][p.c]);

    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const pick = pickRandom(options, rng);
    openWallBetween(current, maze.grid[pick.r][pick.c]);
    visited[pick.r][pick.c] = true;
    stack.push(maze.grid[pick.r][pick.c]);
  }
}

function openExtraWalls(maze, count, rng) {
  let opened = 0;
  let attempts = 0;
  while (opened < count && attempts < count * 20) {
    attempts++;
    const cell = maze.grid[Math.floor(rng() * maze.rows)][Math.floor(rng() * maze.cols)];
    const closed = DIRECTION_LIST.filter(
      (d) => cell.walls[d.wall] && isInside(maze, cell.r + d.dr, cell.c + d.dc)
    );
    if (closed.length === 0) continue;
    const dir = pickRandom(closed, rng);
    openWallBetween(cell, maze.grid[cell.r + dir.dr][cell.c + dir.dc]);
    opened++;
  }
}

/** True when a one-cell step (dr, dc) from `cell` is not blocked by a wall. */
export function canStep(maze, cell, dr, dc) {
  const dir = DIRECTION_LIST.find((d) => d.dr === dr && d.dc === dc);
  if (!dir) return false; // not a straight one-cell step
  if (!isInside(maze, cell.r + dr, cell.c + dc)) return false;
  return !maze.grid[cell.r][cell.c].walls[dir.wall];
}

/** Cells you can walk to from `cell` in one step. */
export function openNeighbors(maze, cell) {
  return DIRECTION_LIST.filter((d) => canStep(maze, cell, d.dr, d.dc)).map(
    (d) => maze.grid[cell.r + d.dr][cell.c + d.dc]
  );
}
