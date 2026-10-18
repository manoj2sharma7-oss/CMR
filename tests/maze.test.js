import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaze, openNeighbors } from '../src/engine/maze.js';
import { findPath } from '../src/engine/pathfinder.js';
import { createRng } from '../src/engine/random.js';

const SIZES = [5, 7, 9, 15];

test('every cell can be reached from the start (maze is always solvable)', () => {
  for (const size of SIZES) {
    for (let seed = 1; seed <= 25; seed++) {
      const maze = createMaze(size, { extraLoops: size * 2, rng: createRng(seed) });
      const seen = new Set(['0,0']);
      const queue = [maze.grid[0][0]];
      for (let i = 0; i < queue.length; i++) {
        for (const n of openNeighbors(maze, queue[i])) {
          if (!seen.has(`${n.r},${n.c}`)) { seen.add(`${n.r},${n.c}`); queue.push(n); }
        }
      }
      assert.equal(seen.size, size * size, `size ${size}, seed ${seed}`);
    }
  }
});

test('walls are symmetric and the outer border is never opened', () => {
  const maze = createMaze(9, { extraLoops: 30, rng: createRng(7) });
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const w = maze.grid[r][c].walls;
      if (c < 8) assert.equal(w.right, maze.grid[r][c + 1].walls.left);
      if (r < 8) assert.equal(w.bottom, maze.grid[r + 1][c].walls.top);
      if (r === 0) assert.ok(w.top);
      if (r === 8) assert.ok(w.bottom);
      if (c === 0) assert.ok(w.left);
      if (c === 8) assert.ok(w.right);
    }
  }
});

test('a perfect maze has exactly size*size - 1 passages; loops add more', () => {
  const countPassages = (m) => {
    let n = 0;
    for (const row of m.grid) for (const cell of row) {
      if (!cell.walls.right && cell.c < m.cols - 1) n++;
      if (!cell.walls.bottom && cell.r < m.rows - 1) n++;
    }
    return n;
  };
  assert.equal(countPassages(createMaze(7, { rng: createRng(3) })), 48);
  assert.equal(countPassages(createMaze(7, { extraLoops: 5, rng: createRng(3) })), 53);
});

test('cells do not carry a leftover "visited" flag (first-version bug)', () => {
  const maze = createMaze(5, { rng: createRng(1) });
  assert.ok(maze.grid.flat().every((cell) => !('visited' in cell)));
});

test('BFS finds a valid shortest path that never crosses a wall', () => {
  const maze = createMaze(11, { extraLoops: 8, rng: createRng(42) });
  const path = findPath(maze, { r: 0, c: 0 }, { r: 10, c: 10 });
  assert.deepEqual([path[0].r, path[0].c], [0, 0]);
  assert.deepEqual([path.at(-1).r, path.at(-1).c], [10, 10]);
  for (let i = 1; i < path.length; i++) {
    assert.ok(openNeighbors(maze, path[i - 1]).includes(path[i]));
  }
});
