/**
 * 玩家实体类
 */

import { PlayerState, ctx } from '../state.js';
import { drawGameShip } from '../ship-renderer.js';
import { COLORS } from '../config.js';

// 颜色辅助函数
function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export class Player {
  constructor() {
    this.size = 20 + PlayerState.stats.sizeLevel * 5;
    this.x = ctx.canvas.width / 2;
    this.y = ctx.canvas.height - 100;
  }

  update(inputState) {
    const dx = inputState.mouseX - this.x;
    const dy = inputState.mouseY - this.y;
    this.x += dx * 0.15;
    this.y += dy * 0.15;
  }

  draw(inputState) {
    const s = this.size;
    const now = performance.now();
    const rank = PlayerState.shipRank || 'C';
    const shipColor = PlayerState.shipColor || COLORS.player;
    
    if (PlayerState.invincible) {
      const remaining = PlayerState.invincibleEndTime - now;
      const flashSpeed = remaining < 500 ? 50 : 100;
      if (Math.floor(now / flashSpeed) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
    }
    
    if (PlayerState.shield > 0) {
      this.drawShieldEffect(s, now);
    }
    
    drawGameShip(ctx, this.x, this.y, s, rank, shipColor, now, inputState.mouseDown);
    
    if (PlayerState.invincible) {
      ctx.globalAlpha = 1;
    }
  }

  drawShieldEffect(s, now) {
    const shieldRadius = s + 15 + Math.sin(now / 200) * 3;
    const rotation = now / 500;
    
    ctx.strokeStyle = `rgba(0, 255, 170, ${0.6 + Math.sin(now / 150) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, shieldRadius, rotation, rotation + Math.PI * 1.5);
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 + Math.sin(now / 200) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, shieldRadius - 5, -rotation * 1.5, -rotation * 1.5 + Math.PI);
    ctx.stroke();
    
    for (let i = 0; i < PlayerState.shield; i++) {
      const angle = rotation + (i / Math.max(1, PlayerState.shield)) * Math.PI * 2;
      const dotX = this.x + Math.cos(angle) * shieldRadius;
      const dotY = this.y + Math.sin(angle) * shieldRadius;
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3 + Math.sin(now / 100 + i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
