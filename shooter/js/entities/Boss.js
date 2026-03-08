/**
 * Boss 基类
 */

import { Enemy } from './Enemy.js';
import { GameState, GameObjects, ctx } from '../state.js';
import { BOSS_TYPES } from '../config.js';
import { Particle } from './Particle.js';

export class Boss extends Enemy {
  constructor(bossType = null) {
    super();
    this.type = 'boss';
    this.bossType = bossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
    
    const bossNames = {
      'Destroyer': '毁灭者',
      'FrostGiant': '冰霜巨人',
      'LightningRider': '闪电行者',
      'MechSpider': '机械蜘蛛',
      'ShadowAssassin': '暗影刺客',
      'ChaosEye': '混沌之眼'
    };
    this.name = bossNames[this.bossType] || this.bossType;
    
    const scale = 1 + GameState.bossKillCount * 0.1;
    this.size = 80 * scale;
    this.hp = Math.floor(90 * scale);
    this.maxHp = this.hp;
    this.hpPerPhase = Math.floor(30 * scale);
    this.phase = 3;
    this.x = ctx.canvas.width / 2;
    this.y = -80;
    this.lastShot = 0;
    this.shotPattern = 0;
    this.shotInterval = Math.max(500, 1500 - GameState.bossKillCount * 150);
    this.timeOffset = Math.random() * 1000;
    
    this.initBoss();
  }

  initBoss() {}

  getCurrentPhase() {
    const p1 = this.hpPerPhase;
    const p2 = this.hpPerPhase * 2;
    if (this.hp > p2) return 3;
    if (this.hp > p1) return 2;
    return 1;
  }

  update(now) {
    this.updateMovement(now);
    
    const newPhase = this.getCurrentPhase();
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.onPhaseChange();
    }
    
    const currentShotInterval = this.shotInterval - (3 - this.phase) * 200;
    if (now - this.lastShot > currentShotInterval) {
      this.firePattern();
      this.lastShot = now;
    }
    
    this.checkBounds();
  }

  updateMovement(now) {}

  onPhaseChange() {
    for (let i = 0; i < 20; i++) {
      GameObjects.particles.push(new Particle(this.x, this.y, '#ffd700'));
    }
  }

  checkBounds() {
    if (this.x < this.size) this.x = this.size;
    if (this.x > ctx.canvas.width - this.size) this.x = ctx.canvas.width - this.size;
    if (this.y > ctx.canvas.height - this.size) this.y = ctx.canvas.height - this.size;
    if (this.y < this.size) this.y = this.size;
  }

  firePattern() {}

  draw() {
    this.drawBoss();
    this.drawName();
    this.drawHpBar();
  }

  drawName() {
    const h = this.size / 2;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.name, this.x, this.y - h - 35);
    ctx.shadowBlur = 0;
  }

  drawHpBar() {
    const h = this.size / 2;
    const barWidth = this.size + 20;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - barWidth / 2 - 2, this.y - h - 25 - 2, barWidth + 4, 14);
    
    const phaseColors = { 3: '#00ff00', 2: '#ffff00', 1: '#ff0000' };
    ctx.fillStyle = phaseColors[this.phase];
    ctx.fillRect(this.x - barWidth / 2, this.y - h - 25, barWidth * (this.hp / this.maxHp), 10);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.hp}/${this.maxHp}`, this.x, this.y - h - 16);
  }

  drawBoss() {}
}
