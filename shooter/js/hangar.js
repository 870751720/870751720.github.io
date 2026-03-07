/**
 * 机库升级系统 - 针对单个飞机的强化
 */

import { PlayerState, GameState } from './state.js';
import { getOwnedShips, getCurrentShip, SHIP_CONFIGS, RANK_CONFIGS, getShipEnhanceLevel, getEnhancedStats, getEnhanceCost, enhanceShip, MATERIAL_CONFIGS } from './ships.js';
import { drawStaticShip, drawDynamicShip } from './ship-renderer.js';

// 当前选中的飞机
let selectedUpgradeShip = null;

// 收藏的飞机列表
let favoriteShips = [];

// 品级权重
const RANK_WEIGHT = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 4 };

// 加载收藏数据
export function loadFavoriteShips() {
    try {
        const data = JSON.parse(localStorage.getItem('shooterProgress'));
        if (data && data.favoriteShips) {
            favoriteShips = data.favoriteShips;
        }
    } catch (e) {
        favoriteShips = [];
    }
}

// 保存收藏数据
export function saveFavoriteShips() {
    const data = JSON.parse(localStorage.getItem('shooterProgress') || '{}');
    data.favoriteShips = favoriteShips;
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 切换收藏状态
export function toggleFavoriteShip(shipId) {
    const index = favoriteShips.indexOf(shipId);
    if (index > -1) {
        favoriteShips.splice(index, 1);
    } else {
        favoriteShips.push(shipId);
    }
    saveFavoriteShips();
    return index === -1;
}

// 检查是否收藏
export function isFavoriteShip(shipId) {
    return favoriteShips.includes(shipId);
}

// 飞机专属强化项目配置
export const SHIP_UPGRADE_CONFIGS = [
    {
        id: 'hpBonus',
        name: '装甲增强',
        desc: '该飞机生命值 +5%',
        icon: '❤️',
        maxLevel: 10,
        baseCost: 80,
        costMultiplier: 1.4,
        getEffect: (level, baseStat) => baseStat * (1 + level * 0.05)
    },
    {
        id: 'damageBonus',
        name: '火力强化',
        desc: '该飞机伤害 +5%',
        icon: '⚔️',
        maxLevel: 10,
        baseCost: 80,
        costMultiplier: 1.4,
        getEffect: (level, baseStat) => baseStat * (1 + level * 0.05)
    },
    {
        id: 'speedBonus',
        name: '引擎 tuning',
        desc: '该飞机射速 +3%',
        icon: '⚡',
        maxLevel: 10,
        baseCost: 100,
        costMultiplier: 1.45,
        getEffect: (level, baseStat) => baseStat * (1 - level * 0.03)
    },
    {
        id: 'critBonus',
        name: '暴击系统',
        desc: '该飞机暴击率 +3%',
        icon: '💥',
        maxLevel: 15,
        baseCost: 150,
        costMultiplier: 1.5,
        getEffect: (level) => level * 0.03
    },
    {
    }
];

// 获取飞机的强化等级
export function getShipUpgradeLevel(shipId, upgradeId) {
    const upgrades = GameState.shipUpgrades || {};
    const shipUpgrades = upgrades[shipId] || {};
    return shipUpgrades[upgradeId] || 0;
}

// 计算升级成本
export function getShipUpgradeCost(config, currentLevel) {
    if (currentLevel >= config.maxLevel) return null;
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

// 购买升级
export function buyShipUpgrade(shipId, upgradeId) {
    const config = SHIP_UPGRADE_CONFIGS.find(c => c.id === upgradeId);
    if (!config) return { success: false, message: '升级项目不存在' };

    const level = getShipUpgradeLevel(shipId, upgradeId);
    if (level >= config.maxLevel) return { success: false, message: '已达最大等级' };

    const cost = getShipUpgradeCost(config, level);
    if ((GameState.coins || 0) < cost) return { success: false, message: '金币不足' };

    GameState.coins -= cost;

    if (!GameState.shipUpgrades) GameState.shipUpgrades = {};
    if (!GameState.shipUpgrades[shipId]) GameState.shipUpgrades[shipId] = {};
    GameState.shipUpgrades[shipId][upgradeId] = level + 1;

    saveShipUpgrades();

    return { success: true, newLevel: level + 1 };
}

// 保存数据
export function saveShipUpgrades() {
    const data = JSON.parse(localStorage.getItem('shooterProgress') || '{}');
    data.shipUpgrades = GameState.shipUpgrades || {};
    data.coins = GameState.coins || 0;
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 加载数据
export function loadShipUpgrades() {
    try {
        const data = JSON.parse(localStorage.getItem('shooterProgress'));
        if (data) {
            GameState.shipUpgrades = data.shipUpgrades || {};
        }
    } catch (e) {
        GameState.shipUpgrades = {};
    }
}

// 应用飞机强化效果
export function applyShipUpgradeEffects(shipId) {
    const shipConfig = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!shipConfig) return;

    const upgrades = GameState.shipUpgrades?.[shipId] || {};

    let hpMultiplier = 1;
    let damageMultiplier = 1;
    let fireRateMultiplier = 1;
    let critChance = 0;
