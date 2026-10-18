import { GAME_MODES } from '../config/constants.js';
import { getLevelConfig } from '../config/levels.js';
import { createMaze, canStep, DIRECTIONS, isInside } from './maze.js';
import { findPath, nextStep } from './pathfinder.js';
import { calculateStars } from './scoring.js';

export const PHASE = Object.freeze({
  READY: 'ready', // 3-2-1 countdown
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost',
});

const COUNTDOWN_STEPS = 3;
const COUNTDOWN_STEP_MS = 700;
const GO_BANNER_MS = 600;
const CATCH_DISTANCE = 0.25; // how close (in cells) a cat must look before the mouse is "caught"

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * One round of the game: maze, player, rival, clock and rules.
 * It has NO React and NO canvas code, so it can be unit tested in Node.
 *
 * Call `update(dtMs)` every frame. Listen to `onEvent(type, payload)`:
 *   countdown | go | step | rivalStep | end | catch | phase
 */
export class GameSession {
  constructor({ level, mode, rng = Math.random, onEvent = () => {} }) {
    this.config = getLevelConfig(level);
    this.mode = mode;
    this.hasRival = mode === GAME_MODES.VS;
    this.onEvent = onEvent;

    const last = this.config.size - 1;
    this.maze = createMaze(this.config.size, { extraLoops: this.config.extraLoops, rng });
    this.startCell = { r: 0, c: 0 };
    this.rivalStartCell = { r: 0, c: last };
    this.goalCell = { r: last, c: last };
    this.optimalSteps = findPath(this.maze, this.startCell, this.goalCell).length - 1;

    this.phase = PHASE.READY;
    this.phaseBeforePause = null;
    this.readyMs = COUNTDOWN_STEPS * COUNTDOWN_STEP_MS;
    this.lastCountdownNumber = COUNTDOWN_STEPS + 1;
    this.elapsedMs = 0;

    this.player = { ...this.startCell };
    this.steps = 0;

    this.rival = {
      cell: { ...this.rivalStartCell },
      from: null,
      to: null,
      moving: false,
      moveMs: 0,
      waitMs: 0,
    };

    this.result = null; // filled in by finish()
    this.caught = false; // true once the winning cat visually reaches the mouse
    this.lastPointer = null;

    // What the screen shows, in grid units (cell centre = r + 0.5). Smoothly follows the logic.
    this.view = {
      player: { x: this.startCell.c + 0.5, y: this.startCell.r + 0.5, facing: 1 },
      rival: { x: this.rivalStartCell.c + 0.5, y: this.rivalStartCell.r + 0.5, facing: -1 },
    };
  }

  /* ---------- state helpers ---------- */

  get isFinished() {
    return this.phase === PHASE.WON || this.phase === PHASE.LOST;
  }

  /** Big text shown in the middle of the board, or null. */
  get banner() {
    if (this.phase === PHASE.READY) return String(Math.ceil(this.readyMs / COUNTDOWN_STEP_MS));
    if (this.phase === PHASE.PLAYING && this.elapsedMs < GO_BANNER_MS) return 'GO!';
    return null;
  }

  snapshot() {
    return {
      phase: this.phase,
      steps: this.steps,
      seconds: Math.floor(this.elapsedMs / 1000),
      banner: this.banner,
      optimalSteps: this.optimalSteps,
    };
  }

  emit(type, payload) {
    this.onEvent(type, payload);
  }

  /* ---------- time ---------- */

  /** Advance the game by `dtMs` milliseconds. Safe to call in every phase. */
  update(dtMs) {
    if (this.phase === PHASE.READY) this.tickCountdown(dtMs);
    else if (this.phase === PHASE.PLAYING) {
      this.elapsedMs += dtMs;
      if (this.hasRival) this.tickRival(dtMs);
    }
    this.tickView(dtMs);
  }

  tickCountdown(dtMs) {
    this.readyMs -= dtMs;
    if (this.readyMs <= 0) {
      this.readyMs = 0;
      this.phase = PHASE.PLAYING;
      this.emit('go');
      return;
    }
    const n = Math.ceil(this.readyMs / COUNTDOWN_STEP_MS);
    if (n !== this.lastCountdownNumber) {
      this.lastCountdownNumber = n;
      this.emit('countdown', n);
    }
  }

  /**
   * Rival rules: wait, then slide to the next cell on the shortest route.
   * The rival only counts as "arrived" when its slide ENDS, so it can never
   * win while it is still visibly on its way (bug in the first version).
   */
  tickRival(dtMs) {
    const rival = this.rival;
    const { aiIntervalMs, aiMoveMs } = this.config;

    if (rival.moving) {
      rival.moveMs += dtMs;
      if (rival.moveMs >= aiMoveMs) {
        rival.cell = rival.to;
        rival.moving = false;
        rival.waitMs = 0;
        if (rival.cell.r === this.goalCell.r && rival.cell.c === this.goalCell.c) {
          this.finish(false);
        }
      }
      return;
    }

    rival.waitMs += dtMs;
    if (rival.waitMs < aiIntervalMs - aiMoveMs) return;

    const to = nextStep(this.maze, rival.cell, this.goalCell);
    if (to.r === rival.cell.r && to.c === rival.cell.c) {
      rival.waitMs = 0;
      return;
    }
    if (to.c !== rival.cell.c) this.view.rival.facing = to.c > rival.cell.c ? 1 : -1;
    rival.from = rival.cell;
    rival.to = to;
    rival.moving = true;
    rival.moveMs = 0;
    this.emit('rivalStep', { r: to.r, c: to.c });
  }

