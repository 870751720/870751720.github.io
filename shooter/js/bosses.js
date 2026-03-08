/**
 * Boss 子类实现 - 每个Boss都有独特的弹幕颜色方案
 */

import { Boss, Bullet, Particle } from './entities/index.js';
import { GameState, PlayerState, GameObjects, ctx } from './state.js';

// ==================== 毁灭者 - 火系（橙红渐变）====================
export class Destroyer extends Boss {
    initBoss() {
        this.vx = 2 + GameState.bossKillCount * 0.3;
        this.vy = 0.3 + GameState.bossKillCount * 0.1;
        // 毁灭者颜色方案：橙红系
        this.bulletColors = ['#ff4500', '#ff6600', '#ff8c00', '#ffa500', '#ff6347'];
    }

    updateMovement(now) {
        this.x += this.vx * GameState.timeScale;
        this.y += this.vy * GameState.timeScale;
        
        if (this.x < this.size || this.x > ctx.canvas.width - this.size) {
            this.vx = -this.vx;
        }
        if (this.y > ctx.canvas.height - 100) this.vy = -Math.abs(this.vy);
        if (this.y < 100) this.vy = Math.abs(this.vy);
    }

    onPhaseChange() {
        super.onPhaseChange();
        this.vx *= 1.2;
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const patternCount = this.phase === 3 ? 3 : this.phase === 2 ? 4 : 5;
        this.shotPattern = (this.shotPattern + 1) % patternCount;

        const patterns = [
            () => {
                const count = 3 + (3 - this.phase) + bonusCount;
                for (let i = 0; i < count; i++) {
                    const angle = (i - (count - 1) / 2) * 0.3;
                    const b = new Bullet(this.x, this.y + 30, angle, true);
                    b.color = this.bulletColors[0]; // 深橙红
                    b.size = 8;
                    GameObjects.enemyBullets.push(b);
                }
            },
            () => {
                const count = this.phase === 1 ? 3 + bonusCount : 2 + bonusCount;
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * 15;
                    const angle = Math.atan2(GameObjects.player.x - (this.x + offset), -(GameObjects.player.y - this.y));
                    const b = new Bullet(this.x + offset, this.y + 30, angle, true);
                    b.color = this.bulletColors[1]; // 橙
                    b.size = 7;
                    GameObjects.enemyBullets.push(b);
                }
            },
            () => {
                const count = 4 + (3 - this.phase) + bonusCount;
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.color = this.bulletColors[2]; // 暗橙
                    b.size = 9;
                    GameObjects.enemyBullets.push(b);
                }
            },
            () => {
                for (let i = -2 - bonusCount; i <= 2 + bonusCount; i++) {
                    const b1 = new Bullet(this.x - 40, this.y + 20, i * 0.25, true);
                    const b2 = new Bullet(this.x + 40, this.y + 20, -i * 0.25, true);
                    b1.color = b2.color = this.bulletColors[3]; // 金橙
                    b1.size = b2.size = 6;
                    GameObjects.enemyBullets.push(b1, b2);
                }
            },
            () => {
                for (let i = 0; i < 6 + bonusCount; i++) {
                    const angle = (i / (6 + bonusCount)) * Math.PI * 2;
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.color = this.bulletColors[4]; // 番茄红
                    b.size = 10;
                    GameObjects.enemyBullets.push(b);
                }
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
                const b = new Bullet(this.x, this.y + 30, angle, true);
                b.color = this.bulletColors[0];
                b.size = 12;
                GameObjects.enemyBullets.push(b);
            }
        ];

        patterns[this.shotPattern]();
    }

    drawBoss() {
        const h = this.size / 2;
        const phaseColors = ['#ff0000', '#ff6600', '#ff4444'];
        const bodyColor = phaseColors[this.phase - 1] || '#ff4444';
        
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - h, this.y - h, this.size, this.size);
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - h + 5, this.y - h + 5, this.size - 10, this.size - 10);
        
        ctx.fillStyle = '#ffd700';
        this.drawTriangle(this.x - h, this.y - h, -10, -15, 10, 0);
        this.drawTriangle(this.x + h, this.y - h, 10, -15, -10, 0);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 20, this.y - 15, 12, 12);
        ctx.fillRect(this.x + 8, this.y - 15, 12, 12);
        const eyeColors = ['#ff0000', '#ff6600', '#ffff00'];
        ctx.fillStyle = eyeColors[this.phase - 1] || '#ff0000';
        ctx.fillRect(this.x - 17, this.y - 12, 6, 6);
        ctx.fillRect(this.x + 11, this.y - 12, 6, 6);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 30, this.y + h - 10, 20, 15);
        ctx.fillRect(this.x + 10, this.y + h - 10, 20, 15);
    }

    drawTriangle(x, y, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + x1, y + y1);
        ctx.lineTo(x + x2, y + y2);
        ctx.fill();
    }
}

