/**
 * 弹幕射击游戏 - 贺加文主页 (增强版)
 */

// ==================== 游戏配置 ====================
const ITEM_TYPES = [
    { id: 'rapid', name: '疾速射击', color: '#00ff00', duration: 50000, icon: '⚡' },
    { id: 'spread', name: '散弹枪', color: '#ff6600', duration: 0, icon: '✦', permanent: true },
    { id: 'big', name: '巨型子弹', color: '#ff00ff', duration: 0, icon: '●', permanent: true },
    { id: 'slow', name: '时间缓速', color: '#00ffff', duration: 40000, icon: '❄' },
    { id: 'double', name: '分数翻倍', color: '#ffd700', duration: 80000, icon: '×2' },
    { id: 'homing', name: '追踪弹', color: '#ff8800', duration: 45000, icon: '➤' },
    { id: 'shield', name: '护盾', color: '#00ffaa', duration: 0, icon: '⛨' }, // 一次性护盾
    { id: 'heal', name: '回血', color: '#ff5555', duration: 0, icon: '♥', instant: true },
    { id: 'perm_spd', name: '永久攻速+', color: '#ffffff', duration: 0, icon: '↑⚡', permanent: true },
    { id: 'perm_dmg', name: '永久伤害+', color: '#ff4444', duration: 0, icon: '↑✦', permanent: true },
    { id: 'wingman', name: '僚机', color: '#00aaff', duration: 0, icon: '✈', permanent: true },
    { id: 'maxhp', name: '生命上限+', color: '#ff8888', duration: 0, icon: '↑♥', permanent: true },
    { id: 'playersize', name: '机体变大', color: '#aaaaaa', duration: 0, icon: '↑□', permanent: true }
];

// ==================== 游戏状态 ====================
let gameRunning = false;
let score = 0;
let killCount = 0;
let combo = 0;
let lastKillTime = 0;
let comboTimer = null;
let ctx = null;
let animationId = null;
let mouseX = 0, mouseY = 0;
let mouseDown = false;
let lastShotTime = 0;

// 玩家属性
let player = null;
let playerStats = {
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
};

// 生命系统
let playerHp = 3;
let playerMaxHp = 3;
let playerShield = 0;

// 僚机
let wingmen = [];

// 临时buff - 存储剩余时间而不是结束时间
let activeBuffs = {};
let timeScale = 1;

// 游戏对象
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let items = [];

// 生成控制
let lastEnemySpawn = 0;
let enemySpawnInterval = 800;
let bossKillCount = 0; // 击杀boss数量，影响boss强度

// DOM
let startBtn, gameCanvas, gameScore, comboDisplay, comboCountEl, hpDisplay;
let buffDisplay = null;

// ==================== 初始化 ====================
function initGame() {
    startBtn = document.getElementById('start-game-btn');
    gameCanvas = document.getElementById('game-canvas');
    gameScore = document.getElementById('game-score');
    comboDisplay = document.getElementById('combo-display');
    comboCountEl = comboDisplay.querySelector('.combo-count');
    
    // 生命显示
    hpDisplay = document.createElement('div');
    hpDisplay.id = 'hp-display';
    hpDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 24px;
        color: #ff5555;
        text-shadow: 2px 2px 0 #000;
        z-index: 5;
        display: none;
    `;
    document.body.appendChild(hpDisplay);
    
    // buff显示
    buffDisplay = document.createElement('div');
    buffDisplay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 5;
        flex-wrap: wrap;
        justify-content: center;
    `;
    document.body.appendChild(buffDisplay);
    
    startBtn.addEventListener('click', startGame);
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    window.addEventListener('mousedown', (e) => {
        if (gameRunning && e.button === 0) {
            mouseDown = true;
            shoot();
        }
    });
    
    window.addEventListener('mouseup', () => mouseDown = false);
    
    window.addEventListener('resize', () => {
        if (gameRunning) {
            gameCanvas.width = window.innerWidth;
            gameCanvas.height = window.innerHeight;
        }
    });
}

