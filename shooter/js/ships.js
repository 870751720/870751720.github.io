/**
 * 飞机系统 - 不同等级有不同美术表现
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress } from './upgrades.js';

// 等级配置
export const RANK_CONFIGS = {
    'C': { name: 'C', color: '#888888', glow: 0, priceMultiplier: 1 },
    'B': { name: 'B', color: '#4ade80', glow: 10, priceMultiplier: 1.5 },
    'A': { name: 'A', color: '#60a5fa', glow: 20, priceMultiplier: 2.5 },
    'SSR': { name: 'SSR', color: '#fbbf24', glow: 30, priceMultiplier: 5 }
};

// 飞机配置
export const SHIP_CONFIGS = [
    // C级 - 量产型
    {
        id: 'basic',
        name: '标准战机',
        rank: 'C',
        desc: '均衡的入门级战机',
        price: 0,
        color: '#9d8df7',
        stats: { maxHp: 3, damage: 1, fireRate: 150, multiShot: 1, bulletSize: 1 }
    },
    {
        id: 'training',
        name: '训练机',
        rank: 'C',
        desc: '新手练习用机，血量略高',
        price: 100,
        color: '#a8a8a8',
        stats: { maxHp: 4, damage: 0.8, fireRate: 160, multiShot: 1, bulletSize: 1 }
    },
    // B级 - 改装型
    {
        id: 'speed',
        name: '闪电号',
        rank: 'B',
        desc: '改装引擎，射速极快',
        price: 600,
        color: '#00ffff',
        stats: { maxHp: 2, damage: 0.9, fireRate: 75, multiShot: 1, bulletSize: 0.9 }
    },
    {
        id: 'guardian',
        name: '守卫者',
        rank: 'B',
        desc: '强化装甲，初始带护盾',
        price: 750,
        color: '#4ade80',
        stats: { maxHp: 4, damage: 1, fireRate: 160, multiShot: 1, bulletSize: 1, startShield: 1 }
    },
    // A级 - 特装型
    {
        id: 'tank',
        name: '重装堡垒',
        rank: 'A',
        desc: '重装机体，高血高伤',
        price: 1500,
        color: '#ff6b6b',
        stats: { maxHp: 6, damage: 1.5, fireRate: 200, multiShot: 1, bulletSize: 1.5 }
    },
    {
        id: 'spread',
        name: '散弹王',
        rank: 'A',
        desc: '火力覆盖型，3发散弹',
        price: 1800,
        color: '#ffd93d',
        stats: { maxHp: 4, damage: 0.8, fireRate: 170, multiShot: 3, bulletSize: 0.9 }
    },
    {
        id: 'sniper',
        name: '狙击者',
        rank: 'A',
        desc: '远距离精准打击，穿透敌人',
        price: 2000,
        color: '#a855f7',
        stats: { maxHp: 3, damage: 2.5, fireRate: 280, multiShot: 1, bulletSize: 1.8, piercing: true }
    },
    // SSR级 - 传说
    {
        id: 'ghost',
        name: '幽灵战机',
        rank: 'SSR',
        desc: '传说级隐身战机，30%闪避',
        price: 5000,
        color: '#00ff88',
        stats: { maxHp: 4, damage: 1.5, fireRate: 130, multiShot: 1, bulletSize: 1.1, dodgeChance: 0.3, startShield: 2 }
    },
    {
        id: 'phoenix',
        name: '凤凰号',
        rank: 'SSR',
        desc: '不死传说，死亡时复活一次',
        price: 6000,
        color: '#ff4500',
        stats: { maxHp: 5, damage: 1.8, fireRate: 150, multiShot: 2, bulletSize: 1.3, revive: true }
    },
    {
        id: 'divine',
        name: '神谕',
        rank: 'SSR',
        desc: '终极机体，全方位强化',
        price: 8000,
        color: '#ffd700',
        stats: { maxHp: 8, damage: 2, fireRate: 120, multiShot: 3, bulletSize: 1.5, startShield: 2, piercing: true }
    }
];

// 获取等级配置
export function getRankConfig(rank) {
    return RANK_CONFIGS[rank] || RANK_CONFIGS['C'];
}

// 获取已拥有的飞机
export function getOwnedShips() {
    return GameState.ownedShips || ['basic'];
}

// 获取当前选择的飞机
export function getCurrentShip() {
    return GameState.currentShip || 'basic';
}

// 检查是否拥有某飞机
export function hasShip(shipId) {
    return getOwnedShips().includes(shipId);
}

// 购买飞机
export function buyShip(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return { success: false, message: '飞机不存在' };
    if (hasShip(shipId)) return { success: false, message: '已拥有该飞机' };
    if ((GameState.coins || 0) < config.price) return { success: false, message: '金币不足' };
    
    GameState.coins -= config.price;
    if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
    GameState.ownedShips.push(shipId);
    saveShipData();
    
    return { success: true, message: '购买成功' };
}

// 选择飞机
export function selectShip(shipId) {
    if (!hasShip(shipId)) return false;
    GameState.currentShip = shipId;
    saveShipData();
    return true;
}

// 应用飞机属性
export function applyShipStats() {
    const shipId = getCurrentShip();
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;
    
    PlayerState.maxHp = config.stats.maxHp;
    PlayerState.stats.damage = config.stats.damage;
    PlayerState.stats.fireRate = config.stats.fireRate;
    PlayerState.stats.multiShot = config.stats.multiShot;
    PlayerState.stats.bulletSize = config.stats.bulletSize;
    PlayerState.stats.piercing = config.stats.piercing || false;
    PlayerState.stats.dodgeChance = config.stats.dodgeChance || 0;
    PlayerState.stats.startShield = config.stats.startShield || 0;
    PlayerState.stats.revive = config.stats.revive || false;
    
    PlayerState.shipColor = config.color;
    PlayerState.shipId = config.id;
    PlayerState.shipRank = config.rank;
}

// 保存数据
export function saveShipData() {
    const data = JSON.parse(localStorage.getItem('shooterProgress') || '{}');
    data.ownedShips = GameState.ownedShips || ['basic'];
    data.currentShip = GameState.currentShip || 'basic';
    data.coins = GameState.coins || 0;
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 加载数据
export function loadShipData() {
    try {
        const data = JSON.parse(localStorage.getItem('shooterProgress'));
        if (data) {
            GameState.ownedShips = data.ownedShips || ['basic'];
            GameState.currentShip = data.currentShip || 'basic';
        }
    } catch (e) {
        GameState.ownedShips = ['basic'];
        GameState.currentShip = 'basic';
    }
}

// 渲染商店
export function renderShipShop() {
    const grid = document.getElementById('ship-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // 按等级分组
    const groups = { 'SSR': [], 'A': [], 'B': [], 'C': [] };
    SHIP_CONFIGS.forEach(config => {
        if (groups[config.rank]) groups[config.rank].push(config);
    });
    
    // 按 SSR -> A -> B -> C 顺序渲染
    ['SSR', 'A', 'B', 'C'].forEach(rank => {
        const rankConfig = RANK_CONFIGS[rank];
        
        // 等级标题
        const rankHeader = document.createElement('div');
        rankHeader.className = 'rank-header';
        rankHeader.innerHTML = `<span class="rank-badge rank-${rank}">${rankConfig.name}级</span>`;
        rankHeader.style.gridColumn = '1 / -1';
        grid.appendChild(rankHeader);
        
        // 该等级的飞机
        groups[rank].forEach(config => {
            const owned = hasShip(config.id);
            const selected = getCurrentShip() === config.id;
            const rankCfg = rankConfig;
            
            const item = document.createElement('div');
            item.className = `ship-item rank-${config.rank.toLowerCase()} ${owned ? 'owned' : ''} ${selected ? 'selected' : ''}`;
            
            let buttonText, buttonClass, buttonDisabled;
            if (selected) {
                buttonText = '当前使用';
                buttonClass = 'selected';
                buttonDisabled = true;
            } else if (owned) {
                buttonText = '装备';
                buttonClass = 'equip';
                buttonDisabled = false;
            } else {
                buttonText = `💰 ${config.price}`;
                buttonClass = '';
                buttonDisabled = (GameState.coins || 0) < config.price;
            }
            
            item.innerHTML = `
                <div class="ship-rank rank-${config.rank.toLowerCase()}">${config.rank}</div>
                <div class="ship-preview rank-${config.rank.toLowerCase()}" style="--ship-color: ${config.color}"></div>
                <div class="ship-name">${config.name}</div>
                <div class="ship-desc">${config.desc}</div>
                <div class="ship-stats">
                    <div>❤️${config.stats.maxHp}</div>
                    <div>⚔️${config.stats.damage}</div>
                    <div>⚡${(1000/config.stats.fireRate).toFixed(1)}/s</div>
                </div>
                <button class="ship-btn ${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            `;
            
            const btn = item.querySelector('.ship-btn');
            btn.addEventListener('click', () => {
                if (owned && !selected) {
                    selectShip(config.id);
                    renderShipShop();
                } else if (!owned) {
                    const result = buyShip(config.id);
                    if (result.success) {
                        renderShipShop();
                        updateShipCoinDisplay();
                    }
                }
            });
            
            grid.appendChild(item);
        });
    });
}

// 更新金币显示
export function updateShipCoinDisplay() {
    ['menu-coin-display', 'upgrade-coin-display', 'ship-coin-display'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = GameState.coins || 0;
    });
}
