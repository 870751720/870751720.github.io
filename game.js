/**
 * 弹幕射击游戏 - 贺加文主页
 */

// ==================== 游戏配置 ====================
const ITEM_TYPES = [
    { id: 'rapid', name: '疾速射击', color: '#00ff00', duration: 5000, icon: '⚡' },
    { id: 'spread', name: '散弹枪', color: '#ff6600', duration: 6000, icon: '✦' },
    { id: 'big', name: '巨型子弹', color: '#ff00ff', duration: 5000, icon: '●' },
    { id: 'slow', name: '时间缓速', color: '#00ffff', duration: 4000, icon: '❄' },
    { id: 'auto', name: '自动连发', color: '#ffff00', duration: 5000, icon: '♦' },
    { id: 'double', name: '分数翻倍', color: '#ffd700', duration: 8000, icon: '×2' },
    { id: 'magnet', name: '磁力吸引', color: '#ff69b4', duration: 6000, icon: '◎' },
    { id: 'shield', name: '无敌护盾', color: '#00ffaa', duration: 3000, icon: '⛨' },
    { id: 'perm_spd', name: '永久攻速+', color: '#ffffff', duration: 0, icon: '↑⚡', permanent: true },
    { id: 'perm_dmg', name: '永久伤害+', color: '#ff4444', duration: 0, icon: '↑✦', permanent: true }
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
let mouseX = 0;
let mouseDown = false;
let lastShotTime = 0;

// 玩家属性
let player = null;
let playerStats = {
    fireRate: 150,      // 射击间隔(ms)
    bulletSize: 1,      // 子弹大小倍率
    damage: 1,          // 伤害
    multiShot: 1,       // 子弹数量
    magnetRange: 0,     // 磁力范围
    scoreMultiplier: 1  // 分数倍率
};

// 临时buff
let activeBuffs = {};
let timeScale = 1;

// 游戏对象
let bullets = [];
let enemies = [];
let particles = [];
let items = [];

// 生成控制
let lastEnemySpawn = 0;
let enemySpawnInterval = 800;

// DOM
let startBtn, gameCanvas, gameScore, comboDisplay, comboCountEl;
let buffDisplay = null;

// ==================== 初始化 ====================
function initGame() {
    startBtn = document.getElementById('start-game-btn');
    gameCanvas = document.getElementById('game-canvas');
    gameScore = document.getElementById('game-score');
    comboDisplay = document.getElementById('combo-display');
    comboCountEl = comboDisplay.querySelector('.combo-count');
    
    // 创建buff显示面板
    buffDisplay = document.createElement('div');
    buffDisplay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 5;
    `;
    document.body.appendChild(buffDisplay);
    
    startBtn.addEventListener('click', startGame);
    
    window.addEventListener('mousemove', (e) => mouseX = e.clientX);
    
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

// ==================== 道具系统 ====================
class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.active = true;
        this.vy = 1;
        this.type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        // 磁力吸引
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
        
        // 外圈光晕
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 15;
        
        // 背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x - this.size/2, this.y + bob - this.size/2, this.size, this.size);
        
        // 边框
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.size/2, this.y + bob - this.size/2, this.size, this.size);
        
        ctx.shadowBlur = 0;
        
        // 图标
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
    
    if (type.permanent) {
        // 永久升级
        if (type.id === 'perm_spd') {
            playerStats.fireRate = Math.max(50, playerStats.fireRate - 10);
            showFloatingText(item.x, item.y, '攻速+!', '#00ff00');
        } else if (type.id === 'perm_dmg') {
            playerStats.damage++;
            showFloatingText(item.x, item.y, '伤害+!', '#ff4444');
        }
    } else {
        // 临时buff
        activeBuffs[type.id] = {
            endTime: performance.now() + type.duration,
            type: type
        };
        updateBuffDisplay();
    }
    
    item.active = false;
    
    // 收集特效
    for (let i = 0; i < 6; i++) {
        particles.push(new Particle(item.x, item.y, type.color));
    }
}

function updateBuffs(now) {
    let changed = false;
    
    // 重置基础值
    timeScale = 1;
    playerStats.multiShot = 1;
    playerStats.bulletSize = 1;
    playerStats.magnetRange = 0;
    playerStats.scoreMultiplier = 1;
    
    for (let id in activeBuffs) {
        const buff = activeBuffs[id];
        if (now > buff.endTime) {
            delete activeBuffs[id];
            changed = true;
        } else {
            // 应用buff效果
            switch(id) {
                case 'rapid':
                    playerStats.fireRate = 75;
                    break;
                case 'spread':
                    playerStats.multiShot = 3;
                    break;
                case 'big':
                    playerStats.bulletSize = 2.5;
                    break;
                case 'slow':
                    timeScale = 0.4;
                    break;
                case 'auto':
                    // 在update中处理
                    break;
                case 'double':
                    playerStats.scoreMultiplier = 2;
                    break;
                case 'magnet':
                    playerStats.magnetRange = 200;
                    break;
            }
        }
    }
    
    if (changed) updateBuffDisplay();
}

function updateBuffDisplay() {
    buffDisplay.innerHTML = '';
    const now = performance.now();
    
    for (let id in activeBuffs) {
        const buff = activeBuffs[id];
        const remaining = Math.ceil((buff.endTime - now) / 1000);
        
        const badge = document.createElement('div');
        badge.style.cssText = `
            background: ${buff.type.color};
            color: #000;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
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

// ==================== 玩家 ====================
class Player {
    constructor() {
        this.size = 16;
        this.y = gameCanvas.height - 60;
        this.x = gameCanvas.width / 2;
        this.color = '#9d8df7';
    }
    
    update() {
        this.x = Math.max(this.size, Math.min(gameCanvas.width - this.size, mouseX));
        this.y = gameCanvas.height - 60;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        const s = this.size;
        ctx.fillRect(this.x - 4, this.y - 8, 8, 16);
        ctx.fillRect(this.x - 12, this.y, 24, 6);
        ctx.fillRect(this.x - 8, this.y + 4, 16, 4);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - 2, this.y - 12, 4, 6);
        ctx.shadowBlur = 0;
    }
}

// ==================== 子弹 ====================
class Bullet {
    constructor(x, y, angle = 0) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.size = 4 * playerStats.bulletSize;
        this.active = true;
        this.angle = angle;
        this.damage = playerStats.damage;
    }
    
    update() {
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
        if (this.y < 0 || this.x < 0 || this.x > gameCanvas.width) this.active = false;
    }
    
    draw() {
        ctx.fillStyle = '#fff';
        const s = this.size;
        ctx.fillRect(this.x - s/2, this.y - s, s, s * 2);
        ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
        ctx.fillRect(this.x - s/4, this.y, s/2, s);
    }
}