function updateHpDisplay() {
    hpDisplay.innerHTML = '';
    
    for (let i = 0; i < playerMaxHp; i++) {
        const heart = document.createElement('span');
        heart.style.cssText = `
            display: inline-block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            font-size: 20px;
        `;
        heart.textContent = i < playerHp ? '♥' : '♡';
        hpDisplay.appendChild(heart);
    }
    
    if (playerShield > 0) {
        const shield = document.createElement('span');
        shield.style.cssText = `
            margin-left: 10px;
            color: #00ffaa;
            font-size: 20px;
        `;
        shield.textContent = `⛨${playerShield}`;
        hpDisplay.appendChild(shield);
    }
}

// ==================== 道具系统 ====================
class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.active = true;
        this.vy = 2;
        this.type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < playerStats.magnetRange + 50) {
            this.x += (player.x - this.x) * 0.1;
            this.y += (player.y - this.y) * 0.1;
        } else {
            this.y += this.vy;
        }
        
        if (this.y > gameCanvas.height + 50) this.active = false;
    }
    
    draw(timestamp) {
        const bob = Math.sin(timestamp / 200 + this.bobOffset) * 3;
        
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x - this.size/2, this.y + bob - this.size/2, this.size, this.size);
        
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.size/2, this.y + bob - this.size/2, this.size, this.size);
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = this.type.color;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.icon, this.x, this.y + bob + 5);
    }
}

function spawnItem(x, y) {
    items.push(new Item(x, y));
}

function collectItem(item) {
    const type = item.type;
    
    if (type.instant) {
        if (type.id === 'heal' && playerHp < playerMaxHp) {
            playerHp++;
            updateHpDisplay();
            showFloatingText(item.x, item.y, '+♥', '#ff5555');
        }
    } else if (type.permanent) {
        if (type.id === 'perm_spd') {
            playerStats.fireRate = Math.max(50, playerStats.fireRate - 10);
            showFloatingText(item.x, item.y, '攻速+!', '#00ff00');
        } else if (type.id === 'perm_dmg') {
            playerStats.damage++;
            showFloatingText(item.x, item.y, '伤害+!', '#ff4444');
        } else if (type.id === 'wingman') {
            playerStats.wingmanCount++;
            updateWingmen();
            showFloatingText(item.x, item.y, `僚机+1`, '#00aaff');
        } else if (type.id === 'maxhp') {
            playerMaxHp++;
            playerHp++;
            updateHpDisplay();
            showFloatingText(item.x, item.y, '生命上限+1', '#ff8888');
        } else if (type.id === 'playersize') {
            playerStats.sizeLevel++;
            showFloatingText(item.x, item.y, '机体变大!', '#aaaaaa');
        } else if (type.id === 'spread') {
            playerStats.multiShot = 3;
            showFloatingText(item.x, item.y, '永久散弹!', '#ff6600');
        } else if (type.id === 'big') {
            playerStats.bulletSizeBuff = 2.5;
            showFloatingText(item.x, item.y, '永久巨弹!', '#ff00ff');
        }
    } else if (type.id === 'shield') {
        playerShield++;
        updateHpDisplay();
        showFloatingText(item.x, item.y, '+⛨护盾', '#00ffaa');
    } else {
        // 临时buff - 时间累加
        if (activeBuffs[type.id]) {
            activeBuffs[type.id].timeLeft += type.duration;
        } else {
            activeBuffs[type.id] = {
                timeLeft: type.duration,
                type: type
            };
        }
        updateBuffDisplay();
    }
    
    item.active = false;
    
    for (let i = 0; i < 6; i++) {
        particles.push(new Particle(item.x, item.y, type.color));
    }
}

function updateWingmen() {
    wingmen = [];
    for (let i = 0; i < playerStats.wingmanCount; i++) {
        wingmen.push(new Wingman(i, playerStats.wingmanCount));
    }
}

function updateBuffs(dt) {
    let changed = false;
    
    timeScale = 1;
    playerStats.multiShot = 1;
    playerStats.bulletSizeBuff = 1;
    playerStats.magnetRange = 0;
    playerStats.scoreMultiplier = 1;
    playerStats.homing = false;
    
    for (let id in activeBuffs) {
        const buff = activeBuffs[id];
        buff.timeLeft -= dt * 1000 / timeScale; // 时间缓速影响buff消耗
        
        if (buff.timeLeft <= 0) {
            delete activeBuffs[id];
            changed = true;
        } else {
            switch(id) {
                case 'rapid': playerStats.fireRate = 75; break;
                case 'spread': playerStats.multiShot = 3; break;
                case 'big': playerStats.bulletSizeBuff = 2.5; break;
                case 'slow': timeScale = 0.4; break;
                case 'double': playerStats.scoreMultiplier = 2; break;
                case 'magnet': playerStats.magnetRange = 200; break;
                case 'homing': playerStats.homing = true; break;
            }
        }
    }
    
    if (changed) updateBuffDisplay();
}

