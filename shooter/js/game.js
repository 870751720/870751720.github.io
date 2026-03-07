/**
 * 游戏主逻辑
 */

import { GameState, PlayerState, InputState, GameObjects, DOM, setContext, ctx } from './state.js';
import { BOSS_TYPES } from './config.js';
import { checkCollision, showFloatingText } from './utils.js';
import { updateHpDisplay, updateBuffDisplay, updateCombo } from './ui.js';
import { collectItem, spawnItem, updateBuffs } from './items.js';
import { Player, Wingman, Bullet, Enemy, Item, Particle } from './entities.js';
import { Destroyer, FrostGiant, LightningRider, MechSpider, ShadowAssassin, ChaosEye } from './bosses.js';
import { addCoins, updateCoinDisplays, applyUpgrades } from './upgrades.js';
import { applyShipStats, addMaterial, MATERIAL_CONFIGS } from './ships.js';

// 材料颜色映射
const MATERIAL_COLORS = {
    common: '#888888',
    rare: '#4ade80',
    epic: '#60a5fa',
    legendary: '#fbbf24'
};

const bossClasses = { Destroyer, FrostGiant, LightningRider, MechSpider, ShadowAssassin, ChaosEye };

let lastTime = 0;
let comboTimerRef = { timer: null };

/**
 * 游戏主循环
 */
export function gameLoop(timestamp) {
    if (!GameState.running) return;

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // 背景拖尾
    ctx.fillStyle = 'rgba(26, 26, 46, 0.25)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 更新系统
    updateBuffs(dt);

    // 更新无敌状态
    if (PlayerState.invincible && performance.now() > PlayerState.invincibleEndTime) {
        PlayerState.invincible = false;
    }

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

    // 绘制
    drawGameObjects();

    requestAnimationFrame(gameLoop);
}

/**
 * 生成敌人
 */