  /** Moves the drawn positions toward the logical ones (purely visual). */
  tickView(dtMs) {
    const p = this.view.player;
    const follow = 1 - Math.exp(-dtMs / 70);
    p.x += (this.player.c + 0.5 - p.x) * follow;
    p.y += (this.player.r + 0.5 - p.y) * follow;

    const r = this.view.rival;
    const rv = this.rival;
    if (rv.moving) {
      const t = easeOutCubic(Math.min(1, rv.moveMs / this.config.aiMoveMs));
      r.x = rv.from.c + 0.5 + (rv.to.c - rv.from.c) * t;
      r.y = rv.from.r + 0.5 + (rv.to.r - rv.from.r) * t;
    } else {
      r.x = rv.cell.c + 0.5;
      r.y = rv.cell.r + 0.5;
    }

    // The mouse is "caught" when the winner is really there on screen.
    if (this.isFinished && !this.caught) {
      const winner = this.phase === PHASE.WON ? p : r;
      const gx = this.goalCell.c + 0.5;
      const gy = this.goalCell.r + 0.5;
      if (Math.hypot(winner.x - gx, winner.y - gy) < CATCH_DISTANCE) {
        this.caught = true;
        this.emit('catch', { playerWon: this.phase === PHASE.WON, x: gx, y: gy });
      }
    }
  }

  /* ---------- player input ---------- */

  /** Keyboard: 'up' | 'down' | 'left' | 'right'. Returns true if the cat moved. */
  movePlayer(directionName) {
    const dir = DIRECTIONS[directionName];
    if (!dir) return false;
    return this.stepPlayerTo(this.player.r + dir.dr, this.player.c + dir.dc);
  }

  /**
   * Pointer/finger position in grid units (x = column, y = row, may be fractional).
   * The path between the last and the current position is sampled, so a fast
   * mouse flick can no longer skip cells. Walls still block every step.
   */
  pointerMove(gx, gy) {
    if (!isInside(this.maze, Math.floor(gy), Math.floor(gx)) || gx < 0 || gy < 0) {
      this.lastPointer = null;
      return;
    }
    const prev = this.lastPointer;
    this.lastPointer = { x: gx, y: gy };
    if (!prev) {
      this.stepPlayerTo(Math.floor(gy), Math.floor(gx));
      return;
    }
    const samples = Math.max(1, Math.ceil(Math.hypot(gx - prev.x, gy - prev.y) / 0.2));
    for (let i = 1; i <= samples; i++) {
      const x = prev.x + ((gx - prev.x) * i) / samples;
      const y = prev.y + ((gy - prev.y) * i) / samples;
      this.stepPlayerTo(Math.floor(y), Math.floor(x));
    }
  }

  pointerLeave() {
    this.lastPointer = null;
  }

  /** The one place where the player's cat is allowed to change cell. */
  stepPlayerTo(r, c) {
    if (this.phase !== PHASE.PLAYING) return false;
    if (!isInside(this.maze, r, c)) return false;

    const dr = r - this.player.r;
    const dc = c - this.player.c;
    if (!canStep(this.maze, this.player, dr, dc)) return false; // wall, or not a 1-cell step

    this.player = { r, c };
    this.steps += 1;
    if (dc !== 0) this.view.player.facing = dc > 0 ? 1 : -1;
    this.emit('step', { r, c, steps: this.steps });

    if (r === this.goalCell.r && c === this.goalCell.c) this.finish(true);
    return true;
  }

  /* ---------- pause / end ---------- */

  pause() {
    if (this.phase !== PHASE.PLAYING && this.phase !== PHASE.READY) return;
    this.phaseBeforePause = this.phase;
    this.phase = PHASE.PAUSED;
    this.emit('phase', this.phase);
  }

  resume() {
    if (this.phase !== PHASE.PAUSED) return;
    this.phase = this.phaseBeforePause ?? PHASE.PLAYING;
    this.phaseBeforePause = null;
    this.emit('phase', this.phase);
  }

  /** Ends the round exactly once, whoever got there first. */
  finish(playerWon) {
    if (this.isFinished) return;
    this.phase = playerWon ? PHASE.WON : PHASE.LOST;
    this.result = {
      won: playerWon,
      steps: this.steps,
      seconds: Math.floor(this.elapsedMs / 1000),
      optimalSteps: this.optimalSteps,
      stars: playerWon ? calculateStars(this.steps, this.optimalSteps) : 0,
    };
    this.emit('end', this.result);
  }
}