function updateBuffDisplay() {
    buffDisplay.innerHTML = '';
    
    for (let id in activeBuffs) {
        const buff = activeBuffs[id];
        const remaining = Math.ceil(buff.timeLeft / 1000);
        
        const badge = document.createElement('div');
        badge.style.cssText = `
            background: ${buff.type.color};
            color: #000;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            white-space: nowrap;
        `;
        badge.textContent = `${buff.type.icon} ${remaining}s`;
        buffDisplay.appendChild(badge);
    }
}

function showFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: 20px;
        font-weight: bold;
        pointer-events: none;
        text-shadow: 2px 2px 0 #000;
        z-index: 100;
        animation: floatUp 1s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// ==================== 粒子效果 ====================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.05 + Math.random() * 0.05;
        this.color = color;
        this.size = 2 + Math.random() * 3;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ==================== 僚机 ====================
class Wingman {
    constructor(index, total) {
        this.index = index;
        this.total = total;
        this.angle = (index / total) * Math.PI * 2;
        this.radius = 60;
    }
    
    update() {
        this.angle += 0.03;
        this.x = player.x + Math.cos(this.angle) * this.radius;
        this.y = player.y + Math.sin(this.angle) * this.radius * 0.5;
    }
    
    draw() {
        const size = 10 * Math.sqrt(playerStats.sizeLevel);
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(this.x - 3, this.y - 6, 6, 12);
        ctx.fillRect(this.x - 8, this.y, 16, 4);
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - 1, this.y - 8, 2, 4);
        ctx.shadowBlur = 0;
    }
    
    shoot() {
        return new Bullet(this.x, this.y - 10);
    }
}

// ==================== 玩家 ====================
class Player {
    constructor() {
        this.baseSize = 16;
        this.x = gameCanvas.width / 2;
        this.y = gameCanvas.height - 100;
        this.color = '#9d8df7';
    }
    
    get size() {
        return this.baseSize * Math.sqrt(playerStats.sizeLevel);
    }
    
    update() {
        // 平滑跟随鼠标
        const targetX = Math.max(this.size, Math.min(gameCanvas.width - this.size, mouseX));
        const targetY = Math.max(this.size, Math.min(gameCanvas.height - this.size, mouseY));
        
        this.x += (targetX - this.x) * 0.15;
        this.y += (targetY - this.y) * 0.15;
    }
    
    draw() {
        const s = this.size;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - s/4, this.y - s/2, s/2, s);
        ctx.fillRect(this.x - s*0.75, this.y, s*1.5, s*0.375);
        ctx.fillRect(this.x - s/2, this.y + s/4, s, s/4);
        
        // 护盾效果
        if (playerShield > 0) {
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, s + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}

// ==================== 子弹 ====================
class Bullet {
    constructor(x, y, angle = 0, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.speed = isEnemy ? 4 : 10;
        this.size = (isEnemy ? 6 : 4) * (isEnemy ? 1 : playerStats.bulletSize * playerStats.bulletSizeBuff);
        this.active = true;
        this.angle = angle;
        this.damage = isEnemy ? 1 : playerStats.damage;
        this.isEnemy = isEnemy;
    }
    
    update() {
        // 追踪弹逻辑
        if (!this.isEnemy && playerStats.homing && enemies.length > 0) {
            // 找最近的敌人
            let nearest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            });
            
            if (nearest && minDist < 400) {
                const targetAngle = Math.atan2(nearest.x - this.x, -(nearest.y - this.y));
                // 平滑转向
                let diff = targetAngle - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.angle += diff * 0.1;
            }
        }
        
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
        if (this.y < 0 || this.y > gameCanvas.height || this.x < 0 || this.x > gameCanvas.width) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = this.isEnemy ? '#ff6666' : '#fff';
        const s = this.size;
        ctx.fillRect(this.x - s/2, this.y - s, s, s * 2);
        if (!this.isEnemy) {
            ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
            ctx.fillRect(this.x - s/4, this.y, s/2, s);
        }
    }
}

