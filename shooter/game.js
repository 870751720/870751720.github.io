/**
 * 太空弹幕射击游戏 - Space Shooter
 * 基于 HTML5 Canvas 的纵向卷轴弹幕射击游戏
 * 
 * @author 贺加文
 * @version 2.0
 */

// ============================================================
// 第一部分：常量与配置
// ============================================================

/** 道具类型定义 */
const ITEM_TYPES = [
    // 临时 Buff（持续一定时间）
    { id: 'rapid', name: '疾速射击', color: '#00ff00', duration: 50000, icon: '⚡' },
    { id: 'slow', name: '时间缓速', color: '#00ffff', duration: 40000, icon: '❄' },
    { id: 'double', name: '分数翻倍', color: '#ffd700', duration: 80000, icon: '×2' },
    { id: 'homing', name: '追踪弹', color: '#ff8800', duration: 45000, icon: '➤' },
    
    // 永久升级
    { id: 'spread', name: '散弹枪', color: '#ff6600', duration: 0, icon: '✦', permanent: true },
    { id: 'big', name: '巨型子弹', color: '#ff00ff', duration: 0, icon: '●', permanent: true },
    { id: 'perm_spd', name: '永久攻速+', color: '#ffffff', duration: 0, icon: '↑⚡', permanent: true },
    { id: 'perm_dmg', name: '永久伤害+', color: '#ff4444', duration: 0, icon: '↑✦', permanent: true },
    { id: 'wingman', name: '僚机', color: '#00aaff', duration: 0, icon: '✈', permanent: true },
    { id: 'maxhp', name: '生命上限+', color: '#ff8888', duration: 0, icon: '↑♥', permanent: true },
    { id: 'playersize', name: '机体变大', color: '#aaaaaa', duration: 0, icon: '↑□', permanent: true },
    
    // 即时效果
    { id: 'shield', name: '护盾', color: '#00ffaa', duration: 0, icon: '⛨' },
    { id: 'heal', name: '回血', color: '#ff5555', duration: 0, icon: '♥', instant: true }
];

/** 敌人类型 */
const ENEMY_TYPES = ['basic', 'fast', 'tank', 'shooter', 'splitter'];

/** Boss 类型列表 */
const BOSS_TYPES = ['Destroyer', 'FrostGiant', 'LightningRider', 'MechSpider', 'ShadowAssassin', 'ChaosEye'];

/** 游戏颜色配置 */
const COLORS = {
    background: '#1a1a2e',
    player: '#9d8df7',
    wingman: '#00aaff',
    bullet: '#ffffff',
    enemyBullet: '#ff6666'
};

// ============================================================
// 第二部分：游戏状态
// ============================================================

const GameState = {
    running: false,
    score: 0,
    killCount: 0,
    combo: 0,
    lastKillTime: 0,
    lastEnemySpawn: 0,
    enemySpawnInterval: 800,
    bossKillCount: 0,
    timeScale: 1
};

const PlayerState = {
    hp: 3,
    maxHp: 3,
    shield: 0,
    stats: {
        fireRate: 150,
        bulletSize: 1,
        bulletSizeBuff: 1,
        damage: 1,
        multiShot: 1,
        magnetRange: 0,
        scoreMultiplier: 1,
        wingmanCount: 0,
        sizeLevel: 1,
        homing: false
    }
};

const InputState = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    lastShotTime: 0
};

// 游戏对象容器
const GameObjects = {
    player: null,
    wingmen: [],
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    items: [],
    activeBuffs: {}
};

// DOM 引用
const DOM = {};

// Canvas 上下文
let ctx = null;
let animationId = null;
let comboTimer = null;

// ============================================================
// 第三部分：工具函数
// ============================================================

/**
 * 显示浮动文字
 */
function showFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

/**
 * 碰撞检测（AABB）
 */
function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.size + b.size) / 2 &&
           Math.abs(a.y - b.y) < (a.size + b.size) / 2;
}

/**
 * 角度归一化到 [-PI, PI]
 */
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// ============================================================
// 第四部分：粒子系统
// ============================================================

class Particle {
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

// ============================================================
// 第五部分：玩家与僚机
// ============================================================

class Player {
    constructor() {
        this.size = 20 + PlayerState.stats.sizeLevel * 5;
    }

    update() {
        // 平滑跟随鼠标
        const dx = InputState.mouseX - this.x;
        const dy = InputState.mouseY - this.y;
        this.x += dx * 0.15;
        this.y += dy * 0.15;
    }

