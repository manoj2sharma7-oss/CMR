import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession, PHASE } from '../src/engine/GameSession.js';
import { findPath } from '../src/engine/pathfinder.js';
import { createRng } from '../src/engine/random.js';

const make = (opts = {}) => {
  const events = [];
  const session = new GameSession({
    level: 1,
    mode: 'vs',
    rng: createRng(11),
    onEvent: (type, payload) => events.push({ type, payload }),
    ...opts,
  });
  return { session, events };
};

/** Run the 3-2-1 countdown. */
const startPlaying = (s) => { s.update(2200); assert.equal(s.phase, PHASE.PLAYING); };

/** Walk the player along the shortest route. */
const walkToGoal = (s) => {
  const path = findPath(s.maze, s.player, s.goalCell);
  for (const cell of path.slice(1)) assert.ok(s.stepPlayerTo(cell.r, cell.c));
};

test('countdown comes first, and the player cannot move during it', () => {
  const { session } = make();
  assert.equal(session.phase, PHASE.READY);
  assert.equal(session.banner, '3');
  assert.equal(session.movePlayer('down') || session.movePlayer('right'), false);
  session.update(2200);
  assert.equal(session.phase, PHASE.PLAYING);
  assert.equal(session.banner, 'GO!');
});

test('the rival does not move during the countdown (head start bug)', () => {
  const { session } = make();
  session.update(2000);
  assert.equal(session.rival.moving, false);
  assert.deepEqual(session.rival.cell, session.rivalStartCell);
});

test('player cannot walk through walls or jump over cells', () => {
  const { session } = make();
  startPlaying(session);
  const { r, c } = session.player;
  assert.equal(session.stepPlayerTo(r + 2, c), false);
  assert.equal(session.stepPlayerTo(r + 1, c + 1), false);
  assert.equal(session.stepPlayerTo(r - 1, c), false); // outside the maze
  const before = session.steps;
  const walls = session.maze.grid[0][0].walls;
  if (walls.right) assert.equal(session.movePlayer('right'), false);
  if (walls.bottom) assert.equal(session.movePlayer('down'), false);
  assert.equal(session.steps, before);
});

test('walking the shortest path wins with 3 stars and fires "end" exactly once', () => {
  const { session, events } = make({ mode: 'solo' });
  startPlaying(session);
  walkToGoal(session);
  assert.equal(session.phase, PHASE.WON);
  assert.equal(session.result.steps, session.optimalSteps);
  assert.equal(session.result.stars, 3);
  assert.equal(events.filter((e) => e.type === 'end').length, 1);

  assert.equal(session.stepPlayerTo(0, 0), false); // frozen after the end
  session.finish(false); // a late rival finish must be ignored
  assert.equal(session.phase, PHASE.WON);
  assert.equal(events.filter((e) => e.type === 'end').length, 1);
});

test('rival only wins when its slide ENDS, not when it starts', () => {
  const { session, events } = make();
  startPlaying(session);
  const path = findPath(session.maze, session.rivalStartCell, session.goalCell);
  // Put the rival one cell away, then let it start its final move.
  const prev = path.at(-2);
  session.rival.cell = { r: prev.r, c: prev.c };
  session.update(session.config.aiIntervalMs - session.config.aiMoveMs);
  assert.equal(session.rival.moving, true);
  assert.equal(session.phase, PHASE.PLAYING, 'must not lose while still sliding');

  session.update(session.config.aiMoveMs);
  assert.equal(session.phase, PHASE.LOST);
  assert.equal(session.result.stars, 0);
  assert.equal(events.filter((e) => e.type === 'end').length, 1);
});

test('player can still win while the rival is mid-slide onto the mouse', () => {
  const { session } = make();
  startPlaying(session);
  const path = findPath(session.maze, session.rivalStartCell, session.goalCell);
  const prev = path.at(-2);
  session.rival.cell = { r: prev.r, c: prev.c };
  session.update(session.config.aiIntervalMs - session.config.aiMoveMs); // rival starts final slide
  session.player = { ...findPath(session.maze, session.startCell, session.goalCell).at(-2) };
  assert.ok(session.stepPlayerTo(session.goalCell.r, session.goalCell.c));
  session.update(session.config.aiMoveMs);
  assert.equal(session.phase, PHASE.WON);
});

