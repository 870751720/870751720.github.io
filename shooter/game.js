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
let startScreen, startBtn, gameCanvas, gameScore, comboDisplay, comboCountEl, hpDisplay;
let buffDisplay = null;

// ==================== 初始化 ====================
function initGame() {
    startScreen = document.getElementById('start-screen');
    startBtn = document.getElementById('start-btn');
    gameCanvas = document.getElementById('game-canvas');
    gameScore = document.getElementById('game-score');
    comboDisplay = document.getElementById('combo-display');
    comboCountEl = comboDisplay.querySelector('.combo-count');
    hpDisplay = document.getElementById('hp-display');
    buffDisplay = document.getElementById('buff-display');
    
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
        
        // 过滤已升级的永久道具
        const availableTypes = ITEM_TYPES.filter(type => {
            if (!type.permanent) return true;
            // 检查是否已升级
            if (type.id === 'spread') return playerStats.multiShot < 3;
            if (type.id === 'big') return playerStats.bulletSizeBuff < 2.5;
            if (type.id === 'perm_spd') return playerStats.fireRate > 50;
            if (type.id === 'perm_dmg') return playerStats.damage < 10;
            if (type.id === 'wingman') return playerStats.wingmanCount < 3;
            if (type.id === 'maxhp') return playerMaxHp < 10;
            if (type.id === 'playersize') return playerStats.sizeLevel < 3;
            return true;
        });
        
        this.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
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
    // 注意：multiShot 和 bulletSizeBuff 是永久升级，不在此处重置
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
                // 平滑转向 - 根据距离调整转向速度
                let diff = targetAngle - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                // 近距离时转向更快，避免绕圈
                const turnSpeed = minDist < 50 ? 0.3 : 0.15;
                // 限制最大转向角度
                const maxTurn = Math.min(Math.abs(diff), turnSpeed);
                this.angle += Math.sign(diff) * maxTurn;
                
                // 非常近时直接命中
                if (minDist < nearest.size / 2 + this.size) {
                    nearest.onHit(this.damage);
                    this.active = false;
                    for (let i = 0; i < 3; i++) {
                        particles.push(new Particle(this.x, this.y, '#fff'));
                    }
                    return;
                }
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
                this.color = '#4ade80'; // 史莱姆绿色
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
                // 眼睛
                ctx.fillStyle = '#ff6666';
                ctx.fillRect(this.x - 8, this.y - 4, 6, 4);
                ctx.fillRect(this.x + 2, this.y - 4, 6, 4);
                break;
                
            case 'shooter':
                // 绿色史莱姆 - 圆润弹性身体
                const wobble = Math.sin(performance.now() / 200) * 2;
                
                // 史莱姆身体主体 - 完整的椭圆
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, half + wobble, half, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 身体底部阴影（让看起来是趴在地上）
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y + half - 3, half * 0.8, 4, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 身体高光
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.ellipse(this.x - 5, this.y - 5, 6, 4, -0.3, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 小高光点
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(this.x - 7, this.y - 7, 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 左眼
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.ellipse(this.x - 7, this.y - 2, 5, 6, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 右眼
                ctx.beginPath();
                ctx.ellipse(this.x + 7, this.y - 2, 5, 6, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                // 瞳孔
                const eyeOffset = Math.sin(performance.now() / 500) * 1;
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
                
                // 发射口 - 在身体表面，不是缺口
                ctx.fillStyle = '#0f2e1a';
                ctx.beginPath();
                ctx.arc(this.x, this.y + half - 5, 3, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                break;
                ctx.beginPath();
                ctx.arc(this.x, this.y + half - 3, 4, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
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

// Boss类型列表
const BOSS_TYPES = ['Destroyer', 'FrostGiant', 'LightningRider', 'MechSpider', 'ShadowAssassin', 'ChaosEye'];

// Boss基类
class Boss extends Enemy {
    constructor(bossType = null) {
        super();
        this.type = 'boss';
        this.bossType = bossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        
        // 基础属性随击杀数成长
        const scale = 1 + bossKillCount * 0.1;
        this.size = 80 * scale;
        this.hp = Math.floor(90 * scale);
        this.maxHp = this.hp;
        this.hpPerPhase = Math.floor(30 * scale);
        this.phase = 3;
        this.x = gameCanvas.width / 2;
        this.y = -80;
        this.lastShot = 0;
        this.shotPattern = 0;
        this.shotInterval = Math.max(500, 1500 - bossKillCount * 150);
        this.timeOffset = Math.random() * 1000;
        
        // 子类初始化
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
        
        // 检查阶段变化
        const newPhase = this.getCurrentPhase();
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
        
        // 弹幕攻击
        const currentShotInterval = this.shotInterval - (3 - this.phase) * 200;
        if (now - this.lastShot > currentShotInterval) {
            this.firePattern();
            this.lastShot = now;
        }
        
        // 边界检查
        this.checkBounds();
    }
    
    updateMovement(now) {
        // 子类重写
    }
    
    onPhaseChange() {
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x, this.y, '#ffd700'));
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
    
    drawBoss() {
        // 子类重写
    }
    
    drawHpBar() {
        const h = this.size / 2;
        const barWidth = this.size + 20;
        const barHeight = 8;
        const barY = this.y - h - 20;
        
        if (bossKillCount > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv.${bossKillCount}`, this.x, barY - 8);
        }
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2 - 2, barY - 2, barWidth + 4, barHeight + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const hpPercent = this.hp / this.maxHp;
        let hpColor = this.phase === 3 ? '#00cc00' : this.phase === 2 ? '#ffcc00' : '#ff0000';
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
            particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#ff6b6b'));
        }
        if (this.hp <= 0) {
            this.active = false;
            bossKillCount++;
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

// 1. 毁灭者 - 原始Boss，方形装甲
class Destroyer extends Boss {
    initBoss() {
        this.vx = 2 + bossKillCount * 0.3;
        this.vy = 0.3 + bossKillCount * 0.1;
    }
    
    updateMovement(now) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        
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
        const bonusCount = bossKillCount;
        const patternCount = this.phase === 3 ? 3 : this.phase === 2 ? 4 : 5;
        this.shotPattern = (this.shotPattern + 1) % patternCount;
        
        if (this.shotPattern === 0) {
            const count = 5 + (3 - this.phase) * 2 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i - (count - 1) / 2) * 0.3;
                enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
            }
        } else if (this.shotPattern === 1) {
            const count = this.phase === 1 ? 5 + bonusCount : 3 + bonusCount;
            for (let i = 0; i < count; i++) {
                const offset = (i - (count - 1) / 2) * 15;
                const angle = Math.atan2(player.x - (this.x + offset), -(player.y - this.y));
                enemyBullets.push(new Bullet(this.x + offset, this.y + 30, angle, true));
            }
        } else if (this.shotPattern === 2) {
            const count = 6 + (3 - this.phase) * 2 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                enemyBullets.push(new Bullet(this.x, this.y, angle, true));
            }
        } else if (this.shotPattern === 3) {
            for (let i = -3 - bonusCount; i <= 3 + bonusCount; i++) {
                enemyBullets.push(new Bullet(this.x - 40, this.y + 20, i * 0.25, true));
                enemyBullets.push(new Bullet(this.x + 40, this.y + 20, -i * 0.25, true));
            }
        } else if (this.shotPattern === 4) {
            for (let i = 0; i < 12 + bonusCount; i++) {
                const angle = (i / (12 + bonusCount)) * Math.PI * 2;
                enemyBullets.push(new Bullet(this.x, this.y, angle, true));
            }
            const angle = Math.atan2(player.x - this.x, -(player.y - this.y));
            enemyBullets.push(new Bullet(this.x, this.y + 30, angle, true));
        }
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
}

// 2. 冰霜巨人 - 缓慢移动，冰冻弹幕
class FrostGiant extends Boss {
    initBoss() {
        this.vx = 1 + bossKillCount * 0.1;
        this.vy = 0.2;
        this.color = '#4dd0e1';
    }
    
    updateMovement(now) {
        const t = (now + this.timeOffset) / 2000;
        this.x = gameCanvas.width / 2 + Math.sin(t) * 200;
        this.y = 100 + Math.sin(t * 0.5) * 30;
    }
    
    firePattern() {
        const bonusCount = bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 冰锥散射
            const count = 7 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3;
                b.color = '#4dd0e1';
                enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            // 冰锥追踪
            const count = 3 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(player.x - this.x, -(player.y - this.y)) + (i - 1) * 0.3;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 4;
                b.color = '#4dd0e1';
                enemyBullets.push(b);
            }
        } else {
            // 霜冻新星 - 扩散圈
            const rings = 2 + Math.floor(bonusCount / 3);
            for (let r = 0; r < rings; r++) {
                setTimeout(() => {
                    const count = 8 + bonusCount;
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const b = new Bullet(this.x, this.y, angle, true);
                        b.speed = 2 + r;
                        b.color = '#4dd0e1';
                        enemyBullets.push(b);
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
        
        // 冰晶核心
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

// 3. 闪电行者 - 快速移动，闪电弹幕
class LightningRider extends Boss {
    initBoss() {
        this.targetX = this.x;
        this.targetY = this.y;
        this.moveTimer = 0;
        this.color = '#ffeb3b';
    }
    
    updateMovement(now) {
        // 瞬移模式
        this.moveTimer += 16;
        if (this.moveTimer > 2000 - bossKillCount * 100) {
            this.moveTimer = 0;
            this.targetX = 100 + Math.random() * (gameCanvas.width - 200);
            this.targetY = 80 + Math.random() * 150;
            // 瞬移特效
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
            this.x = this.targetX;
            this.y = this.targetY;
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(this.x, this.y, '#ffeb3b'));
            }
        }
    }
    
    firePattern() {
        const bonusCount = bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 闪电链 - 之字形
            const zigzags = 3 + bonusCount;
            for (let i = 0; i < zigzags; i++) {
                const startX = this.x + (i - 1) * 60;
                const segments = 5;
                for (let j = 0; j < segments; j++) {
                    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                    const b = new Bullet(startX + (Math.random()-0.5)*20, this.y + j * 30, angle, true);
                    b.speed = 8;
                    b.color = '#ffeb3b';
                    enemyBullets.push(b);
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
                enemyBullets.push(b);
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
                enemyBullets.push(b);
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
        
        // 随机闪电效果
        if (Math.random() < 0.3) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - h, this.y);
            ctx.lineTo(this.x - h - 20, this.y + (Math.random()-0.5)*40);
            ctx.stroke();
        }
    }
}

// 4. 机械蜘蛛 - 在屏幕边缘爬行
class MechSpider extends Boss {
    initBoss() {
        this.edge = 0; // 0=top, 1=right, 2=bottom, 3=left
        this.progress = 0.5;
        this.color = '#78909c';
    }
    
    updateMovement(now) {
        const speed = (0.002 + bossKillCount * 0.0002) * timeScale;
        this.progress += speed;
        
        if (this.progress > 1) {
            this.progress = 0;
            this.edge = (this.edge + 1) % 4;
        }
        
        const margin = 80;
        switch(this.edge) {
            case 0: // top
                this.x = margin + this.progress * (gameCanvas.width - margin * 2);
                this.y = margin;
                break;
            case 1: // right
                this.x = gameCanvas.width - margin;
                this.y = margin + this.progress * (gameCanvas.height - margin * 2);
                break;
            case 2: // bottom
                this.x = gameCanvas.width - margin - this.progress * (gameCanvas.width - margin * 2);
                this.y = gameCanvas.height - margin;
                break;
            case 3: // left
                this.x = margin;
                this.y = gameCanvas.height - margin - this.progress * (gameCanvas.height - margin * 2);
                break;
        }
    }
    
    firePattern() {
        const bonusCount = bossKillCount;
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
                    enemyBullets.push(b);
                }
            }
        } else if (pattern === 1) {
            // 追踪蛛网
            const angle = Math.atan2(player.x - this.x, -(player.y - this.y));
            for (let i = -2; i <= 2; i++) {
                const b = new Bullet(this.x, this.y, angle + i * 0.2, true);
                b.speed = 4;
                b.color = '#78909c';
                enemyBullets.push(b);
            }
        } else {
            // 全屏弹幕
            const count = 16 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 3 + (i % 3);
                b.color = '#78909c';
                enemyBullets.push(b);
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
        
        // 发光核心
        ctx.fillStyle = '#ffab91';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 5. 暗影刺客 - 隐身瞬移，快速攻击
class ShadowAssassin extends Boss {
    initBoss() {
        this.stealthTimer = 0;
        this.isStealth = false;
        this.attackTimer = 0;
        this.color = '#7e57c2';
    }
    
    updateMovement(now) {
        // 隐身机制
        this.stealthTimer += 16;
        if (this.stealthTimer > 3000) {
            this.stealthTimer = 0;
            this.isStealth = !this.isStealth;
            if (!this.isStealth) {
                // 现身时瞬移到玩家附近
                this.x = player.x + (Math.random() - 0.5) * 200;
                this.y = player.y - 100 - Math.random() * 100;
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, '#7e57c2'));
                }
            }
        }
        
        // 缓慢漂移
        if (!this.isStealth) {
            this.x += Math.sin(now / 500) * 2;
            this.y += Math.cos(now / 500) * 1;
        }
    }
    
    firePattern() {
        if (this.isStealth) return; // 隐身时不攻击
        
        const bonusCount = bossKillCount;
        const pattern = (this.shotPattern++) % 3;
        
        if (pattern === 0) {
            // 快速匕首
            const count = 5 + bonusCount;
            for (let i = 0; i < count; i++) {
                const angle = Math.atan2(player.x - this.x, -(player.y - this.y)) + (i - count/2) * 0.1;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 12;
                b.size = 6;
                b.color = '#7e57c2';
                enemyBullets.push(b);
            }
        } else if (pattern === 1) {
            // 暗影分身 - 多方向
            for (let dir = 0; dir < 4; dir++) {
                const baseAngle = dir * Math.PI / 2;
                for (let i = -1; i <= 1; i++) {
                    const b = new Bullet(this.x, this.y, baseAngle + i * 0.3, true);
                    b.speed = 8;
                    b.color = '#7e57c2';
                    enemyBullets.push(b);
                }
            }
        } else {
            // 暗影弹幕雨
            const count = 10 + bonusCount;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const angle = Math.atan2(player.x - this.x, -(player.y - this.y));
                    const b = new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.5, true);
                    b.speed = 10;
                    b.color = '#7e57c2';
                    enemyBullets.push(b);
                }, i * 100);
            }
        }
    }
    
    drawBoss() {
        const h = this.size / 2;
        const alpha = this.isStealth ? 0.3 : 1;
        
        ctx.globalAlpha = alpha;
        
        // 暗影身体
        ctx.fillStyle = this.phase === 3 ? '#7e57c2' : this.phase === 2 ? '#5e35b1' : '#4527a0';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - h);
        ctx.lineTo(this.x + h * 0.7, this.y + h * 0.5);
        ctx.lineTo(this.x - h * 0.7, this.y + h * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 紫色眼睛
        ctx.fillStyle = '#e1bee7';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 暗影斗篷
        ctx.fillStyle = `rgba(126, 87, 194, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(this.x - h, this.y);
        ctx.quadraticCurveTo(this.x, this.y + h * 1.5, this.x + h, this.y);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// 6. 混沌之眼 - 中央浮动，旋转弹幕
class ChaosEye extends Boss {
    initBoss() {
        this.orbitAngle = 0;
        this.color = '#e91e63';
    }
    
    updateMovement(now) {
        // 保持在中央，轻微浮动
        this.orbitAngle += 0.01;
        this.x = gameCanvas.width / 2 + Math.sin(this.orbitAngle) * 50;
        this.y = gameCanvas.height / 3 + Math.cos(this.orbitAngle * 0.7) * 30;
    }
    
    firePattern() {
        const bonusCount = bossKillCount;
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
                    enemyBullets.push(b);
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
                    enemyBullets.push(b);
                }
            }
        } else if (pattern === 2) {
            // 眼棱 - 持续激光弹幕
            const angle = Math.atan2(player.x - this.x, -(player.y - this.y));
            for (let i = 0; i < 5 + bonusCount; i++) {
                const b = new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.3, true);
                b.speed = 6;
                b.size = 8;
                b.color = '#f06292';
                enemyBullets.push(b);
            }
        } else {
            // 混沌爆发 - 随机方向
            const count = 20 + bonusCount * 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const b = new Bullet(this.x, this.y, angle, true);
                b.speed = 2 + Math.random() * 4;
                b.color = '#e91e63';
                enemyBullets.push(b);
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
        
        // 瞳孔中的瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 诡异光芒
        ctx.fillStyle = 'rgba(233, 30, 99, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, h * 1.2 + Math.sin(t * 3) * 5, 0, Math.PI * 2);
        ctx.fill();
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
            // 随机生成一种Boss
            const bossType = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
            let boss;
            switch(bossType) {
                case 'Destroyer': boss = new Destroyer(); break;
                case 'FrostGiant': boss = new FrostGiant(); break;
                case 'LightningRider': boss = new LightningRider(); break;
                case 'MechSpider': boss = new MechSpider(); break;
                case 'ShadowAssassin': boss = new ShadowAssassin(); break;
                case 'ChaosEye': boss = new ChaosEye(); break;
                default: boss = new Destroyer();
            }
            enemies.push(boss);
            killCount++;
        } else {
            enemies.push(new Enemy());
        }
        lastEnemySpawn = timestamp;
        // 出怪速度递增，最快150ms，击杀越多越快，boss击杀也会加速
        const minInterval = 150;
        const baseDecrement = 3 + Math.floor(killCount / 10);
        const bossBonus = bossKillCount * 2; // 每个击杀的boss额外加速
        const decrement = baseDecrement + bossBonus;
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
    if (startScreen) startScreen.classList.add('hidden');
    
    // 显示血条
    hpDisplay.style.display = 'block';
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
