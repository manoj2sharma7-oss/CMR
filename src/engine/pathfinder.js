import { openNeighbors } from './maze.js';

/**
 * Breadth-first search. Returns the shortest list of cells from `start`
 * to `goal` (both included), or [start] if the goal cannot be reached.
 * Uses a "came from" table instead of copying whole paths (fast + small).
 */
export function findPath(maze, start, goal) {
  const key = (r, c) => r * maze.cols + c;
  const cameFrom = new Map([[key(start.r, start.c), null]]);
  const queue = [maze.grid[start.r][start.c]];

  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    if (cell.r === goal.r && cell.c === goal.c) {
      const path = [];
      for (let cur = cell; cur; cur = cameFrom.get(key(cur.r, cur.c))) path.push(cur);
      return path.reverse();
    }
    for (const next of openNeighbors(maze, cell)) {
      const k = key(next.r, next.c);
      if (!cameFrom.has(k)) {
        cameFrom.set(k, cell);
        queue.push(next);
      }
    }
  }
  return [maze.grid[start.r][start.c]];
}

/** The single next cell the rival should walk to (or the start cell if none). */
export function nextStep(maze, start, goal) {
  const path = findPath(maze, start, goal);
  return path.length > 1 ? path[1] : path[0];
}
