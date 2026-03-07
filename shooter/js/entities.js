/**
 * 游戏实体类
 */

import { ITEM_TYPES, ENEMY_CONFIGS, COLORS, BOSS_TYPES } from './config.js';
import { GameState, PlayerState, GameObjects, ctx } from './state.js';
import { normalizeAngle } from './utils.js';

// ==================== 粒子 ====================
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
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ==================== 玩家 ====================
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
        
        // 无敌状态 - 闪烁效果
        if (PlayerState.invincible) {
            const remaining = PlayerState.invincibleEndTime - now;
            // 最后0.5秒闪烁加快
            const flashSpeed = remaining < 500 ? 50 : 100;
            if (Math.floor(now / flashSpeed) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }
        }
        
        // 护盾特效 - 多层旋转光环
        if (PlayerState.shield > 0) {
            const shieldRadius = s + 15 + Math.sin(now / 200) * 3;
            const rotation = now / 500;
            
            // 外层光环
            ctx.strokeStyle = `rgba(0, 255, 170, ${0.6 + Math.sin(now / 150) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, shieldRadius, rotation, rotation + Math.PI * 1.5);
            ctx.stroke();
            
            // 内层光环（反向旋转）
            ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 + Math.sin(now / 200) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, shieldRadius - 5, -rotation * 1.5, -rotation * 1.5 + Math.PI);
            ctx.stroke();
            
            // 护盾光点
            for (let i = 0; i < PlayerState.shield; i++) {
                const angle = rotation + (i / Math.max(1, PlayerState.shield)) * Math.PI * 2;
                const dotX = this.x + Math.cos(angle) * shieldRadius;
                const dotY = this.y + Math.sin(angle) * shieldRadius;
                ctx.fillStyle = '#00ffaa';
                ctx.beginPath();
                ctx.arc(dotX, dotY, 3 + Math.sin(now / 100 + i) * 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 整体发光
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 10;
        }
        
        ctx.shadowColor = COLORS.player;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - s);
        ctx.lineTo(this.x + s * 0.7, this.y + s * 0.5);
        ctx.lineTo(this.x, this.y + s * 0.2);
        ctx.lineTo(this.x - s * 0.7, this.y + s * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y - s * 0.2, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        const flameSize = inputState.mouseDown ? 15 : 8;
        ctx.fillStyle = `rgba(0, 200, 255, ${0.5 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.3, this.y + s * 0.3);
        ctx.lineTo(this.x, this.y + s * 0.3 + flameSize);
        ctx.lineTo(this.x + s * 0.3, this.y + s * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // 恢复透明度（无敌闪烁效果）
        if (PlayerState.invincible) {
            ctx.globalAlpha = 1;
        }
    }
}

// ==================== 僚机 ====================
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
        
        // 发光效果
        ctx.shadowColor = COLORS.wingman;
        ctx.shadowBlur = 10 + pulse;
        
        // 僚机主体 - 小三角形飞船
        const size = 8 + pulse * 0.5;
        ctx.fillStyle = COLORS.wingman;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - size);
        ctx.lineTo(this.x + size * 0.7, this.y + size * 0.5);
        ctx.lineTo(this.x - size * 0.7, this.y + size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 中心亮点
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 引擎火焰
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

// ==================== 子弹 ====================
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
        this.color = null; // 允许自定义颜色
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
        
        // 使用自定义颜色或默认颜色
        const bulletColor = this.color || (this.isEnemy ? COLORS.enemyBullet : COLORS.bullet);
        
        if (this.isEnemy) {
            // 敌方子弹 - 菱形/椭圆形状，带发光效果
            ctx.shadowColor = bulletColor;
            ctx.shadowBlur = 8;
            
            ctx.fillStyle = bulletColor;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, s, s * 1.2, this.angle, 0, Math.PI * 2);
            ctx.fill();
            
            // 内部高光
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(this.x - s*0.3, this.y - s*0.3, s * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        } else {
            // 玩家子弹 - 细长条形
            ctx.fillStyle = bulletColor;
            ctx.fillRect(this.x - s/2, this.y - s, s, s * 2);
            
            ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
            ctx.fillRect(this.x - s/4, this.y, s/2, s);
        }
    }
}

// ==================== 道具 ====================
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
        ctx.arc(this.x, this.y + bob, s/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y + bob);
    }
}

// ==================== 敌人 ====================
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
        
        // 眼睛随呼吸移动
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
        
        // 引擎发光
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
        
        // 眼睛发光
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
        
        // 中心核心脉动
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
            // 小怪死亡粒子效果
            for (let i = 0; i < 6; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, this.color));
            }
            return true;
        }
        return false;
    }
}

// ==================== Boss 基类 ====================
export class Boss extends Enemy {
    constructor(bossType = null) {
        super();
        this.type = 'boss';
        this.bossType = bossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        
        // Boss 名称映射
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
        const barHeight = 8;
        const barY = this.y - h - 20;
        
        if (GameState.bossKillCount > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv.${GameState.bossKillCount}`, this.x, barY - 8);
        }
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2 - 2, barY - 2, barWidth + 4, barHeight + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const hpPercent = this.hp / this.maxHp;
        const hpColor = this.phase === 3 ? '#00cc00' : this.phase === 2 ? '#ffcc00' : '#ff0000';
        const hpWidth = (barWidth - 2) * hpPercent;
        
        ctx.fillStyle = hpColor;
        ctx.fillRect(this.x - barWidth/2 + 1, barY + 1, hpWidth, barHeight - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(this.x - barWidth/2 + 1, barY + 1, hpWidth, 2);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(this.hp)}/${this.maxHp}`, this.x, barY + 6);
    }

    onHit(damage) {
        this.hp -= damage;
        for (let i = 0; i < 2; i++) {
            GameObjects.particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#ff6b6b'));
        }
        if (this.hp <= 0) {
            this.active = false;
            GameState.bossKillCount++;
            for (let i = 0; i < 30; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, '#ffd700'));
                GameObjects.particles.push(new Particle(this.x, this.y, '#ff6b6b'));
                GameObjects.particles.push(new Particle(this.x, this.y, '#ff0000'));
            }
            return true;
        }
        return false;
    }
}
