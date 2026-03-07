/**
 * 弹幕射击游戏 - 贺加文主页
 */

// 游戏状态
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
let player = null;
let bullets = [];
let enemies = [];
let particles = [];
let lastEnemySpawn = 0;
let enemySpawnInterval = 800;

let cardRect = null;
let containerRect = null;

// DOM 元素
let startBtn, gameCanvas, gameScore, comboDisplay, comboCountEl;

// 初始化游戏
function initGame() {
    startBtn = document.getElementById('start-game-btn');
    gameCanvas = document.getElementById('game-canvas');
    gameScore = document.getElementById('game-score');
    comboDisplay = document.getElementById('combo-display');
    comboCountEl = comboDisplay.querySelector('.combo-count');
    
    startBtn.addEventListener('click', startGame);
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
    });
    
    window.addEventListener('mousedown', (e) => {
        if (gameRunning && e.button === 0) {
            mouseDown = true;
            bullets.push(new Bullet(player.x, player.y - 15));
            lastShotTime = performance.now();
        }
    });
    
    window.addEventListener('mouseup', () => {
        mouseDown = false;
    });
    
    window.addEventListener('resize', () => {
        if (gameRunning) {
            gameCanvas.width = window.innerWidth;
            gameCanvas.height = window.innerHeight;
            updateRects();
        }
    });
}

function updateRects() {
    const card = document.getElementById('hero-card');
    const container = document.querySelector('.container');
    cardRect = card.getBoundingClientRect();
    containerRect = container.getBoundingClientRect();
}

// 更新连击
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

// 粒子效果类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.08 + Math.random() * 0.05;
        this.color = color;
        this.size = 2 + Math.random() * 3;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// 玩家类
class Player {
    constructor() {
        this.size = 16;
        this.y = gameCanvas.height - 60;
        this.x = gameCanvas.width / 2;
        this.color = '#9d8df7';
    }
    
    update() {
        this.x = Math.max(this.size, Math.min(gameCanvas.width - this.size, mouseX));
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 4, this.y - 8, 8, 16);
        ctx.fillRect(this.x - 12, this.y, 24, 6);
        ctx.fillRect(this.x - 8, this.y + 4, 16, 4);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - 2, this.y - 12, 4, 6);
        ctx.shadowBlur = 0;
    }
}

// 子弹类
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.size = 4;
        this.active = true;
    }
    
    update() {
        this.y -= this.speed;
        if (this.y < 0) this.active = false;
    }
    
    draw() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 2, this.y - 6, 4, 12);
        ctx.fillStyle = 'rgba(157, 141, 247, 0.5)';
        ctx.fillRect(this.x - 1, this.y + 6, 2, 5);
    }
}

// 普通敌人
class Enemy {
    constructor(side) {
        this.size = 24;
        this.active = true;
        this.hp = 1;
        this.isBoss = false;
        
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
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.y > gameCanvas.height + 50 || this.x < -50 || this.x > gameCanvas.width + 50) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = '#e87e7e';
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
    }
    
    onHit() {
        this.hp--;
        if (this.hp <= 0) {
            this.active = false;
            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x, this.y, '#e87e7e'));
            }
            return true;
        }
        return false;
    }
}

// Boss敌人
class Boss extends Enemy {
    constructor(side) {
        super(side);
        this.size = 48;
        this.hp = 10;
        this.isBoss = true;
        this.maxHp = 10;
        
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
    
    onHit() {
        this.hp--;
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(this.x + (Math.random()-0.5)*30, this.y + (Math.random()-0.5)*30, '#ff6b6b'));
        }
        if (this.hp <= 0) {
            this.active = false;
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(this.x, this.y, '#ffd700'));
                particles.push(new Particle(this.x, this.y, '#ff6b6b'));
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

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    ctx.fillStyle = 'rgba(26, 26, 46, 0.2)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    if (mouseDown && timestamp - lastShotTime > 150) {
        bullets.push(new Bullet(player.x, player.y - 15));
        lastShotTime = timestamp;
    }
    
    if (timestamp - lastEnemySpawn > enemySpawnInterval) {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        if (killCount > 0 && killCount % 20 === 0) {
            enemies.push(new Boss(side));
            killCount++;
        } else {
            enemies.push(new Enemy(side));
        }
        lastEnemySpawn = timestamp;
        enemySpawnInterval = Math.max(300, enemySpawnInterval - 2);
    }
    
    player.y = gameCanvas.height - 60;
    player.update();
    player.draw();
    
    bullets = bullets.filter(b => b.active);
    bullets.forEach(b => {
        b.update();
        b.draw();
    });
    
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    enemies = enemies.filter(e => e.active);
    enemies.forEach(e => {
        e.update();
        e.draw();
        
        bullets.forEach(b => {
            if (b.active && checkCollision(b, e)) {
                b.active = false;
                if (e.onHit()) {
                    killCount++;
                    score += e.isBoss ? 1000 : 100;
                    gameScore.textContent = 'SCORE: ' + score;
                    updateCombo();
                }
            }
        });
    });
    
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    score = 0;
    killCount = 0;
    combo = 0;
    bullets = [];
    enemies = [];
    particles = [];
    enemySpawnInterval = 800;
    gameScore.textContent = 'SCORE: 0';
    
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    ctx = gameCanvas.getContext('2d');
    
    updateRects();
    
    player = new Player();
    mouseX = gameCanvas.width / 2;
    
    document.body.classList.add('game-active');
    startBtn.classList.add('hidden');
    gameCanvas.classList.add('active');
    gameScore.classList.add('active');
    
    lastEnemySpawn = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);
