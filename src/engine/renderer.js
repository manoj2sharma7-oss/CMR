import { PHASE } from './GameSession.js';

/* Palette (matches src/styles/tokens.css) */
const INK = '#1f2a44';
const FLOOR_A = '#fffaf3';
const FLOOR_B = '#f5f0ff';
const START_TINT = 'rgba(96, 215, 179, 0.24)';

/** Where the maze sits inside the canvas. Used for drawing AND for pointer maths. */
export function getBoardLayout(canvasCssSize, cols) {
  const pad = 8;
  return { pad, cs: (canvasCssSize - pad * 2) / cols };
}

/**
 * Draws one full frame.
 * @param ctx   2D context already scaled for the device pixel ratio
 * @param opts  { cssSize, session, effects, time (ms), reducedMotion }
 */
export function renderScene(ctx, { cssSize, session, effects, time, reducedMotion }) {
  const { maze, view, goalCell } = session;
  const { pad, cs } = getBoardLayout(cssSize, maze.cols);
  const bob = (speed, phase = 0) => (reducedMotion ? 0 : Math.sin(time / 1000 * speed + phase) * cs * 0.03);

  ctx.clearRect(0, 0, cssSize, cssSize);
  ctx.save();
  ctx.translate(pad, pad);

  drawFloor(ctx, maze, cs, session.startCell);

  if (!session.caught) {
    drawMouse(ctx, (goalCell.c + 0.5) * cs, (goalCell.r + 0.5) * cs + bob(5), cs, time, reducedMotion);
  }

  for (const t of effects.trail) drawPawPrint(ctx, t.x * cs, t.y * cs, t.life, cs);

  drawWalls(ctx, maze, cs);

  // "Start here" ring so a child knows where the cat is before moving.
  const idle = session.steps === 0 && (session.phase === PHASE.PLAYING || session.phase === PHASE.READY);
  if (idle) drawHintRing(ctx, view.player.x * cs, view.player.y * cs, cs, time, reducedMotion);

  for (const p of effects.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x * cs, p.y * cs, Math.max(1, p.size * cs * (0.4 + p.life * 0.6)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (session.hasRival) {
    drawCat(ctx, view.rival.x * cs, view.rival.y * cs + bob(5, 1), cs * 0.85, false, view.rival.facing);
  }
  drawCat(ctx, view.player.x * cs, view.player.y * cs + bob(6), cs * 0.85, true, view.player.facing);

  ctx.restore();
}

function drawFloor(ctx, maze, cs, startCell) {
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(c * cs, r * cs, cs + 0.5, cs + 0.5);
    }
  }
  ctx.fillStyle = START_TINT;
  ctx.fillRect(startCell.c * cs, startCell.r * cs, cs, cs);
}

function drawWalls(ctx, maze, cs) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, cs * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const { walls } = maze.grid[r][c];
      const x = c * cs;
      const y = r * cs;
      if (walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + cs, y); }
      if (walls.right) { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); }
      if (walls.bottom) { ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); }
      if (walls.left) { ctx.moveTo(x, y); ctx.lineTo(x, y + cs); }
    }
  }
  ctx.stroke();
}

