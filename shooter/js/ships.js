/**
 * 飞机系统 - 不同飞机有不同的属性和特点
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress, loadProgress } from './upgrades.js';

// 飞机配置
export const SHIP_CONFIGS = [
    {
        id: 'basic',
        name: '标准战机',
        desc: '均衡的入门级战机',
        price: 0,
        color: '#9d8df7',
        stats: {
            maxHp: 3,
            damage: 1,
            fireRate: 150,
            multiShot: 1,
            bulletSize: 1
        }
    },
    {
        id: 'speed',
        name: '闪电号',
        desc: '射速极快，伤害略低',
        price: 500,
        color: '#00ffff',
        stats: {
            maxHp: 2,
            damage: 0.8,
            fireRate: 80,
            multiShot: 1,
            bulletSize: 0.8
        }
    },
    {
        id: 'tank',
        name: '重装堡垒',
        desc: '高血量高伤害，射速慢',
        price: 800,
        color: '#ff6b6b',
        stats: {
            maxHp: 5,
            damage: 1.5,
            fireRate: 220,
            multiShot: 1,
            bulletSize: 1.5
        }
    },
    {
        id: 'spread',
        name: '散弹王',
        desc: '初始3发散弹，射程较短',
        price: 1200,
        color: '#ffd93d',
        stats: {
            maxHp: 3,
            damage: 0.7,
            fireRate: 180,
            multiShot: 3,
            bulletSize: 0.9
        }
    },
    {
        id: 'sniper',
        name: '狙击者',
        desc: '超高伤害，穿透敌人',
        price: 1500,
        color: '#a855f7',
        stats: {
            maxHp: 2,
            damage: 3,
            fireRate: 300,
            multiShot: 1,
            bulletSize: 2,
            piercing: true
        }
    },
    {
        id: 'ghost',
        name: '幽灵战机',
        desc: '永久闪避+20%，低血量',
        price: 2000,
        color: '#00ff88',
        stats: {
            maxHp: 2,
            damage: 1.2,
            fireRate: 140,
            multiShot: 1,
            bulletSize: 1,
            dodgeChance: 0.2
        }
    }
];

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
    
    // 扣除金币
    GameState.coins -= config.price;
    
    // 添加到已拥有
    if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
    GameState.ownedShips.push(shipId);
    
    // 保存
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

// 应用飞机属性到玩家
export function applyShipStats() {
    const shipId = getCurrentShip();
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;
    
    // 应用基础属性
    PlayerState.maxHp = config.stats.maxHp;
    PlayerState.stats.damage = config.stats.damage;
    PlayerState.stats.fireRate = config.stats.fireRate;
    PlayerState.stats.multiShot = config.stats.multiShot;
    PlayerState.stats.bulletSize = config.stats.bulletSize;
    
    // 应用特殊属性
    PlayerState.stats.piercing = config.stats.piercing || false;
    PlayerState.stats.dodgeChance = config.stats.dodgeChance || 0;
    
    // 存储飞机颜色
    PlayerState.shipColor = config.color;
    PlayerState.shipId = config.id;
}

// 保存飞机数据
export function saveShipData() {
    const data = {
        coins: GameState.coins || 0,
        upgrades: GameState.upgrades || {},
        ownedShips: GameState.ownedShips || ['basic'],
        currentShip: GameState.currentShip || 'basic'
    };
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 加载飞机数据
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

// 渲染飞机商店
export function renderShipShop() {
    const grid = document.getElementById('ship-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    SHIP_CONFIGS.forEach(config => {
        const owned = hasShip(config.id);
        const selected = getCurrentShip() === config.id;
        
        const item = document.createElement('div');
        item.className = `ship-item ${owned ? 'owned' : ''} ${selected ? 'selected' : ''}`;
        
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
            <div class="ship-preview" style="background: ${config.color}"></div>
            <div class="ship-name">${config.name}</div>
            <div class="ship-desc">${config.desc}</div>
            <div class="ship-stats">
                <div>❤️ ${config.stats.maxHp}</div>
                <div>⚔️ ${config.stats.damage}</div>
                <div>⚡ ${Math.floor(1000/config.stats.fireRate)}/s</div>
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
}

// 更新金币显示
export function updateShipCoinDisplay() {
    const displays = [
        document.getElementById('menu-coin-display'),
        document.getElementById('upgrade-coin-display'),
        document.getElementById('ship-coin-display')
    ];
    displays.forEach(el => {
        if (el) el.textContent = GameState.coins || 0;
    });
}