function shoot() {
    const now = performance.now();
    if (now - lastShotTime < playerStats.fireRate) return;
    
    lastShotTime = now;
    
    const count = playerStats.multiShot;
    if (count === 1) {
        bullets.push(new Bullet(player.x, player.y - 15));
    } else {
        for (let i = 0; i < count; i++) {
            const angle = (i - (count - 1) / 2) * 0.3;
            bullets.push(new Bullet(player.x, player.y - 15, angle));
        }
    }
}

// ==================== 敌人 ====================
class Enemy {
    constructor(side) {
        this.size = 24;
        this.active = true;
        this.hp = 2; // 基础血量2
        this.isBoss = false;
        this.side = side;
        
        const minY = 50;
        const maxY = gameCanvas.height - 200;
        this.y = minY + Math.random() * (maxY - minY);
        
        if (side === 'left') {
            this.x = -this.size;
            this.vx = 2 + Math.random() * 2;
            this.vy = 0.5 + Math.random() * 1;
        } else {
            this.x = gameCanvas.width + this.size;
            this.vx = -(2 + Math.random() * 2);
            this.vy = 0.5 + Math.random() * 1;
        }
    }
    
    update() {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        
        if (this.y > gameCanvas.height + 50 || this.x < -100 || this.x > gameCanvas.width + 100) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = this.side === 'left' ? '#e87e7e' : '#7ee8e8';
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 7, this.y - 4, 5, 5);
        ctx.fillRect(this.x + 2, this.y - 4, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 5, this.y - 2, 2, 2);
        ctx.fillRect(this.x + 3, this.y - 2, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 5, this.y + 4, 3, 4);
        ctx.fillRect(this.x + 2, this.y + 4, 3, 4);
        
        // 血条
        if (this.hp > 1) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 12, this.y - 18, 24, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - 10, this.y - 17, 20 * (this.hp / 2), 2);
        }
    }
    
    onHit(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.active = false;
            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x, this.y, this.side === 'left' ? '#e87e7e' : '#7ee8e8'));
            }
            return true;
        }
        return false;
    }
}

