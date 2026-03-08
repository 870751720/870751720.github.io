/**
 * 子弹实体类
 */

import { GameState, PlayerState, GameObjects, ctx } from '../state.js';
import { COLORS } from '../config.js';
import { normalizeAngle } from '../utils.js';
import { Particle } from './Particle.js';

export class Bullet {
  constructor(x, y, angle = 0, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.isEnemy = isEnemy;
    this.speed = isEnemy ? 4 : 10;
    this.size = (isEnemy ? 6 : 4) * (isEnemy ? 1 : PlayerState.stats.bulletSize * PlayerState.stats.bulletSizeBuff);
    this.damage = isEnemy ? 1 : PlayerState.stats.damage;
    this.active = true;
    this.color = null;
  }

  update(enemies) {
    if (!this.isEnemy && PlayerState.stats.homing && enemies.length > 0) {
      let nearest = null;
      let minDist = Infinity;
      
      for (const e of enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - this.x, e.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = e;
        }
      }
      
      if (nearest && minDist < 400) {
        const targetAngle = Math.atan2(nearest.x - this.x, -(nearest.y - this.y));
        let diff = normalizeAngle(targetAngle - this.angle);
        const turnSpeed = minDist < 50 ? 0.3 : 0.15;
        const maxTurn = Math.min(Math.abs(diff), turnSpeed);
        this.angle += Math.sign(diff) * maxTurn;
        
        if (minDist < nearest.size / 2 + this.size) {
          nearest.onHit(this.damage);
          this.active = false;
          for (let i = 0; i < 3; i++) {
            GameObjects.particles.push(new Particle(this.x, this.y, '#fff'));
          }
          return;
        }
      }
    }
    
    this.x += Math.sin(this.angle) * this.speed * GameState.timeScale;
    this.y -= Math.cos(this.angle) * this.speed * GameState.timeScale;
    
    if (this.y < 0 || this.y > ctx.canvas.height || this.x < 0 || this.x > ctx.canvas.width) {
      this.active = false;
    }
  }

  draw() {
    const s = this.size;
    const bulletColor = this.color || (this.isEnemy ? COLORS.enemyBullet : COLORS.bullet);
    
    if (this.isEnemy) {
      ctx.shadowColor = bulletColor;
      ctx.shadowBlur = 8;
      
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, s, s * 1.2, this.angle, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(this.x - s * 0.3, this.y - s * 0.3, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = bulletColor;
      ctx.fillRect(this.x - s / 2, this.y - s, s, s * 2);
      
      ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
      ctx.fillRect(this.x - s / 4, this.y, s / 2, s);
    }
  }
}
