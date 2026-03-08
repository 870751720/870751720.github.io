/**
 * 升级系统 - 局外养成
 */

import { PlayerState, GameState } from './state.js';
import { getStorage, setStorage } from './core/storage.js';

// 升级项目配置
export const UPGRADE_CONFIGS = [
    {
        id: 'maxHp',
        name: '装甲强化',
        desc: '初始生命值 +1',
        maxLevel: 5,
        baseCost: 100,
        costMultiplier: 1.5,
        effect: (level) => { PlayerState.maxHp = 3 + level; }
    },
    {
        id: 'damage',
        name: '火力核心',
        desc: '子弹伤害 +1',
        maxLevel: 10,
        baseCost: 80,
        costMultiplier: 1.4,
        effect: (level) => { PlayerState.stats.damage = 1 + level; }
    },
    {
        id: 'fireRate',
        name: '射速增幅',
        desc: '射击间隔 -10ms',
        maxLevel: 8,
        baseCost: 120,
        costMultiplier: 1.5,
        effect: (level) => { PlayerState.stats.fireRate = Math.max(50, 150 - level * 10); }
    },
    {
        id: 'shield',
        name: '护盾发生器',
        desc: '初始护盾 +1',
        maxLevel: 3,
        baseCost: 200,
        costMultiplier: 2,
        effect: (level) => { PlayerState.shield = level; }
    },
    {
        id: 'multiShot',
        name: '散弹改装',
        desc: '初始多发子弹',
        maxLevel: 2,
        baseCost: 500,
        costMultiplier: 3,
        effect: (level) => { PlayerState.stats.multiShot = 1 + level; }
    },
    {
        id: 'coinBonus',
        name: '赏金猎人',
        desc: '金币获取 +20%',
        maxLevel: 5,
        baseCost: 150,
        costMultiplier: 1.6,
        effect: (level) => { /* 在金币获取时计算 */ }
    }
];

// 保存数据
export function saveProgress() {
  setStorage('coins', GameState.coins || 0);
  setStorage('upgrades', GameState.upgrades || {});
}

// 从 localStorage 读取数据
export function loadProgress() {
  GameState.coins = getStorage('coins') || 0;
  GameState.upgrades = getStorage('upgrades') || {};
  applyUpgrades();
}

// 应用所有升级效果
export function applyUpgrades() {
    const levels = GameState.upgrades || {};
    UPGRADE_CONFIGS.forEach(config => {
        const level = levels[config.id] || 0;
        if (level > 0 && config.effect) {
            config.effect(level);
        }
    });
}

// 获取升级等级
export function getUpgradeLevel(id) {
    return (GameState.upgrades || {})[id] || 0;
}

// 计算升级成本
export function getUpgradeCost(config) {
    const level = getUpgradeLevel(config.id);
    if (level >= config.maxLevel) return null;
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, level));
}

// 购买升级
export function buyUpgrade(configId) {
    const config = UPGRADE_CONFIGS.find(c => c.id === configId);
    if (!config) return false;
    
    const level = getUpgradeLevel(configId);
    if (level >= config.maxLevel) return false;
    
    const cost = getUpgradeCost(config);
    if (GameState.coins < cost) return false;
    
    // 扣除金币
    GameState.coins -= cost;
    
    // 提升等级
    if (!GameState.upgrades) GameState.upgrades = {};
    GameState.upgrades[configId] = level + 1;
    
    // 应用效果
    if (config.effect) {
        config.effect(level + 1);
    }
    
    // 保存
    saveProgress();
    
    return true;
}

// 添加金币（游戏内调用）
export function addCoins(amount) {
    const bonus = getUpgradeLevel('coinBonus');
    const multiplier = 1 + bonus * 0.2;
    const finalAmount = Math.floor(amount * multiplier);
    
    GameState.coins = (GameState.coins || 0) + finalAmount;
    saveProgress();
    
    return finalAmount;
}

// 显示金币
export function updateCoinDisplays() {
    const menuDisplay = document.getElementById('menu-coin-display');
    const upgradeDisplay = document.getElementById('upgrade-coin-display');
    
    if (menuDisplay) menuDisplay.textContent = GameState.coins || 0;
    if (upgradeDisplay) upgradeDisplay.textContent = GameState.coins || 0;
}

// 渲染升级商店
export function renderUpgradeShop() {
    const grid = document.getElementById('upgrade-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    UPGRADE_CONFIGS.forEach(config => {
        const level = getUpgradeLevel(config.id);
        const cost = getUpgradeCost(config);
        const isMaxed = level >= config.maxLevel;
        
        const item = document.createElement('div');
        item.className = `upgrade-item ${isMaxed ? 'maxed' : ''}`;
        
        item.innerHTML = `
            <div class="upgrade-name">${config.name}</div>
            <div class="upgrade-desc">${config.desc}</div>
            <div class="upgrade-level">等级: ${level}/${config.maxLevel}</div>
            <button class="upgrade-btn ${isMaxed ? 'maxed' : ''}" ${isMaxed || (GameState.coins || 0) < cost ? 'disabled' : ''}>
                ${isMaxed ? '已满级' : `💰 ${cost}`}
            </button>
        `;
        
        const btn = item.querySelector('.upgrade-btn');
        btn.addEventListener('click', () => {
            if (buyUpgrade(config.id)) {
                renderUpgradeShop();
                updateCoinDisplays();
            }
        });
        
        grid.appendChild(item);
    });
}