function spawnEnemies(timestamp) {
    if (timestamp - GameState.lastEnemySpawn > GameState.enemySpawnInterval / GameState.timeScale) {
        if (GameState.killCount > 0 && GameState.killCount % 20 === 0) {
            const bossType = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
            GameObjects.enemies.push(new (bossClasses[bossType])());
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

/**
 * 射击
 */
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

/**
 * 更新游戏对象
 */
function updateGameObjects(timestamp) {
    GameObjects.player.update(InputState);
    GameObjects.wingmen.forEach(w => w.update(GameObjects.player));

    GameObjects.items.forEach(item => {
        item.update(GameObjects.player);
        if (checkCollision(GameObjects.player, item)) {
            collectItem(item);
        }
    });

    GameObjects.bullets.forEach(b => b.update(GameObjects.enemies));
    GameObjects.enemyBullets.forEach(b => b.update([]));
    GameObjects.enemies.forEach(e => e.update(timestamp));
    GameObjects.particles.forEach(p => p.update());
}

/**
 * 碰撞检测
 */
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

/**
 * 处理敌人死亡
 */
function handleEnemyDeath(enemy) {
    GameState.score += enemy.type === 'boss' ? 500 : 10 * GameState.combo;
    DOM.gameScore.textContent = 'SCORE: ' + GameState.score;

    // 金币掉落
    const coinAmount = enemy.type === 'boss' ? 50 : 5;
    const actualCoins = addCoins(coinAmount);
    showFloatingText(enemy.x, enemy.y, `+${actualCoins}💰`, '#ffd700');

    // 材料掉落
    if (enemy.type === 'boss') {
        // Boss掉落史诗或传说材料
        const matType = Math.random() < 0.7 ? 'epic' : 'legendary';
        const matAmount = Math.random() < 0.7 ? 1 : 2;
        addMaterial(matType, matAmount);
        showFloatingText(enemy.x, enemy.y - 20, `+${matAmount}${matType === 'epic' ? '⚡' : '💎'}`, MATERIAL_COLORS[matType]);
    } else if (enemy.type === 'shooter' || enemy.type === 'tank' || enemy.type === 'splitter') {
        // 精英怪掉落稀有材料 (30%概率)
        if (Math.random() < 0.3) {
            addMaterial('rare', 1);
            showFloatingText(enemy.x, enemy.y - 20, `+1🔩`, '#4ade80');
        } else {
            // 普通材料
            addMaterial('common', 1);
        }
    } else {
        // 普通怪掉落普通材料 (50%概率)
        if (Math.random() < 0.5) {
            addMaterial('common', 1);
        }
    }

    if (enemy.type !== 'boss') {
        GameState.killCount++;
        updateCombo(GameState, comboTimerRef);
    }

    if (enemy.type === 'boss' || Math.random() < 0.15) {
        spawnItem(enemy.x, enemy.y, Item);
    }
}

/**
 * 处理玩家被击中
 */
function handlePlayerHit(obj) {
    // 无敌状态下不受伤害
    if (PlayerState.invincible) return;

    if (obj.type !== 'boss') obj.active = false;

    if (PlayerState.shield > 0) {
        PlayerState.shield--;
        showFloatingText(GameObjects.player.x, GameObjects.player.y, '护盾抵消!', '#00ffaa');
    } else {
        PlayerState.hp--;
        showFloatingText(GameObjects.player.x, GameObjects.player.y, '-1 HP', '#ff5555');
        // 设置2秒无敌时间
        PlayerState.invincible = true;
        PlayerState.invincibleEndTime = performance.now() + 2000;
    }

    updateHpDisplay();

    if (PlayerState.hp <= 0) {
        gameOver();
    }
}

/**
 * 清理无效对象
 */
function cleanupObjects() {
    GameObjects.bullets = GameObjects.bullets.filter(b => b.active);
    GameObjects.enemyBullets = GameObjects.enemyBullets.filter(b => b.active);
    GameObjects.enemies = GameObjects.enemies.filter(e => e.active);
    GameObjects.particles = GameObjects.particles.filter(p => p.active);
    GameObjects.items = GameObjects.items.filter(i => i.active);
}

/**
 * 绘制游戏对象
 */
function drawGameObjects() {
    GameObjects.particles.forEach(p => p.draw());
    GameObjects.items.forEach(i => i.draw(performance.now()));
    GameObjects.bullets.forEach(b => b.draw());
    GameObjects.enemyBullets.forEach(b => b.draw());
    GameObjects.enemies.forEach(e => e.draw());
    GameObjects.wingmen.forEach(w => w.draw());
    GameObjects.player.draw(InputState);
}

/**
 * 游戏结束
 */
function gameOver() {
    GameState.running = false;

    // 结算金币奖励
    const scoreBonus = Math.floor(GameState.score / 100);
    const totalCoins = addCoins(scoreBonus);

    const startScreen = DOM.startScreen;
    if (startScreen) {
        startScreen.classList.remove('hidden');

        // 更新标题
        const title = startScreen.querySelector('h1');
        if (title) title.textContent = `游戏结束 - 得分: ${GameState.score}`;

        // 更新描述
        const hint = startScreen.querySelector('.menu-hint');
        if (hint) {
            hint.innerHTML = `击杀: ${GameState.killCount} | Boss击杀: ${GameState.bossKillCount}<br>本局金币: ${totalCoins} | 总金币: ${GameState.coins || 0}`;
        }

        // 更新按钮文字
        const startBtn = DOM.startBtn;
        if (startBtn) startBtn.textContent = '重新开始';

        // 更新菜单金币显示
        updateCoinDisplays();
    }

    document.body.classList.remove('game-active');
    DOM.hpDisplay.style.display = 'none';
}

/**
 * 开始游戏
 */
export function startGame() {
    // 重置状态
    GameState.running = true;
    GameState.score = 0;
    GameState.killCount = 0;
    GameState.combo = 0;
    GameState.enemySpawnInterval = 800;
    GameState.timeScale = 1;
    lastTime = performance.now();

    // 应用升级和飞机效果
    applyUpgrades();
    applyShipStats();

    PlayerState.hp = PlayerState.maxHp;
    PlayerState.invincible = false;
    PlayerState.invincibleEndTime = 0;
    PlayerState.stats.wingmanCount = 0;
    PlayerState.stats.homing = false;

    // 清空对象
    GameObjects.player = new Player();
    GameObjects.wingmen = [];
    GameObjects.bullets = [];
    GameObjects.enemyBullets = [];
    GameObjects.enemies = [];
    GameObjects.particles = [];
    GameObjects.items = [];
    GameObjects.activeBuffs = {};

    InputState.mouseX = ctx.canvas.width / 2;
    InputState.mouseY = ctx.canvas.height - 100;

    DOM.gameScore.textContent = 'SCORE: 0';
    updateHpDisplay();
    updateBuffDisplay();

    document.body.classList.add('game-active');
    if (DOM.startScreen) DOM.startScreen.classList.add('hidden');
    DOM.hpDisplay.style.display = 'block';

    requestAnimationFrame(gameLoop);
}
