/**
 * 僚机实体类
 */

import { ctx } from '../state.js';
import { COLORS } from '../config.js';
import { Bullet } from './Bullet.js';

export class Wingman {
  constructor(index, total) {
    this.index = index;
    this.total = total;
    this.angle = (index / total) * Math.PI * 2;
    this.radius = 60;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  update(player) {
    this.angle += 0.03;
    this.x = player.x + Math.cos(this.angle) * this.radius;
    this.y = player.y + Math.sin(this.angle) * this.radius * 0.5;
  }

  draw() {
    const pulse = Math.sin(performance.now() / 200 + this.pulseOffset) * 2;
    
    ctx.shadowColor = COLORS.wingman;
    ctx.shadowBlur = 10 + pulse;
    
    const size = 8 + pulse * 0.5;
    ctx.fillStyle = COLORS.wingman;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - size);
    ctx.lineTo(this.x + size * 0.7, this.y + size * 0.5);
    ctx.lineTo(this.x - size * 0.7, this.y + size * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = `rgba(0, 200, 255, ${0.6 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(this.x - 3, this.y + size * 0.3);
    ctx.lineTo(this.x, this.y + size * 0.3 + 6 + pulse);
    ctx.lineTo(this.x + 3, this.y + size * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  shoot() {
    return new Bullet(this.x, this.y - 10);
  }
}
