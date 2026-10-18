/**
 * Short-lived visuals: confetti-style particles and paw-print trail.
 * Positions are in GRID units (1 = one maze cell), so a window resize can
 * never leave them in the wrong place.
 */
export class Effects {
  constructor() {
    this.particles = [];
    this.trail = [];
  }

  burst(x, y, colors, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.4; // cells per second
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 1,
        lifeSpeed: 1 / (0.5 + Math.random() * 0.5), // fades in 0.5-1.0 s
        color: colors[i % colors.length],
        size: 0.05 + Math.random() * 0.07,
      });
    }
  }

  /** Drops a paw print if the cat has moved far enough from the last one. */
  addTrail(x, y) {
    const last = this.trail[this.trail.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < 0.35) return;
    this.trail.push({ x, y, life: 1 });
    if (this.trail.length > 25) this.trail.shift();
  }

  /** @param {number} dt seconds */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 2.2 * dt; // gravity
      p.life -= p.lifeSpeed * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= 0.72 * dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }
}