function shoot() {
    const now = performance.now();
    if (now - lastShotTime < playerStats.fireRate) return;
    
    lastShotTime = now;
    
    const count = playerStats.multiShot;
    if (count === 1) {
        bullets.push(new Bullet(player.x, player.y - player.size/2));
    } else {
        for (let i = 0; i < count; i++) {
            const angle = (i - (count - 1) / 2) * 0.3;
            bullets.push(new Bullet(player.x, player.y - player.size/2, angle));
        }
    }
    
    wingmen.forEach(wingman => bullets.push(wingman.shoot()));
}

// ==================== 敌人类型 ====================
const ENEMY_TYPES = ['basic', 'fast', 'tank', 'shooter', 'splitter'];

class Enemy {
    constructor() {
        this.type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        this.x = 30 + Math.random() * (gameCanvas.width - 60);
        this.y = -40;
        this.active = true;
        this.hp = 2;
        this.maxHp = 2;
        this.lastShot = 0;
        
        switch(this.type) {
            case 'basic':
                this.size = 24;
                this.vx = 0;
                this.vy = 1.5;
                this.color = '#e87e7e';
                this.hp = this.maxHp = 2;
                break;
            case 'fast':
                this.size = 18;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = 3.5;
                this.color = '#ffff00';
                this.hp = this.maxHp = 1;
                break;
            case 'tank':
                this.size = 40;
                this.vx = 0;
                this.vy = 0.6;
                this.color = '#666666';
                this.hp = this.maxHp = 8;
                break;
            case 'shooter':
                this.size = 28;
                this.vx = 0;
                this.vy = 1;
                this.color = '#00ff00';
                this.hp = this.maxHp = 3;
                break;
            case 'splitter':
                this.size = 22;
                this.vx = 0;
                this.vy = 2;
                this.color = '#ff00ff';
                this.hp = this.maxHp = 2;
                break;
        }
    }
    
    update(now) {
        this.y += this.vy * timeScale;
        this.x += this.vx * timeScale;
        
        // 只有Boss发射弹幕，普通敌人不发射
        
        if (this.x < this.size || this.x > gameCanvas.width - this.size) {
            this.vx = -this.vx;
        }
        
        if (this.y > gameCanvas.height + 50) this.active = false;
    }
    
    draw() {
        const half = this.size / 2;
        
        switch(this.type) {
            case 'basic':
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - half, this.y - half, this.size, this.size);
                ctx.fillStyle = '#fff';
                ctx.fillRect(this.x - 6, this.y - 4, 4, 4);
                ctx.fillRect(this.x + 2, this.y - 4, 4, 4);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x - 4, this.y, 2, 4);
                ctx.fillRect(this.x + 2, this.y, 2, 4);
                break;
                
            case 'fast':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - half);
                ctx.lineTo(this.x + half, this.y + half);
                ctx.lineTo(this.x - half, this.y + half);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(this.x - 2, this.y, 4, 4);
                break;
                
            case 'tank':
                // 重型坦克外观
                ctx.fillStyle = '#444444';
                ctx.fillRect(this.x - half, this.y - half, this.size, this.size);
                // 装甲板
                ctx.fillStyle = '#666666';
                ctx.fillRect(this.x - half + 4, this.y - half + 4, this.size - 8, this.size - 8);
                // 炮管
                ctx.fillStyle = '#333333';
                ctx.fillRect(this.x - 4, this.y + half - 8, 8, 12);
                // 炮口
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x - 2, this.y + half - 2, 4, 4);
                // 眼睛
                ctx.fillStyle = '#ff6666';
                ctx.fillRect(this.x - 8, this.y - 4, 6, 4);
                ctx.fillRect(this.x + 2, this.y - 4, 6, 4);
                break;
                
            case 'shooter':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, half, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x - 6, this.y - 2, 5, 0, Math.PI * 2);
                ctx.arc(this.x + 6, this.y - 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(this.x - 6, this.y - 2, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 6, this.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                // 炮管
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 2, this.y + 5, 4, 10);
                break;
                
            case 'splitter':
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
                break;
        }
        
        // 血条
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - half, this.y - half - 10, this.size, 5);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - half + 1, this.y - half - 9, (this.size - 2) * (this.hp / this.maxHp), 3);
        }
    }
    
    onHit(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.active = false;
            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x, this.y, this.color));
            }
            return true;
        }
        return false;
    }
}

