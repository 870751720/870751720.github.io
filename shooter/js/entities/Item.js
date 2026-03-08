/**
 * 道具实体类
 */

import { PlayerState, ctx } from '../state.js';
import { ITEM_TYPES } from '../config.js';

export class Item {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.active = true;
    this.vy = 2;
    this.bobOffset = Math.random() * Math.PI * 2;
    
    const availableTypes = ITEM_TYPES.filter(type => {
      if (!type.permanent) return true;
      const stats = PlayerState.stats;
      if (type.id === 'spread') return stats.multiShot < 3;
      if (type.id === 'big') return stats.bulletSizeBuff < 2.5;
      if (type.id === 'perm_spd') return stats.fireRate > 50;
      if (type.id === 'perm_dmg') return stats.damage < 10;
      if (type.id === 'wingman') return stats.wingmanCount < 3;
      if (type.id === 'maxhp') return PlayerState.maxHp < 10;
      return true;
    });
    
    this.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  update(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < PlayerState.stats.magnetRange + 50) {
      this.x += (player.x - this.x) * 0.1;
      this.y += (player.y - this.y) * 0.1;
    } else {
      this.y += this.vy;
    }
    
    if (this.y > ctx.canvas.height + 50) this.active = false;
  }

  draw(timestamp) {
    const bob = Math.sin(timestamp / 200 + this.bobOffset) * 3;
    const s = this.size;
    
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = this.type.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y + bob, s / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, this.x, this.y + bob);
  }
}
