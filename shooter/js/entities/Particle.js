/**
 * 粒子效果
 */

import { GameState, ctx } from '../state.js';

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 3 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = 0.03 + Math.random() * 0.03;
    this.active = true;
  }

  update() {
    this.x += this.vx * GameState.timeScale;
    this.y += this.vy * GameState.timeScale;
    this.life -= this.decay;
    if (this.life <= 0) this.active = false;
  }

  draw() {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}