// ==================== 冰霜巨人 - 冰系（青蓝白）====================
export class FrostGiant extends Boss {
    initBoss() {
        this.color = '#4dd0e1';
        // 冰霜颜色方案：冰系青蓝
        this.bulletColors = ['#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2', '#e0f7fa'];
    }

    updateMovement(now) {
        const t = (now + this.timeOffset) / 2000;
        this.x = ctx.canvas.width / 2 + Math.sin(t) * 200;
        this.y = 100 + Math.sin(t * 0.5) * 30;
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;

        if (pattern === 0) {
            const count = 3 + Math.floor(bonusCount / 2);
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 2;
                b.size = 14;
                b.color = this.bulletColors[0]; // 深青
                GameObjects.enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            const count = 2 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y)) + (i - 1) * 0.4;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 2.5;
                b.size = 12;
                b.color = this.bulletColors[1]; // 青
                GameObjects.enemyBullets.push(b);
            }
        } else {
            const rings = 2 + Math.floor(bonusCount / 3);
            for (let r = 0; r < rings; r++) {
                setTimeout(() => {
                    const count = 4 + bonusCount;
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const b = new Bullet(this.x, this.y, angle, true);
                        b.speed = 1.5 + r * 0.8;
                        b.size = 10 + r * 2;
                        b.color = this.bulletColors[2 + r % 3]; // 浅青到白
                        GameObjects.enemyBullets.push(b);
                    }
                }, r * 400);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 1000;
        
        ctx.fillStyle = this.phase === 3 ? '#4dd0e1' : this.phase === 2 ? '#26c6da' : '#00bcd4';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + t * 0.5;
            const r = h + Math.sin(t * 2 + i) * 5;
            const x = this.x + Math.cos(angle) * r;
            const y = this.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#006064';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = t + i * 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, h + 10 + i * 5 + Math.sin(t * 3) * 3, angle, angle + 1);
            ctx.stroke();
        }
    }
}

// ==================== 闪电行者 - 雷系（金黄）====================
export class LightningRider extends Boss {
    initBoss() {
        this.moveTimer = 0;
        this.color = '#ffeb3b';
        // 雷电颜色方案：金黄
        this.bulletColors = ['#ffd700', '#ffeb3b', '#fff176', '#fff59d', '#fffde7'];
    }

