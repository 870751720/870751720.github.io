/**
 * 敌人实体类
 */

import { GameState, GameObjects, ctx } from '../state.js';
import { ENEMY_CONFIGS } from '../config.js';
import { Particle } from './Particle.js';

export class Enemy {
  constructor() {
    this.type = Object.keys(ENEMY_CONFIGS)[Math.floor(Math.random() * 5)];
    this.x = 30 + Math.random() * (ctx.canvas.width - 60);
    this.y = -40;
    this.active = true;
    this.initType();
  }

  initType() {
    const cfg = ENEMY_CONFIGS[this.type];
    this.size = cfg.size;
    this.vx = cfg.vx === 'random' ? (Math.random() - 0.5) * 2 : cfg.vx;
    this.vy = cfg.vy;
    this.color = cfg.color;
    this.hp = this.maxHp = cfg.hp;
  }

  update() {
    this.y += this.vy * GameState.timeScale;
    this.x += this.vx * GameState.timeScale;
    
    if (this.x < this.size || this.x > ctx.canvas.width - this.size) {
      this.vx = -this.vx;
    }
    
    if (this.y > ctx.canvas.height + 50) this.active = false;
  }

  draw() {
    const half = this.size / 2;
    const drawers = {
      basic: () => this.drawBasic(half),
      fast: () => this.drawFast(half),
      tank: () => this.drawTank(half),
      shooter: () => this.drawShooter(half),
      splitter: () => this.drawSplitter(half)
    };
    
    drawers[this.type]();
    this.drawHpBar(half);
  }

  drawBasic(half) {
    const breathe = Math.sin(performance.now() / 300 + this.x * 0.1) * 2;
    const size = this.size + breathe;
    const h = size / 2;
    
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - h, this.y - h, size, size);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x - 6 + breathe * 0.3, this.y - 4, 4, 4);
    ctx.fillRect(this.x + 2 - breathe * 0.3, this.y - 4, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - 4 + breathe * 0.3, this.y, 2, 4);
    ctx.fillRect(this.x + 2 - breathe * 0.3, this.y, 2, 4);
  }

  drawFast(half) {
    const breathe = Math.sin(performance.now() / 400 + this.x * 0.2) * 3;
    const h = half + breathe;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - h);
    ctx.lineTo(this.x + h, this.y + h);
    ctx.lineTo(this.x - h, this.y + h);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, 102, 0, ${0.7 + Math.sin(performance.now() / 100) * 0.3})`;
    ctx.fillRect(this.x - 3, this.y + h - 5, 6, 5);
  }

  drawTank(half) {
    const breathe = Math.sin(performance.now() / 400) * 1;
    const h = half + breathe;
    
    ctx.fillStyle = '#444444';
    ctx.fillRect(this.x - h, this.y - h, h * 2, h * 2);
    ctx.fillStyle = '#666666';
    ctx.fillRect(this.x - h + 4, this.y - h + 4, h * 2 - 8, h * 2 - 8);
    
    ctx.fillStyle = `rgba(255, 102, 102, ${0.6 + Math.sin(performance.now() / 200) * 0.4})`;
    ctx.fillRect(this.x - 8, this.y - 4, 6, 4);
    ctx.fillRect(this.x + 2, this.y - 4, 6, 4);
  }

  drawShooter(half) {
    const wobble = Math.sin(performance.now() / 200) * 2;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, half + wobble, half, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - 5, this.y - 5, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(this.x - 7, this.y - 7, 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    const eyeOffset = Math.sin(performance.now() / 500) * 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(this.x - 7, this.y - 2, 5, 6, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.x + 7, this.y - 2, 5, 6, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#1a472a';
    ctx.beginPath();
    ctx.arc(this.x - 6 + eyeOffset, this.y - 1, 2.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 8 + eyeOffset, this.y - 1, 2.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x - 7 + eyeOffset, this.y - 2, 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 7 + eyeOffset, this.y - 2, 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  drawSplitter(half) {
    const breathe = Math.sin(performance.now() / 500 + this.y * 0.1) * 3;
    const h = half + breathe;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - h);
    ctx.lineTo(this.x + h, this.y);
    ctx.lineTo(this.x, this.y + h);
    ctx.lineTo(this.x - h, this.y);
    ctx.closePath();
    ctx.fill();
    
    const coreSize = 6 + Math.sin(performance.now() / 400) * 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHpBar(half) {
    if (this.hp >= this.maxHp) return;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - half, this.y - half - 10, this.size, 5);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x - half + 1, this.y - half - 9, (this.size - 2) * (this.hp / this.maxHp), 3);
  }

  onHit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
      for (let i = 0; i < 6; i++) {
        GameObjects.particles.push(new Particle(this.x, this.y, this.color));
      }
      return true;
    }
    return false;
  }
}