function drawHintRing(ctx, x, y, cs, time, reducedMotion) {
  const pulse = reducedMotion ? 0.5 : (Math.sin(time / 300) + 1) / 2;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 138, 61, ${0.45 + pulse * 0.4})`;
  ctx.lineWidth = Math.max(2, cs * 0.06);
  ctx.setLineDash([cs * 0.12, cs * 0.1]);
  ctx.beginPath();
  ctx.arc(x, y, cs * (0.46 + pulse * 0.06), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPawPrint(ctx, x, y, life, cs) {
  const size = cs * 0.1 * life;
  ctx.fillStyle = `rgba(255, 138, 61, ${life * 0.5})`;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.3, size * 1.1, size * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  const toe = size * 0.45;
  ctx.beginPath();
  ctx.arc(x - size * 0.9, y - size * 0.5, toe, 0, Math.PI * 2);
  ctx.arc(x, y - size * 1.0, toe, 0, Math.PI * 2);
  ctx.arc(x + size * 0.9, y - size * 0.5, toe, 0, Math.PI * 2);
  ctx.fill();
}

/** A vector mouse, so it looks the same on every device (no emoji fonts needed). */
function drawMouse(ctx, x, y, cs, time, reducedMotion) {
  const s = cs * 0.62;
  const pulse = reducedMotion ? 0.8 : (Math.sin(time / 350) + 1) / 2;

  const glow = ctx.createRadialGradient(x, y, 0, x, y, cs * 0.6);
  glow.addColorStop(0, `rgba(255, 126, 182, ${0.35 + pulse * 0.25})`);
  glow.addColorStop(1, 'rgba(255, 126, 182, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - cs * 0.6, y - cs * 0.6, cs * 1.2, cs * 1.2);

  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';

  ctx.strokeStyle = '#ff8ac2'; // tail
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(s * 0.32, s * 0.12);
  ctx.quadraticCurveTo(s * 0.62, s * 0.05, s * 0.55, -s * 0.2);
  ctx.stroke();

  ctx.fillStyle = '#c9c4e0'; // ears
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * s * 0.22, -s * 0.22, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff9fcb';
    ctx.beginPath();
    ctx.arc(sx * s * 0.22, -s * 0.22, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9c4e0';
  }

  ctx.beginPath(); // body
  ctx.ellipse(0, s * 0.05, s * 0.36, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK; // eyes + nose
  ctx.beginPath();
  ctx.arc(-s * 0.12, -s * 0.04, s * 0.045, 0, Math.PI * 2);
  ctx.arc(s * 0.12, -s * 0.04, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6db3';
  ctx.beginPath();
  ctx.arc(0, s * 0.1, s * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Cat drawing. `facing` is 1 (looks right) or -1 (looks left). */
function drawCat(ctx, x, y, s, orange, facing) {
  const bodyColor = orange ? '#ff9d3d' : '#3a3358';
  const stripe = orange ? '#d9701a' : '#1f1a38';
  const innerEar = orange ? '#ffe0a8' : '#6b5f9a';
  const belly = orange ? '#fff1d6' : '#524a7d';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.fillStyle = 'rgba(42, 33, 80, 0.18)'; // shadow
  ctx.beginPath();
  ctx.ellipse(0, s * 0.4, s * 0.32, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = bodyColor; // tail
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.15);
  ctx.quadraticCurveTo(s * 0.45, s * 0.05, s * 0.42, -s * 0.18);
  ctx.quadraticCurveTo(s * 0.38, -s * 0.3, s * 0.3, -s * 0.28);
  ctx.stroke();

  ctx.fillStyle = bodyColor; // body
  ctx.beginPath();
  ctx.ellipse(0, s * 0.15, s * 0.3, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.22, s * 0.18, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor; // head
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.26, 0, Math.PI * 2);
  ctx.fill();

  for (const sx of [-1, 1]) { // ears
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(sx * s * 0.22, -s * 0.28);
    ctx.lineTo(sx * s * 0.12, -s * 0.45);
    ctx.lineTo(sx * s * 0.05, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = innerEar;
    ctx.beginPath();
    ctx.moveTo(sx * s * 0.18, -s * 0.3);
    ctx.lineTo(sx * s * 0.13, -s * 0.4);
    ctx.lineTo(sx * s * 0.08, -s * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  if (orange) { // forehead stripes
    ctx.strokeStyle = stripe;
    ctx.lineWidth = s * 0.025;
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.32); ctx.lineTo(-s * 0.06, -s * 0.22);
    ctx.moveTo(0, -s * 0.34); ctx.lineTo(0, -s * 0.22);
    ctx.moveTo(s * 0.08, -s * 0.32); ctx.lineTo(s * 0.06, -s * 0.22);
    ctx.stroke();
  }

  ctx.fillStyle = orange ? '#2a2150' : '#ffe14d'; // eyes (rival has yellow eyes)
  ctx.beginPath();
  ctx.ellipse(-s * 0.1, -s * 0.14, s * 0.055, s * 0.08, -0.2, 0, Math.PI * 2);
  ctx.ellipse(s * 0.1, -s * 0.14, s * 0.055, s * 0.08, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = orange ? '#ffffff' : '#1f1a38';
  ctx.beginPath();
  ctx.arc(-s * 0.09, -s * 0.16, s * 0.022, 0, Math.PI * 2);
  ctx.arc(s * 0.11, -s * 0.16, s * 0.022, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff7eb6'; // nose
  ctx.beginPath();
  ctx.moveTo(-s * 0.03, -s * 0.04);
  ctx.lineTo(s * 0.03, -s * 0.04);
  ctx.lineTo(0, -s * 0.01);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = orange ? '#2a2150' : '#c9c4e0'; // mouth
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.01); ctx.lineTo(0, s * 0.02);
  ctx.moveTo(0, s * 0.02); ctx.quadraticCurveTo(-s * 0.04, s * 0.05, -s * 0.07, s * 0.02);
  ctx.moveTo(0, s * 0.02); ctx.quadraticCurveTo(s * 0.04, s * 0.05, s * 0.07, s * 0.02);
  ctx.stroke();

  ctx.strokeStyle = orange ? '#92400e' : '#8f86bd'; // whiskers
  ctx.lineWidth = s * 0.012;
  ctx.beginPath();
  for (const sx of [-1, 1]) {
    ctx.moveTo(sx * s * 0.12, -s * 0.02); ctx.lineTo(sx * s * 0.28, -s * 0.05);
    ctx.moveTo(sx * s * 0.12, s * 0.01); ctx.lineTo(sx * s * 0.28, s * 0.02);
  }
  ctx.stroke();

  ctx.restore();
}
