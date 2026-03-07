/**
 * 游戏状态管理
 */

// 游戏状态
export const GameState = {
    running: false,
    score: 0,
    killCount: 0,
    combo: 0,
    lastKillTime: 0,
    lastEnemySpawn: 0,
    enemySpawnInterval: 800,
    bossKillCount: 0,
    timeScale: 1,
    lastTime: 0,
    coins: 0,           // 局外金币
    upgrades: {},       // 升级等级记录
    ownedShips: ['basic'],  // 已拥有的飞机
    currentShip: 'basic'    // 当前选择的飞机
};

// 玩家状态
export const PlayerState = {
    hp: 3,
    maxHp: 3,
    shield: 0,
    invincible: false,      // 是否无敌
    invincibleEndTime: 0,   // 无敌结束时间
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

// 输入状态
export const InputState = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    lastShotTime: 0
};

// 游戏对象容器
export const GameObjects = {
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
export const DOM = {};

// Canvas 上下文
export let ctx = null;

// 设置 Canvas 上下文
export function setContext(context) {
    ctx = context;
}

// 重置游戏状态
export function resetGameState() {
    GameState.running = true;
    GameState.score = 0;
    GameState.killCount = 0;
    GameState.combo = 0;
    GameState.enemySpawnInterval = 800;
    GameState.timeScale = 1;
    GameState.lastTime = performance.now();
}

// 重置玩家状态
export function resetPlayerState() {
    PlayerState.hp = 3;
    PlayerState.maxHp = 3;
    PlayerState.shield = 0;
    PlayerState.invincible = false;
    PlayerState.invincibleEndTime = 0;
    PlayerState.stats = {
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
}