class Boss extends Enemy {
    constructor(side) {
        super(side);
        this.size = 48;
        this.hp = 15;
        this.maxHp = 15;
        this.isBoss = true;
        this.side = side;
        
        const minY = 80;
        const maxY = gameCanvas.height - 250;
        this.y = minY + Math.random() * (maxY - minY);
        
        if (side === 'left') {
            this.x = -this.size;
            this.vx = 1.5;
            this.vy = 0.3;
        } else {
            this.x = gameCanvas.width + this.size;
            this.vx = -1.5;
            this.vy = 0.3;
        }
    }
    
    draw() {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x - 24, this.y - 24, 8, 8);
        ctx.fillRect(this.x + 16, this.y - 24, 8, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 12, this.y - 8, 8, 8);
        ctx.fillRect(this.x + 4, this.y - 8, 8, 8);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 10, this.y - 6, 4, 4);
        ctx.fillRect(this.x + 6, this.y - 6, 4, 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 22, this.y - 32, 44, 6);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 20, this.y - 30, 40 * (this.hp / this.maxHp), 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 8, this.y + 8, 4, 6);
        ctx.fillRect(this.x + 4, this.y + 8, 4, 6);
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
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // 拖尾效果
    ctx.fillStyle = 'rgba(26, 26, 46, 0.25)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    const now = performance.now();
    
    // 更新buff
    updateBuffs(now);
    
    // 自动射击buff
    if (activeBuffs['auto'] && mouseDown && now - lastShotTime > playerStats.fireRate) {
        shoot();
    }
    
    // 连发
    if (mouseDown && now - lastShotTime > playerStats.fireRate) {
        shoot();
    }
    
    // 生成敌人
    if (now - lastEnemySpawn > enemySpawnInterval / timeScale) {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        if (killCount > 0 && killCount % 20 === 0) {
            enemies.push(new Boss(side));
            killCount++;
        } else {
            enemies.push(new Enemy(side));
        }
        lastEnemySpawn = now;
        enemySpawnInterval = Math.max(300, enemySpawnInterval - 2);
    }
    
    // 玩家
    player.update();
    player.draw();
    
    // 道具
    items = items.filter(item => item.active);
    items.forEach(item => {
        item.update();
        item.draw(now);
        
        if (checkCollision(player, item)) {
            collectItem(item);
        }
    });
    
    // 子弹
    bullets = bullets.filter(b => b.active);
    bullets.forEach(b => {
        b.update();
        b.draw();
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
        e.update();
        e.draw();
        
        bullets.forEach(b => {
            if (b.active && checkCollision(b, e)) {
                if (!activeBuffs['big']) b.active = false; // 大子弹穿透
                if (e.onHit(b.damage)) {
                    killCount++;
                    score += (e.isBoss ? 1000 : 100) * playerStats.scoreMultiplier;
                    gameScore.textContent = 'SCORE: ' + score;
                    updateCombo();
                    
                    // 掉落道具
                    const dropRate = e.isBoss ? 1 : 0.2;
                    if (Math.random() < dropRate) {
                        spawnItem(e.x, e.y);
                    }
                }
            }
        });
    });
    
    animationId = requestAnimationFrame(gameLoop);
}

// ==================== 开始游戏 ====================
function startGame() {
    gameRunning = true;
    score = 0;
    killCount = 0;
    combo = 0;
    bullets = [];
    enemies = [];
    particles = [];
    items = [];
    activeBuffs = {};
    timeScale = 1;
    
    // 重置属性
    playerStats = {
        fireRate: 150,
        bulletSize: 1,
        damage: 1,
        multiShot: 1,
        magnetRange: 0,
        scoreMultiplier: 1
    };
    
    enemySpawnInterval = 800;
    gameScore.textContent = 'SCORE: 0';
    updateBuffDisplay();
    
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    ctx = gameCanvas.getContext('2d');
    
    player = new Player();
    mouseX = gameCanvas.width / 2;
    
    document.body.classList.add('game-active');
    startBtn.classList.add('hidden');
    gameCanvas.classList.add('active');
    gameScore.classList.add('active');
    
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

// 初始化
document.addEventListener('DOMContentLoaded', initGame);