    draw() {
        const s = this.size;
        
        // 机体光晕
        ctx.shadowColor = COLORS.player;
        ctx.shadowBlur = 15;
        
        // 主体
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - s);
        ctx.lineTo(this.x + s * 0.7, this.y + s * 0.5);
        ctx.lineTo(this.x, this.y + s * 0.2);
        ctx.lineTo(this.x - s * 0.7, this.y + s * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 驾驶舱
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y - s * 0.2, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // 引擎火焰
        const flameSize = InputState.mouseDown ? 15 : 8;
        ctx.fillStyle = `rgba(0, 200, 255, ${0.5 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(this.x - s * 0.3, this.y + s * 0.3);
        ctx.lineTo(this.x, this.y + s * 0.3 + flameSize);
        ctx.lineTo(this.x + s * 0.3, this.y + s * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

class Wingman {
    constructor(index, total) {
        this.index = index;
        this.total = total;
        this.angle = (index / total) * Math.PI * 2;
        this.radius = 60;
    }

    update() {
        this.angle += 0.03;
        this.x = GameObjects.player.x + Math.cos(this.angle) * this.radius;
        this.y = GameObjects.player.y + Math.sin(this.angle) * this.radius * 0.5;
    }

    draw() {
        ctx.fillStyle = COLORS.wingman;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    shoot() {
        return new Bullet(this.x, this.y - 10);
    }
}

// ============================================================
// 第六部分：子弹系统
// ============================================================

class Bullet {
    constructor(x, y, angle = 0, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.isEnemy = isEnemy;
        this.speed = isEnemy ? 4 : 10;
        this.size = (isEnemy ? 6 : 4) * (isEnemy ? 1 : PlayerState.stats.bulletSize * PlayerState.stats.bulletSizeBuff);
        this.damage = isEnemy ? 1 : PlayerState.stats.damage;
        this.color = isEnemy ? COLORS.enemyBullet : COLORS.bullet;
        this.active = true;
    }

    update() {
        // 追踪弹逻辑
        if (!this.isEnemy && PlayerState.stats.homing && GameObjects.enemies.length > 0) {
            let nearest = null;
            let minDist = Infinity;
            
            for (const e of GameObjects.enemies) {
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
                
                // 非常近时直接命中
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
        
        // 边界检查
        if (this.y < 0 || this.y > gameCanvas.height || this.x < 0 || this.x > gameCanvas.width) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        const s = this.size;
        ctx.fillRect(this.x - s/2, this.y - s, s, s * 2);
        
        if (!this.isEnemy) {
            ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
            ctx.fillRect(this.x - s/4, this.y, s/2, s);
        }
    }
}

// ============================================================
// 第七部分：敌人系统
// ============================================================

class Enemy {
    constructor() {
        this.type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        this.x = 30 + Math.random() * (gameCanvas.width - 60);
        this.y = -40;
        this.active = true;
        this.lastShot = 0;
        
        this.initType();
    }

    initType() {
        const configs = {
            basic: { size: 24, vx: 0, vy: 1.5, color: '#e87e7e', hp: 2 },
            fast: { size: 18, vx: () => (Math.random() - 0.5) * 2, vy: 3.5, color: '#ffff00', hp: 1 },
            tank: { size: 40, vx: 0, vy: 0.6, color: '#666666', hp: 8 },
            shooter: { size: 28, vx: 0, vy: 1, color: '#4ade80', hp: 3 },
            splitter: { size: 22, vx: 0, vy: 2, color: '#ff00ff', hp: 2 }
        };
        
        const cfg = configs[this.type];
        this.size = cfg.size;
        this.vx = typeof cfg.vx === 'function' ? cfg.vx() : cfg.vx;
        this.vy = cfg.vy;
        this.color = cfg.color;
        this.hp = this.maxHp = cfg.hp;
    }

    update() {
        this.y += this.vy * GameState.timeScale;
        this.x += this.vx * GameState.timeScale;
        
        if (this.x < this.size || this.x > gameCanvas.width - this.size) {
            this.vx = -this.vx;
        }
        
        if (this.y > gameCanvas.height + 50) this.active = false;
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
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - half, this.y - half, this.size, this.size);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 6, this.y - 4, 4, 4);
        ctx.fillRect(this.x + 2, this.y - 4, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 4, this.y, 2, 4);
        ctx.fillRect(this.x + 2, this.y, 2, 4);
    }

    drawFast(half) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - half);
        ctx.lineTo(this.x + half, this.y + half);
        ctx.lineTo(this.x - half, this.y + half);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x - 2, this.y, 4, 4);
    }

    drawTank(half) {
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.x - half, this.y - half, this.size, this.size);
        ctx.fillStyle = '#666666';
        ctx.fillRect(this.x - half + 4, this.y - half + 4, this.size - 8, this.size - 8);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(this.x - 8, this.y - 4, 6, 4);
        ctx.fillRect(this.x + 2, this.y - 4, 6, 4);
    }

    drawShooter(half) {
        const wobble = Math.sin(performance.now() / 200) * 2;
        
        // 身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, half + wobble, half, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // 高光
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
        
        // 眼睛
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
        
        // 瞳孔
        ctx.fillStyle = '#1a472a';
        ctx.beginPath();
        ctx.arc(this.x - 6 + eyeOffset, this.y - 1, 2.5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 8 + eyeOffset, this.y - 1, 2.5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // 眼睛高光
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
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - half);
        ctx.lineTo(this.x + half, this.y);
        ctx.lineTo(this.x, this.y + half);
        ctx.lineTo(this.x - half, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
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

// ============================================================
// 第八部分：Boss 系统
// ============================================================

class Boss extends Enemy {
    constructor(bossType = null) {
        super();
        this.type = 'boss';
        this.bossType = bossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        
        const scale = 1 + GameState.bossKillCount * 0.1;
        this.size = 80 * scale;
        this.hp = Math.floor(90 * scale);
        this.maxHp = this.hp;
        this.hpPerPhase = Math.floor(30 * scale);
        this.phase = 3;
        this.x = gameCanvas.width / 2;
        this.y = -80;
        this.lastShot = 0;
        this.shotPattern = 0;
        this.shotInterval = Math.max(500, 1500 - GameState.bossKillCount * 150);
        this.timeOffset = Math.random() * 1000;
        
        this.initBoss();
    }

    initBoss() {
        // 子类重写
    }

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

    updateMovement(now) {
        // 子类重写
    }

    onPhaseChange() {
        for (let i = 0; i < 20; i++) {
            GameObjects.particles.push(new Particle(this.x, this.y, '#ffd700'));
        }
    }

    checkBounds() {
        if (this.x < this.size) this.x = this.size;
        if (this.x > gameCanvas.width - this.size) this.x = gameCanvas.width - this.size;
        if (this.y > gameCanvas.height - this.size) this.y = gameCanvas.height - this.size;
        if (this.y < this.size) this.y = this.size;
    }

    firePattern() {
        // 子类重写
    }

    draw() {
        this.drawBoss();
        this.drawHpBar();
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

// -------------------- 6种 Boss 实现 --------------------

class Destroyer extends Boss {
    initBoss() {
        this.vx = 2 + GameState.bossKillCount * 0.3;
        this.vy = 0.3 + GameState.bossKillCount * 0.1;
    }

    updateMovement(now) {
        this.x += this.vx * GameState.timeScale;
        this.y += this.vy * GameState.timeScale;
        
        if (this.x < this.size || this.x > gameCanvas.width - this.size) {
            this.vx = -this.vx;
        }
        if (this.y > gameCanvas.height - 100) this.vy = -Math.abs(this.vy);
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
            // 散射
            () => {
                const count = 5 + (3 - this.phase) * 2 + bonusCount;
                for (let i = 0; i < count; i++) {
                    const angle = (i - (count - 1) / 2) * 0.3;
                    GameObjects.enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
                }
            },
            // 追踪弹
            () => {
                const count = this.phase === 1 ? 5 + bonusCount : 3 + bonusCount;
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * 15;
                    const angle = Math.atan2(GameObjects.player.x - (this.x + offset), -(GameObjects.player.y - this.y));
                    GameObjects.enemyBullets.push(new Bullet(this.x + offset, this.y + 30, angle, true));
                }
            },
            // 环形
            () => {
                const count = 6 + (3 - this.phase) * 2 + bonusCount;
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    GameObjects.enemyBullets.push(new Bullet(this.x, this.y, angle, true));
                }
            },
            // 交叉弹幕
            () => {
                for (let i = -3 - bonusCount; i <= 3 + bonusCount; i++) {
                    GameObjects.enemyBullets.push(new Bullet(this.x - 40, this.y + 20, i * 0.25, true));
                    GameObjects.enemyBullets.push(new Bullet(this.x + 40, this.y + 20, -i * 0.25, true));
                }
            },
            // 全屏弹幕
            () => {
                for (let i = 0; i < 12 + bonusCount; i++) {
                    const angle = (i / (12 + bonusCount)) * Math.PI * 2;
                    GameObjects.enemyBullets.push(new Bullet(this.x, this.y, angle, true));
                }
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
                GameObjects.enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
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
        
        // 角
        ctx.fillStyle = '#ffd700';
        this.drawTriangle(this.x - h, this.y - h, -10, -15, 10, 0);
        this.drawTriangle(this.x + h, this.y - h, 10, -15, -10, 0);
        
        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 20, this.y - 15, 12, 12);
        ctx.fillRect(this.x + 8, this.y - 15, 12, 12);
        const eyeColors = ['#ff0000', '#ff6600', '#ffff00'];
        ctx.fillStyle = eyeColors[this.phase - 1] || '#ff0000';
        ctx.fillRect(this.x - 17, this.y - 12, 6, 6);
        ctx.fillRect(this.x + 11, this.y - 12, 6, 6);
        
        // 炮管
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

class FrostGiant extends Boss {
    initBoss() {
        this.vx = 1 + GameState.bossKillCount * 0.1;
        this.vy = 0.2;
        this.color = '#4dd0e1';
    }

    updateMovement(now) {
        const t = (now + this.timeOffset) / 2000;
        this.x = gameCanvas.width / 2 + Math.sin(t) * 200;
        this.y = 100 + Math.sin(t * 0.5) * 30;
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 冰锥散射
            const count = 7 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3;
                b.color = '#4dd0e1';
                GameObjects.enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            // 冰锥追踪
            const count = 3 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y)) + (i - 1) * 0.3;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 4;
                b.color = '#4dd0e1';
                GameObjects.enemyBullets.push(b);
            }
        } else {
            // 霜冻新星
            const rings = 2 + Math.floor(bonusCount / 3);
            for (let r = 0; r < rings; r++) {
                setTimeout(() => {
                    const count = 8 + bonusCount;
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const b = new Bullet(this.x, this.y, angle, true);
                        b.speed = 2 + r;
                        b.color = '#4dd0e1';
                        GameObjects.enemyBullets.push(b);
                    }
                }, r * 300);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 1000;
        
        // 冰晶身体
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
        
        // 核心
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#006064';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 寒气效果
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

class LightningRider extends Boss {
    initBoss() {
        this.targetX = this.x;
        this.targetY = this.y;
        this.moveTimer = 0;
        this.color = '#ffeb3b';
    }

    updateMovement(now) {
        this.moveTimer += 16;
        if (this.moveTimer > 2000 - GameState.bossKillCount * 100) {
            this.moveTimer = 0;
            this.targetX = 100 + Math.random() * (gameCanvas.width - 200);
            this.targetY = 80 + Math.random() * 150;
            
            for (let i = 0; i < 10; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
            this.x = this.targetX;
            this.y = this.targetY;
            for (let i = 0; i < 10; i++) {
                GameObjects.particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
        }
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 闪电链
            const zigzags = 3 + bonusCount;
            for (let i = 0; i < zigzags; i++) {
                const startX = this.x + (i - 1) * 60;
                for (let j = 0; j < 5; j++) {
                    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                    const b = new Bullet(startX + (Math.random()-0.5)*20, this.y + j * 30, angle, true);
                    b.speed = 8;
                    b.color = '#ffeb3b';
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            // 快速散射
            const count = 12 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.PI / 2 + (i - count/2) * 0.15;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 10;
                b.color = '#ffeb3b';
                GameObjects.enemyBullets.push(b);
            }
        } else {
            // 雷电球
            const orbs = 2 + Math.floor(bonusCount / 2);
            for (let i = 0; i < orbs; i++) {
                const angle = (i / orbs) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 5;
                b.size = 12;
                b.color = '#ffeb3b';
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 50;
        
        // 雷电光环
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, h - i * 10 + Math.sin(t + i) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 核心
        ctx.fillStyle = this.phase === 3 ? '#fff176' : this.phase === 2 ? '#ffee58' : '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 闪电眼睛
        ctx.fillStyle = '#f57f17';
        this.drawLightningEye(this.x - 12, this.y - 8);
        this.drawLightningEye(this.x + 12, this.y - 8);
        
        // 随机闪电
        if (Math.random() < 0.3) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - h, this.y);
            ctx.lineTo(this.x - h - 20, this.y + (Math.random()-0.5)*40);
            ctx.stroke();
        }
    }

    drawLightningEye(x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y + 8);
        ctx.lineTo(x, y + 16);
        ctx.fill();
    }
}

class MechSpider extends Boss {
    initBoss() {
        this.edge = 0;
        this.progress = 0.5;
        this.color = '#78909c';
    }

    updateMovement(now) {
        const speed = (0.002 + GameState.bossKillCount * 0.0002) * GameState.timeScale;
        this.progress += speed;
        
        if (this.progress > 1) {
            this.progress = 0;
            this.edge = (this.edge + 1) % 4;
        }
        
        const margin = 80;
        const w = gameCanvas.width - margin * 2;
        const h = gameCanvas.height - margin * 2;
        
        switch(this.edge) {
            case 0: this.x = margin + this.progress * w; this.y = margin; break;
            case 1: this.x = gameCanvas.width - margin; this.y = margin + this.progress * h; break;
            case 2: this.x = gameCanvas.width - margin - this.progress * w; this.y = gameCanvas.height - margin; break;
            case 3: this.x = margin; this.y = gameCanvas.height - margin - this.progress * h; break;
        }
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 蛛网弹幕
            const count = 6 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                for (let j = 1; j <= 3; j++) {
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.speed = 2 + j;
                    b.size = 4 + j * 2;
                    b.color = '#78909c';
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            // 追踪蛛网
            const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
            for (let i = -2; i <= 2; i++) {
                const b = new Bullet(this.x, this.y, angle + i * 0.2, true);
                b.speed = 4;
                b.color = '#78909c';
                GameObjects.enemyBullets.push(b);
            }
        } else {
            // 全屏弹幕
            const count = 16 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3 + (i % 3);
                b.color = '#78909c';
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 200;
        
        // 机械身体
        ctx.fillStyle = this.phase === 3 ? '#78909c' : this.phase === 2 ? '#546e7a' : '#37474f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // 8条机械腿
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
        
        // 核心
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

class ShadowAssassin extends Boss {
    initBoss() {
        this.stealthTimer = 0;
        this.isStealth = false;
        this.attackTimer = 0;
        this.color = '#7e57c2';
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
            // 快速匕首
            const count = 5 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y)) + (i - count/2) * 0.1;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 12;
                b.size = 6;
                b.color = '#7e57c2';
                GameObjects.enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            // 暗影分身
            for (let dir = 0; dir < 4; dir++) {
                const baseAngle = dir * Math.PI / 2;
                for (let i = -1; i <= 1; i++) {
                    const b = new Bullet(this.x, this.y, baseAngle + i * 0.3, true);
                    b.speed = 8;
                    b.color = '#7e57c2';
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else {
            // 暗影弹幕雨
            const count = 10 + bonusCount;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
                    const b = new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.5, true);
                    b.speed = 10;
                    b.color = '#7e57c2';
                    GameObjects.enemyBullets.push(b);
                }, i * 100);
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

class ChaosEye extends Boss {
    initBoss() {
        this.orbitAngle = 0;
        this.color = '#e91e63';
    }

    updateMovement(now) {
        this.orbitAngle += 0.01;
        this.x = gameCanvas.width / 2 + Math.sin(this.orbitAngle) * 50;
        this.y = gameCanvas.height / 3 + Math.cos(this.orbitAngle * 0.7) * 30;
    }

    firePattern() {
        const bonusCount = GameState.bossKillCount;
        const pattern = (this.shotPattern++) % 4;
        
        if (pattern === 0) {
            // 螺旋弹幕
            const count = 3 + bonusCount;
            for (let i = 0; i < count; i++) {
                const baseAngle = performance.now() / 500 + i * (Math.PI * 2 / count);
                for (let j = 0; j < 3; j++) {
                    const b = new Bullet(this.x, this.y, baseAngle + j * 0.3, true);
                    b.speed = 3 + j;
                    b.color = '#e91e63';
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            // 双向螺旋
            const arms = 2 + Math.floor(bonusCount / 2);
            for (let arm = 0; arm < arms; arm++) {
                for (let i = 0; i < 12; i++) {
                    const angle = (arm / arms) * Math.PI + performance.now() / 1000 + i * 0.5;
                    const b = new Bullet(this.x, this.y, angle, true);
                    b.speed = 2 + i * 0.3;
                    b.color = '#e91e63';
                    GameObjects.enemyBullets.push(b);
                }
            }
        } else if (pattern === 2) {
            // 眼棱
            const angle = Math.atan2(GameObjects.player.x - this.x, -(GameObjects.player.y - this.y));
            for (let i = 0; i < 5 + bonusCount; i++) {
                const b = new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.3, true);
                b.speed = 6;
                b.size = 8;
                b.color = '#f06292';
                GameObjects.enemyBullets.push(b);
            }
        } else {
            // 混沌爆发
            const count = 20 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 2 + Math.random() * 4;
                b.color = '#e91e63';
                GameObjects.enemyBullets.push(b);
            }
        }
    }

    drawBoss() {
        const h = this.size / 2;
        const t = performance.now() / 1000;
        
        // 外圈旋转
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, h + i * 10, t + i, t + i + Math.PI);
            ctx.stroke();
        }
        
        // 眼球
        ctx.fillStyle = this.phase === 3 ? '#f48fb1' : this.phase === 2 ? '#f06292' : '#e91e63';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳孔
        ctx.fillStyle = '#880e4f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 光芒
        ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 1.2 + Math.sin(t * 3) * 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
// 第九部分：道具系统
// ============================================================

class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.active = true;
        this.vy = 2;
        this.bobOffset = Math.random() * Math.PI * 2;
        
        // 过滤已升级的永久道具
        const availableTypes = ITEM_TYPES.filter(type => {
            if (!type.permanent) return true;
            const stats = PlayerState.stats;
            if (type.id === 'spread') return stats.multiShot < 3;
            if (type.id === 'big') return stats.bulletSizeBuff < 2.5;
            if (type.id === 'perm_spd') return stats.fireRate > 50;
            if (type.id === 'perm_dmg') return stats.damage < 10;
            if (type.id === 'wingman') return stats.wingmanCount < 3;
            if (type.id === 'maxhp') return PlayerState.maxHp < 10;
            if (type.id === 'playersize') return stats.sizeLevel < 3;
            return true;
        });
        
        this.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    update() {
        const dist = Math.hypot(GameObjects.player.x - this.x, GameObjects.player.y - this.y);
        if (dist < PlayerState.stats.magnetRange + 50) {
            this.x += (GameObjects.player.x - this.x) * 0.1;
            this.y += (GameObjects.player.y - this.y) * 0.1;
        } else {
            this.y += this.vy;
        }
        
        if (this.y > gameCanvas.height + 50) this.active = false;
    }

    draw(timestamp) {
        const bob = Math.sin(timestamp / 200 + this.bobOffset) * 3;
        const s = this.size;
        
        // 发光效果
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, s/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // 图标
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y + bob);
    }
}

function collectItem(item) {
    const type = item.type;
    
    if (type.instant) {
        handleInstantItem(type, item);
    } else if (type.permanent) {
        handlePermanentItem(type, item);
    } else {
        handleTemporaryBuff(type, item);
    }
    
    item.active = false;
    for (let i = 0; i < 6; i++) {
        GameObjects.particles.push(new Particle(item.x, item.y, type.color));
    }
}

function handleInstantItem(type, item) {
    if (type.id === 'heal' && PlayerState.hp < PlayerState.maxHp) {
        PlayerState.hp++;
        updateHpDisplay();
        showFloatingText(item.x, item.y, '+♥', '#ff5555');
    }
}

function handlePermanentItem(type, item) {
    const stats = PlayerState.stats;
    const effects = {
        spread: () => { stats.multiShot = 3; return '永久散弹!'; },
        big: () => { stats.bulletSizeBuff = 2.5; return '永久巨弹!'; },
        perm_spd: () => { stats.fireRate = Math.max(50, stats.fireRate - 10); return '攻速+!'; },
        perm_dmg: () => { stats.damage++; return '伤害+!'; },
        wingman: () => { stats.wingmanCount++; updateWingmen(); return '+僚机!'; },
        maxhp: () => { PlayerState.maxHp++; PlayerState.hp++; updateHpDisplay(); return '生命上限+1'; },
        playersize: () => { stats.sizeLevel++; return '机体变大!'; }
    };
    
    const text = effects[type.id]();
    showFloatingText(item.x, item.y, text, type.color);
}

function handleTemporaryBuff(type, item) {
    if (GameObjects.activeBuffs[type.id]) {
        GameObjects.activeBuffs[type.id].timeLeft += type.duration;
    } else {
        GameObjects.activeBuffs[type.id] = { timeLeft: type.duration, type };
    }
    showFloatingText(item.x, item.y, type.name, type.color);
    updateBuffDisplay();
}

function spawnItem(x, y) {
    GameObjects.items.push(new Item(x, y));
}

// ============================================================
// 第十部分：UI 更新
// ============================================================

function updateHpDisplay() {
    DOM.hpDisplay.innerHTML = '';
    
    for (let i = 0; i < PlayerState.maxHp; i++) {
        const heart = document.createElement('span');
        heart.style.cssText = 'display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;font-size:20px;';
        heart.textContent = i < PlayerState.hp ? '♥' : '♡';
        DOM.hpDisplay.appendChild(heart);
    }
    
    if (PlayerState.shield > 0) {
        const shield = document.createElement('span');
        shield.style.cssText = 'margin-left:10px;color:#00ffaa;font-size:20px;';
        shield.textContent = `⛨${PlayerState.shield}`;
        DOM.hpDisplay.appendChild(shield);
    }
}

function updateBuffDisplay() {
    DOM.buffDisplay.innerHTML = '';
    
    for (const id in GameObjects.activeBuffs) {
        const buff = GameObjects.activeBuffs[id];
        const el = document.createElement('div');
        el.className = 'buff-item';
        el.innerHTML = `
            <span class="buff-icon" style="color:${buff.type.color}">${buff.type.icon}</span>
            <div class="buff-bar"><div class="buff-fill" style="width:${(buff.timeLeft / buff.type.duration) * 100}%"></div></div>
        `;
        DOM.buffDisplay.appendChild(el);
    }
}

function updateCombo() {
    const now = performance.now();
    if (now - GameState.lastKillTime < 2000) {
        GameState.combo++;
    } else {
        GameState.combo = 1;
    }
    GameState.lastKillTime = now;
    
    DOM.comboCountEl.textContent = GameState.combo;
    DOM.comboDisplay.classList.add('active', 'pop');
    setTimeout(() => DOM.comboDisplay.classList.remove('pop'), 100);
    
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        GameState.combo = 0;
        DOM.comboDisplay.classList.remove('active');
    }, 2000);
}

function updateWingmen() {
    GameObjects.wingmen = [];
    for (let i = 0; i < PlayerState.stats.wingmanCount; i++) {
        GameObjects.wingmen.push(new Wingman(i, PlayerState.stats.wingmanCount));
    }
}

function updateBuffs(dt) {
    let changed = false;
    GameState.timeScale = 1;
    
    // 重置临时属性
    PlayerState.stats.magnetRange = 0;
    PlayerState.stats.scoreMultiplier = 1;
    PlayerState.stats.homing = false;
    
    for (const id in GameObjects.activeBuffs) {
        const buff = GameObjects.activeBuffs[id];
        buff.timeLeft -= dt * 1000 / GameState.timeScale;
        
        if (buff.timeLeft <= 0) {
            delete GameObjects.activeBuffs[id];
            changed = true;
        } else {
            // 应用 buff 效果
            switch(id) {
                case 'rapid': PlayerState.stats.fireRate = 75; break;
                case 'spread': PlayerState.stats.multiShot = 3; break;
                case 'big': PlayerState.stats.bulletSizeBuff = 2.5; break;
                case 'slow': GameState.timeScale = 0.4; break;
                case 'double': PlayerState.stats.scoreMultiplier = 2; break;
                case 'homing': PlayerState.stats.homing = true; break;
                case 'magnet': PlayerState.stats.magnetRange = 200; break;
            }
        }
    }
    
    if (changed) updateBuffDisplay();
}

// ============================================================
// 第十一部分：游戏主循环
// ============================================================

function gameLoop(timestamp) {
    if (!GameState.running) return;
    
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // 背景拖尾效果
    ctx.fillStyle = 'rgba(26, 26, 46, 0.25)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 更新系统
    updateBuffs(dt);
    
    // 玩家射击
    if (InputState.mouseDown && timestamp - InputState.lastShotTime > PlayerState.stats.fireRate) {
        shoot();
    }
    
    // 生成敌人
    spawnEnemies(timestamp);
    
    // 更新游戏对象
    updateGameObjects(timestamp);
    
    // 碰撞检测
    checkCollisions();
    
    // 清理无效对象
    cleanupObjects();
    
    // 绘制游戏对象
    drawGameObjects();
    
    animationId = requestAnimationFrame(gameLoop);
}

function spawnEnemies(timestamp) {
    if (timestamp - GameState.lastEnemySpawn > GameState.enemySpawnInterval / GameState.timeScale) {
        if (GameState.killCount > 0 && GameState.killCount % 20 === 0) {
            spawnBoss();
            GameState.killCount++;
        } else {
            GameObjects.enemies.push(new Enemy());
        }
        
        GameState.lastEnemySpawn = timestamp;
        
        // 加速出怪
        const minInterval = 150;
        const baseDecrement = 3 + Math.floor(GameState.killCount / 10);
        const bossBonus = GameState.bossKillCount * 2;
        GameState.enemySpawnInterval = Math.max(minInterval, GameState.enemySpawnInterval - baseDecrement - bossBonus);
    }
}

function spawnBoss() {
    const bossType = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
    const bossClasses = {
        Destroyer, FrostGiant, LightningRider, 
        MechSpider, ShadowAssassin, ChaosEye
    };
    GameObjects.enemies.push(new (bossClasses[bossType] || Destroyer)());
}

function shoot() {
    const now = performance.now();
    if (now - InputState.lastShotTime < PlayerState.stats.fireRate) return;
    
    InputState.lastShotTime = now;
    
    const count = PlayerState.stats.multiShot;
    if (count === 1) {
        GameObjects.bullets.push(new Bullet(GameObjects.player.x, GameObjects.player.y - GameObjects.player.size/2));
    } else {
        for (let i = 0; i < count; i++) {
            const angle = (i - (count - 1) / 2) * 0.3;
            GameObjects.bullets.push(new Bullet(GameObjects.player.x, GameObjects.player.y - GameObjects.player.size/2, angle));
        }
    }
    
    GameObjects.wingmen.forEach(wingman => GameObjects.bullets.push(wingman.shoot()));
}

function updateGameObjects(timestamp) {
    // 玩家
    GameObjects.player.update();
    
    // 僚机
    GameObjects.wingmen.forEach(w => w.update());
    
    // 道具
    GameObjects.items.forEach(item => {
        item.update();
        if (checkCollision(GameObjects.player, item)) {
            collectItem(item);
        }
    });
    
    // 子弹
    GameObjects.bullets.forEach(b => b.update());
    GameObjects.enemyBullets.forEach(b => b.update());
    
    // 敌人
    GameObjects.enemies.forEach(e => e.update(timestamp));
    
    // 粒子
    GameObjects.particles.forEach(p => p.update());
}

function checkCollisions() {
    // 玩家子弹击中敌人
    GameObjects.bullets.forEach(bullet => {
        if (!bullet.active || bullet.isEnemy) return;
        
        for (const enemy of GameObjects.enemies) {
            if (!enemy.active) continue;
            if (checkCollision(bullet, enemy)) {
                bullet.active = false;
                if (enemy.onHit(bullet.damage)) {
                    handleEnemyDeath(enemy);
                }
                break;
            }
        }
    });
    
    // 敌人/子弹击中玩家
    [...GameObjects.enemies, ...GameObjects.enemyBullets].forEach(obj => {
        if (!obj.active) return;
        if (checkCollision(obj, GameObjects.player)) {
            handlePlayerHit(obj);
        }
    });
}

function handleEnemyDeath(enemy) {
    GameState.score += enemy.type === 'boss' ? 500 : 10 * GameState.combo;
    DOM.gameScore.textContent = 'SCORE: ' + GameState.score;
    
    if (enemy.type !== 'boss') {
        GameState.killCount++;
        updateCombo();
    }
    
    // 掉落道具
    if (enemy.type === 'boss' || Math.random() < 0.15) {
        spawnItem(enemy.x, enemy.y);
    }
    
    // 分裂怪
    if (enemy.type === 'splitter') {
        for (let i = 0; i < 3; i++) {
            const mini = new Enemy();
            mini.type = 'splitter';
            mini.size = 12;
            mini.hp = mini.maxHp = 1;
            mini.x = enemy.x + (Math.random() - 0.5) * 30;
            mini.y = enemy.y;
            mini.vx = (Math.random() - 0.5) * 3;
            mini.vy = 1 + Math.random();
            GameObjects.enemies.push(mini);
        }
    }
}

function handlePlayerHit(obj) {
    if (obj.type !== 'boss') obj.active = false;
    
    if (PlayerState.shield > 0) {
        PlayerState.shield--;
        showFloatingText(GameObjects.player.x, GameObjects.player.y, '护盾抵消!', '#00ffaa');
    } else {
        PlayerState.hp--;
        showFloatingText(GameObjects.player.x, GameObjects.player.y, '-1 HP', '#ff5555');
    }
    
    updateHpDisplay();
    
    if (PlayerState.hp <= 0) {
        gameOver();
    }
}

function cleanupObjects() {
    GameObjects.bullets = GameObjects.bullets.filter(b => b.active);
    GameObjects.enemyBullets = GameObjects.enemyBullets.filter(b => b.active);
    GameObjects.enemies = GameObjects.enemies.filter(e => e.active);
    GameObjects.particles = GameObjects.particles.filter(p => p.active);
    GameObjects.items = GameObjects.items.filter(i => i.active);
}

function drawGameObjects() {
    // 按顺序绘制
    GameObjects.particles.forEach(p => p.draw());
    GameObjects.items.forEach(i => i.draw(performance.now()));
    GameObjects.bullets.forEach(b => b.draw());
    GameObjects.enemyBullets.forEach(b => b.draw());
    GameObjects.enemies.forEach(e => e.draw());
    GameObjects.wingmen.forEach(w => w.draw());
    GameObjects.player.draw();
}

// ============================================================
// 第十二部分：游戏生命周期
// ============================================================

let lastTime = 0;

function startGame() {
    // 重置游戏状态
    GameState.running = true;
    GameState.score = 0;
    GameState.killCount = 0;
    GameState.combo = 0;
    GameState.enemySpawnInterval = 800;
    GameState.timeScale = 1;
    lastTime = performance.now();
    
    // 重置玩家状态
    PlayerState.hp = 3;
    PlayerState.maxHp = 3;
    PlayerState.shield = 0;
    PlayerState.stats = {
        fireRate: 150, bulletSize: 1, bulletSizeBuff: 1, damage: 1,
        multiShot: 1, magnetRange: 0, scoreMultiplier: 1,
        wingmanCount: 0, sizeLevel: 1, homing: false
    };
    
    // 清空游戏对象
    GameObjects.player = new Player();
    GameObjects.wingmen = [];
    GameObjects.bullets = [];
    GameObjects.enemyBullets = [];
    GameObjects.enemies = [];
    GameObjects.particles = [];
    GameObjects.items = [];
    GameObjects.activeBuffs = {};
    
    // 初始化输入
    InputState.mouseX = gameCanvas.width / 2;
    InputState.mouseY = gameCanvas.height - 100;
    
    // 初始化 Canvas
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    ctx = gameCanvas.getContext('2d');
    
    // 更新 UI
    DOM.gameScore.textContent = 'SCORE: 0';
    updateHpDisplay();
    updateBuffDisplay();
    
    // 显示游戏界面
    document.body.classList.add('game-active');
    if (DOM.startScreen) DOM.startScreen.classList.add('hidden');
    DOM.hpDisplay.style.display = 'block';
    
    // 开始循环
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    GameState.running = false;
    cancelAnimationFrame(animationId);
    
    if (DOM.startScreen) {
        DOM.startScreen.classList.remove('hidden');
        DOM.startScreen.querySelector('h1').textContent = `游戏结束 - 得分: ${GameState.score}`;
        DOM.startScreen.querySelector('p').textContent = `击杀: ${GameState.killCount} | Boss击杀: ${GameState.bossKillCount}`;
        DOM.startBtn.textContent = '重新开始';
    }
    
    document.body.classList.remove('game-active');
    DOM.hpDisplay.style.display = 'none';
}

// ============================================================
// 第十三部分：初始化
// ============================================================

function initGame() {
    // 缓存 DOM 引用
    DOM.startScreen = document.getElementById('start-screen');
    DOM.startBtn = document.getElementById('start-btn');
    DOM.gameCanvas = document.getElementById('game-canvas');
    DOM.gameScore = document.getElementById('game-score');
    DOM.comboDisplay = document.getElementById('combo-display');
    DOM.comboCountEl = DOM.comboDisplay.querySelector('.combo-count');
    DOM.hpDisplay = document.getElementById('hp-display');
    DOM.buffDisplay = document.getElementById('buff-display');
    
    // 绑定事件
    DOM.startBtn.addEventListener('click', startGame);
    
    window.addEventListener('mousemove', e => {
        InputState.mouseX = e.clientX;
        InputState.mouseY = e.clientY;
    });
    
    window.addEventListener('mousedown', e => {
        if (GameState.running && e.button === 0) {
            InputState.mouseDown = true;
            shoot();
        }
    });
    
    window.addEventListener('mouseup', () => InputState.mouseDown = false);
    
    window.addEventListener('resize', () => {
        if (GameState.running) {
            gameCanvas.width = window.innerWidth;
            gameCanvas.height = window.innerHeight;
        }
    });
}

// 启动
document.addEventListener('DOMContentLoaded', initGame);