    updateMovement(now) {
        this.moveTimer += 16;
        if (this.moveTimer > 2000 - GameState.bossKillCount * 100) {
            this.moveTimer = 0;
            for (let i = 0; i < 10; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
            this.x = 100 + Math.random() * (ctx.canvas.width - 200);
            this.y = 80 + Math.random() * 150;
            for (let i = 0; i < 10; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
        }
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;

        if (pattern === 0) {
            const zigzags = 2 + Math.floor(bonusCount / 2);
            for (let i = 0; i < zigzags; i++) {
                const startX = this.x + (i - 1) * 50;
                for (let j = 0; j < 4; j++) {
                    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
                    const b = new Bullet(startX + (Math.random() - 0.5) * 20, this.y + j * 25, angle, true);
                    b.speed = 12;
                    b.size = 4;
                    b.color = this.bulletColors[0]; // 金
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            const count = 5 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.PI / 2 + (i - count / 2) * 0.12;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 15;
                b.size = 5;
                b.color = this.bulletColors[1]; // 黄
                GameObjects.enemyBullets.push(b);
            }
        } else {
            const orbs = 1 + Math.floor(bonusCount / 2);
            for (let i = 0; i < orbs; i++) {
                const angle = (i / orbs) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 6;
                b.size = 18;
                b.color = this.bulletColors[2]; // 浅黄
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 50;
        
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, h - i * 10 + Math.sin(t + i) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = this.phase === 3 ? '#fff176' : this.phase === 2 ? '#ffee58' : '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f57f17';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 8);
        ctx.lineTo(this.x - 8, this.y);
        ctx.lineTo(this.x - 12, this.y + 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y - 8);
        ctx.lineTo(this.x + 8, this.y);
        ctx.lineTo(this.x + 12, this.y + 8);
        ctx.fill();
        
        if (Math.random() < 0.3) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - h, this.y);
            ctx.lineTo(this.x - h - 20, this.y + (Math.random() - 0.5) * 40);
            ctx.stroke();
        }
    }
}

// ==================== 机械蜘蛛 - 机械系（灰绿）====================
export class MechSpider extends Boss {
    initBoss() {
        this.edge = 0;
        this.progress = 0.5;
        this.color = '#78909c';
        // 机械颜色方案：灰绿
        this.bulletColors = ['#455a64', '#607d8b', '#78909c', '#90a4ae', '#b0bec5'];
    }

    updateMovement(now) {
        const speed = (0.002 + GameState.bossKillCount * 0.0002) * GameState.timeScale;
        this.progress += speed;
        
        if (this.progress > 1) {
            this.progress = 0;
            this.edge = (this.edge + 1) % 4;
        }
        
        const margin = 80;
        const w = ctx.canvas.width - margin * 2;
        const h = ctx.canvas.height - margin * 2;
        
        switch(this.edge) {
            case 0: this.x = margin + this.progress * w; this.y = margin; break;
            case 1: this.x = ctx.canvas.width - margin; this.y = margin + this.progress * h; break;
            case 2: this.x = ctx.canvas.width - margin - this.progress * w; this.y = ctx.canvas.height - margin; break;
            case 3: this.x = margin; this.y = ctx.canvas.height - margin - this.progress * h; break;
        }
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;

        if (pattern === 0) {
            const count = 5 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                for (let j = 1; j <= 3; j++) {
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.speed = 1.5 + j * 0.5;
                    b.size = 6 + j * 3;
                    b.color = this.bulletColors[j - 1];
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            const count = 4 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y)) + (i - count/2) * 0.3;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3;
                b.size = 14;
                b.color = this.bulletColors[1];
                GameObjects.enemyBullets.push(b);
            }
        } else {
            const count = 10 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 2;
                b.size = 10;
                b.color = this.bulletColors[i % 5];
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 200;
        
        ctx.fillStyle = this.phase === 3 ? '#78909c' : this.phase === 2 ? '#546e7a' : '#37474f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#455a64';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + t * 0.1;
            const legLen = h + 15 + Math.sin(t + i) * 5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(angle) * legLen, this.y + Math.sin(angle) * legLen);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffab91';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==================== 暗影刺客 - 暗影系（紫）====================
export class ShadowAssassin extends Boss {
    initBoss() {
        this.stealthTimer = 0;
        this.isStealth = false;
        this.color = '#7e57c2';
        // 暗影颜色方案：紫系
        this.bulletColors = ['#4527a0', '#512da8', '#673ab7', '#7e57c2', '#9575cd'];
    }

    updateMovement(now) {
        this.stealthTimer += 16;
        if (this.stealthTimer > 3000) {
            this.stealthTimer = 0;
            this.isStealth = !this.isStealth;
            
            if (!this.isStealth) {
                this.x = GameObjects.player.x + (Math.random() - 0.5) * 200;
                this.y = GameObjects.player.y - 100 - Math.random() * 100;
                for (let i = 0; i < 5; i++) {
                    GameObjects.particles.push(new Particle(this.x, this.y, '#7e57c2'));
                }
            }
        }
        
        if (!this.isStealth) {
            this.x += Math.sin(now / 500) * 2;
            this.y += Math.cos(now / 500) * 1;
        }
    }

    firePattern() {
        if (this.isStealth) return;

        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;

        if (pattern === 0) {
            const count = 6 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y)) + (i - count / 2) * 0.15;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 14;
                b.size = 3;
                b.color = this.bulletColors[3]; // 浅紫
                GameObjects.enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            for (let dir = 0; dir < 4; dir++) {
                const baseAngle = dir * Math.PI / 2;
                for (let i = -1; i <= 1; i++) {
                    const b = new Bullet(this.x, this.y, baseAngle + i * 0.2, true);
                    b.speed = 10;
                    b.size = 4;
                    b.color = this.bulletColors[4]; // 淡紫
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else {
            const count = 8 + bonusCount;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
                    const b = new Bullet(this.x, this.y, angle + (Math.random() - 0.5) * 0.4, true);
                    b.speed = 12;
                    b.size = 3;
                    b.color = this.bulletColors[i % 3]; // 深浅交替
                    GameObjects.enemyBullets.push(b);
                }, i * 80);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const alpha = this.isStealth ? 0.3 : 1;
        
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.phase === 3 ? '#7e57c2' : this.phase === 2 ? '#5e35b1' : '#4527a0';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - h);
        ctx.lineTo(this.x + h * 0.7, this.y + h * 0.5);
        ctx.lineTo(this.x - h * 0.7, this.y + h * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#e1bee7';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(126, 87, 194, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(this.x - h, this.y);
        ctx.quadraticCurveTo(this.x, this.y + h * 1.5, this.x + h, this.y);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// ==================== 混沌之眼 - 混沌系（粉紫）====================
export class ChaosEye extends Boss {
    initBoss() {
        this.orbitAngle = 0;
        this.color = '#e91e63';
        // 混沌颜色方案：粉紫
        this.bulletColors = ['#880e4f', '#c2185b', '#e91e63', '#f06292', '#f8bbd0'];
    }

    updateMovement(now) {
        this.orbitAngle += 0.01;
        this.x = ctx.canvas.width / 2 + Math.sin(this.orbitAngle) * 50;
        this.y = ctx.canvas.height / 3 + Math.cos(this.orbitAngle * 0.7) * 30;
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 4;

        if (pattern === 0) {
            const count = 4 + bonusCount;
            for (let i = 0; i < count; i++) {
                const baseAngle = performance.now() / 400 + i * (Math.PI * 2 / count);
                for (let j = 0; j < 4; j++) {
                    const b = new Bullet(this.x, this.y, baseAngle + j * 0.2, true);
                    b.speed = 2 + j * 1.5;
                    b.size = 6 + j * 2;
                    b.color = this.bulletColors[j % 5];
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            const arms = 2 + Math.floor(bonusCount / 2);
            for (let arm = 0; arm < arms; arm++) {
                for (let i = 0; i < 16; i++) {
                    const angle = (arm / arms) * Math.PI + performance.now() / 800 + i * 0.4;
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.speed = 1.5 + i * 0.4;
                    b.size = 5 + (i % 3) * 2;
                    b.color = this.bulletColors[i % 5];
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 2) {
            const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
            for (let i = 0; i < 4 + bonusCount; i++) {
                const b = new Bullet(this.x, this.y, angle + (Math.random() - 0.5) * 0.5, true);
                b.speed = 7;
                b.size = 16;
                b.color = this.bulletColors[0]; // 深粉
                GameObjects.enemyBullets.push(b);
            }
        } else {
            const count = 16 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3 + Math.random() * 6;
                b.size = 4 + Math.random() * 8;
                b.color = this.bulletColors[Math.floor(Math.random() * 5)];
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 1000;
        
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, h + i * 10, t + i, t + i + Math.PI);
            ctx.stroke();
        }
        
        ctx.fillStyle = this.phase === 3 ? '#f48fb1' : this.phase === 2 ? '#f06292' : '#e91e63';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#880e4f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 1.2 + Math.sin(t * 3) * 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