test('"catch" fires only after the winner is visibly at the mouse (render-loop bug)', () => {
  const { session, events } = make({ mode: 'solo' });
  startPlaying(session);
  walkToGoal(session);
  assert.equal(session.caught, false); // logic won, cat still sliding
  for (let i = 0; i < 40 && !session.caught; i++) session.update(16);
  assert.equal(session.caught, true);
  assert.equal(events.filter((e) => e.type === 'catch').length, 1);
  assert.equal(events.find((e) => e.type === 'catch').payload.playerWon, true);
});

test('solo mode has no rival and the clock only runs while playing', () => {
  const { session } = make({ mode: 'solo' });
  session.update(1000);
  assert.equal(session.elapsedMs, 0); // countdown does not count
  startPlaying(session);
  const t0 = session.elapsedMs;
  session.update(5000);
  assert.equal(session.elapsedMs, t0 + 5000);
  assert.deepEqual(session.rival.cell, session.rivalStartCell);
  assert.equal(session.phase, PHASE.PLAYING);
});

test('pause freezes the clock, the rival and the player; resume restores them', () => {
  const { session } = make();
  startPlaying(session);
  session.update(500);
  session.pause();
  const frozen = { t: session.elapsedMs, wait: session.rival.waitMs, steps: session.steps };
  session.update(10000);
  assert.equal(session.elapsedMs, frozen.t);
  assert.equal(session.rival.waitMs, frozen.wait);
  assert.equal(session.movePlayer('down') || session.movePlayer('right'), false);
  assert.equal(session.steps, frozen.steps);
  session.resume();
  assert.equal(session.phase, PHASE.PLAYING);
});

test('pausing during the countdown returns to the countdown', () => {
  const { session } = make();
  session.update(300);
  session.pause();
  session.resume();
  assert.equal(session.phase, PHASE.READY);
});

test('fast mouse flick across several cells does not skip any (cell skipping bug)', () => {
  const { session } = make({ mode: 'solo' });
  // Hand-build an open corridor along the top row so the test never depends on the seed.
  const row = session.maze.grid[0];
  for (let c = 0; c < 4; c++) { row[c].walls.right = false; row[c + 1].walls.left = false; }
  startPlaying(session);

  session.pointerMove(0.5, 0.5);
  session.pointerMove(4.5, 0.5); // one jump, four cells
  assert.deepEqual(session.player, { r: 0, c: 4 });
  assert.equal(session.steps, 4);
});

test('a flick that crosses a wall stops at the wall', () => {
  const { session } = make({ mode: 'solo' });
  const row = session.maze.grid[0];
  for (let c = 0; c < 4; c++) { row[c].walls.right = false; row[c + 1].walls.left = false; }
  row[2].walls.right = true; row[3].walls.left = true; // wall between column 2 and 3
  startPlaying(session);

  session.pointerMove(0.5, 0.5);
  session.pointerMove(4.5, 0.5);
  assert.deepEqual(session.player, { r: 0, c: 2 });
});

test('a pointer flick through a wall never teleports the cat through it', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const { session } = make({ mode: 'solo', rng: createRng(seed) });
    startPlaying(session);
    const { size } = session.config;
    // Sweep the pointer diagonally across the whole board, many times.
    for (let k = 0; k < 6; k++) {
      session.pointerMove(0.1, 0.1);
      session.pointerMove(size - 0.1, size - 0.1);
      session.pointerLeave();
      session.pointerMove(size - 0.1, 0.1);
      session.pointerMove(0.1, size - 0.1);
    }
    // Whatever happened, the player is still on a cell reachable by a valid route:
    const route = findPath(session.maze, session.startCell, session.player);
    assert.ok(route.length - 1 <= session.steps, `seed ${seed}: moved ${route.length - 1} cells in ${session.steps} steps`);
  }
});

test('keyboard moves follow the same wall rules', () => {
  const { session } = make({ mode: 'solo' });
  startPlaying(session);
  const path = findPath(session.maze, session.startCell, session.goalCell);
  const dir = (a, b) => (b.r > a.r ? 'down' : b.r < a.r ? 'up' : b.c > a.c ? 'right' : 'left');
  assert.ok(session.movePlayer(dir(path[0], path[1])));
  assert.equal(session.steps, 1);
  assert.equal(session.movePlayer('bogus'), false);
});