// Boss敌人
class Boss extends Enemy {
    constructor() {
        super();
        this.type = 'boss';
        this.size = 80;
        // 三管血，每管30点
        this.hp = 90;
        this.maxHp = 90;
        this.phase = 3; // 当前阶段 3, 2, 1
        this.hpPerPhase = 30;
        this.x = gameCanvas.width / 2;
        this.y = -80;
        this.vx = 2;
        this.vy = 0.3;
        this.color = '#ff6b6b';
        this.lastShot = 0;
        this.shotPattern = 0;
    }
    
    getCurrentPhase() {
        if (this.hp > 60) return 3;
        if (this.hp > 30) return 2;
        return 1;
    }
    
    update(now) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        
        if (this.x < this.size || this.x > gameCanvas.width - this.size) {
            this.vx = -this.vx;
        }
        
        // 检查阶段变化
        const newPhase = this.getCurrentPhase();
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            // 阶段变化特效
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(this.x, this.y, '#ffd700'));
            }
            // 阶段变化时加快弹幕
            this.vx *= 1.2;
        }
        
        // Boss弹幕攻击 - 根据阶段增加弹幕强度
        const shotInterval = 1500 - (3 - this.phase) * 300; // 阶段越低，射击越快
        
        if (now - this.lastShot > shotInterval) {
            this.firePattern();
            this.lastShot = now;
        }
        
        if (this.y > gameCanvas.height + 100) {
            this.y = gameCanvas.height + 100;
            this.vy = -Math.abs(this.vy);
        }
        if (this.y < -100) {
            this.y = -100;
            this.vy = Math.abs(this.vy);
        }
    }
    
    firePattern() {
        // 根据当前阶段选择弹幕模式
        const patternCount = this.phase === 3 ? 3 : this.phase === 2 ? 4 : 5;
        this.shotPattern = (this.shotPattern + 1) % patternCount;
        
        if (this.shotPattern === 0) {
            // 散射
            const count = 5 + (3 - this.phase) * 2;
            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.3;
                enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
            }
        } else if (this.shotPattern === 1) {
            // 追踪弹
            const count = this.phase === 1 ? 5 : 3;
            for (let i = 0; i < count; i++) {
                const offset = (i - (count - 1) / 2) * 15;
                const angle = Math.atan2(player.x - (this.x + offset), -(player.y - this.y));
                enemyBullets.push(new Bullet(this.x + offset, this.y + 30, angle, true));
            }
        } else if (this.shotPattern === 2) {
            // 环形
            const count = 6 + (3 - this.phase) * 2;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                enemyBullets.push(new Bullet(this.x, this.y, angle, true));
            }
        } else if (this.shotPattern === 3) {
            // 交叉弹幕 (2,3阶段)
            for (let i = -3; i <= 3; i++) {
                enemyBullets.push(new Bullet(this.x - 40, this.y + 20, i * 0.25, true));
                enemyBullets.push(new Bullet(this.x + 40, this.y + 20, -i * 0.25, true));
            }
        } else if (this.shotPattern === 4) {
            // 全屏弹幕 (1阶段)
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                enemyBullets.push(new Bullet(this.x, this.y, angle, true));
            }
            // 额外追踪
            const angle = Math.atan2(player.x - this.x, -(player.y - this.y));
            enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
        }
    }
    
    draw() {
        const h = this.size / 2;
        
        // 根据阶段改变颜色
        const phaseColors = ['#ff0000', '#ff6600', '#ff4444'];
        const bodyColor = phaseColors[this.phase - 1] || '#ff4444';
        
        // 主体
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - h, this.y - h, this.size, this.size);
        
        // 装甲
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - h + 5, this.y - h + 5, this.size - 10, this.size - 10);
        
        // 角
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x - h, this.y - h);
        ctx.lineTo(this.x - h - 10, this.y - h - 15);
        ctx.lineTo(this.x - h + 10, this.y - h);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + h, this.y - h);
        ctx.lineTo(this.x + h + 10, this.y - h - 15);
        ctx.lineTo(this.x + h - 10, this.y - h);
        ctx.fill();
        
        // 眼睛 - 根据阶段变化
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 20, this.y - 15, 12, 12);
        ctx.fillRect(this.x + 8, this.y - 15, 12, 12);
        const eyeColors = ['#ff0000', '#ff6600', '#ffff00'];
        ctx.fillStyle = eyeColors[this.phase - 1] || '#ff0000';
        ctx.fillRect(this.x - 17, this.y - 12, 6, 6);
        ctx.fillRect(this.x + 11, this.y - 12, 6, 6);
        
        // 三管血条显示
        const barWidth = this.size + 10;
        const barHeight = 6;
        const barY = this.y - h - 20;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight * 3 + 4);
        
        // 计算每管血的百分比
        const phase1Hp = Math.max(0, Math.min(30, this.hp - 60));
        const phase2Hp = Math.max(0, Math.min(30, this.hp - 30));
        const phase3Hp = Math.max(0, Math.min(30, this.hp));
        
        const hpColors = ['#00ff00', '#ffff00', '#ff0000'];
        const phaseHps = [phase3Hp, phase2Hp, phase1Hp];
        
        for (let i = 0; i < 3; i++) {
            const y = barY + i * (barHeight + 2);
            const percent = phaseHps[i] / 30;
            
            ctx.fillStyle = '#222';
            ctx.fillRect(this.x - barWidth/2 + 1, y + 1, barWidth - 2, barHeight - 2);
            
            if (percent > 0) {
                ctx.fillStyle = hpColors[i];
                ctx.fillRect(this.x - barWidth/2 + 1, y + 1, (barWidth - 2) * percent, barHeight - 2);
            }
        }
        
        // 显示当前阶段
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PHASE ${this.phase}`, this.x, this.y - h - 25);
        
        // 炮管
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 30, this.y + h - 10, 20, 15);
        ctx.fillRect(this.x + 10, this.y + h - 10, 20, 15);
    }
    
    onHit(damage) {
        this.hp -= damage;
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#ff6b6b'));
        }
        if (this.hp <= 0) {
            this.active = false;
            bossKillCount++; // Boss击杀计数+1
            // Boss死亡大爆炸
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(this.x, this.y, '#ffd700'));
                particles.push(new Particle(this.x, this.y, '#ff6b6b'));
                particles.push(new Particle(this.x, this.y, '#ff0000'));
            }
            return true;
        }
        return false;
    }
}

function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.size + b.size) / 2 &&
           Math.abs(a.y - b.y) < (a.size + b.size) / 2;
}

// ==================== 连击 ====================
function updateCombo() {
    const now = performance.now();
    if (now - lastKillTime < 2000) {
        combo++;
    } else {
        combo = 1;
    }
    lastKillTime = now;
    
    comboCountEl.textContent = combo;
    comboDisplay.classList.add('active');
    comboDisplay.classList.add('pop');
    setTimeout(() => comboDisplay.classList.remove('pop'), 100);
    
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        comboDisplay.classList.remove('active');
    }, 2000);
}

// ==================== 游戏循环 ====================
let lastTime = 0;

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    ctx.fillStyle = 'rgba(26, 26, 46, 0.25)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 更新buff
    updateBuffs(dt);
    
    // 连发
    if (mouseDown && timestamp - lastShotTime > playerStats.fireRate) {
        shoot();
    }
    
    // 生成敌人
    if (timestamp - lastEnemySpawn > enemySpawnInterval / timeScale) {
        if (killCount > 0 && killCount % 20 === 0) {
            enemies.push(new Boss());
            killCount++;
        } else {
            enemies.push(new Enemy());
        }
        lastEnemySpawn = timestamp;
        // 出怪速度递增，最快150ms，击杀越多越快
        const minInterval = 150;
        const decrement = 3 + Math.floor(killCount / 10); // 每击杀10个敌人，递减速度加快
        enemySpawnInterval = Math.max(minInterval, enemySpawnInterval - decrement);
    }
    
    // 玩家
    player.update();
    player.draw();
    
    // 僚机
    wingmen.forEach(wingman => {
        wingman.update();
        wingman.draw();
    });
    
    // 道具
    items = items.filter(item => item.active);
    items.forEach(item => {
        item.update();
        item.draw(timestamp);
        
        if (checkCollision(player, item)) {
            collectItem(item);
        }
    });
    
    // 玩家子弹
    bullets = bullets.filter(b => b.active);
    bullets.forEach(b => {
        b.update();
        b.draw();
    });
    
    // 敌人子弹
    enemyBullets = enemyBullets.filter(b => b.active);
    enemyBullets.forEach(b => {
        b.update();
        b.draw();
        
        // 检测击中玩家
        if (checkCollision(b, player)) {
            b.active = false;
            
            if (playerShield > 0) {
                playerShield--;
                showFloatingText(player.x, player.y - 30, '护盾抵消!', '#00ffaa');
            } else {
                playerHp--;
                showFloatingText(player.x, player.y - 30, '-♥', '#ff0000');
                
                // 受伤闪烁
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(player.x, player.y, '#ff0000'));
                }
            }
            
            updateHpDisplay();
            
            if (playerHp <= 0) {
                gameOver();
                return;
            }
        }
    });
    
    // 粒子
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // 敌人
    enemies = enemies.filter(e => e.active);
    enemies.forEach(e => {
        e.update(timestamp);
        e.draw();
        
        // 检测敌人撞到玩家
        if (checkCollision(e, player)) {
            e.active = false;
            
            if (playerShield > 0) {
                playerShield--;
                showFloatingText(player.x, player.y - 30, '护盾抵消!', '#00ffaa');
            } else {
                playerHp--;
                showFloatingText(player.x, player.y - 30, '-♥', '#ff0000');
                
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(player.x, player.y, '#ff0000'));
                }
            }
            
            updateHpDisplay();
            
            if (playerHp <= 0) {
                gameOver();
                return;
            }
        }
        
        // 检测子弹击中敌人
        bullets.forEach(b => {
            if (b.active && checkCollision(b, e)) {
                if (!activeBuffs['big']) b.active = false;
                if (e.onHit(b.damage)) {
                    killCount++;
                    score += (e.isBoss ? 1000 : 100) * playerStats.scoreMultiplier;
                    gameScore.textContent = 'SCORE: ' + score;
                    updateCombo();
                    
                    const dropRate = e.isBoss ? 1 : 0.2;
                    if (Math.random() < dropRate) {
                        spawnItem(e.x, e.y);
                    }
                }
            }
        });
    });
    
    // 更新buff显示
    updateBuffDisplay();
    
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', gameCanvas.width / 2, gameCanvas.height / 2 - 50);
    
    ctx.font = '24px VT323';
    ctx.fillText(`最终得分: ${score}`, gameCanvas.width / 2, gameCanvas.height / 2 + 20);
    ctx.fillText(`击杀数: ${killCount}`, gameCanvas.width / 2, gameCanvas.height / 2 + 50);
    
    setTimeout(() => {
        location.reload();
    }, 3000);
}

// ==================== 开始游戏 ====================
function startGame() {
    gameRunning = true;
    score = 0;
    killCount = 0;
    combo = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    items = [];
    activeBuffs = {};
    timeScale = 1;
    lastTime = performance.now();
    
    // 重置生命
    playerHp = 3;
    playerMaxHp = 3;
    playerShield = 0;
    
    // 重置属性
    playerStats = {
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
    };
    
    wingmen = [];
    enemySpawnInterval = 800;
    
    gameScore.textContent = 'SCORE: 0';
    updateHpDisplay();
    updateBuffDisplay();
    
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    ctx = gameCanvas.getContext('2d');
    
    player = new Player();
    mouseX = gameCanvas.width / 2;
    mouseY = gameCanvas.height - 100;
    
    document.body.classList.add('game-active');
    startBtn.classList.add('hidden');
    gameCanvas.classList.add('active');
    gameScore.classList.add('active');
    hpDisplay.style.display = 'block';
    
    lastEnemySpawn = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// ==================== CSS动画 ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initGame);
