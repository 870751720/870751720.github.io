/**
 * 机库升级系统 - 针对单个飞机的强化
 */

import { PlayerState, GameState } from './state.js';
import { getOwnedShips, getCurrentShip, SHIP_CONFIGS, RANK_CONFIGS, getShipEnhanceLevel, getEnhancedStats, getEnhanceCost, enhanceShip, MATERIAL_CONFIGS } from './ships.js';

// 当前选中的飞机
let selectedUpgradeShip = null;

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
        getEffect: (level, baseStat) => baseStat * (1 - level * 0.03)  // 射速是越小越快
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
        id: 'shieldBonus',
        name: '护盾扩容',
        desc: '该飞机护盾上限 +1',
        icon: '🛡️',
        maxLevel: 5,
        baseCost: 300,
        costMultiplier: 2,
        getEffect: (level) => level
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

    // 扣除金币
    GameState.coins -= cost;

    // 提升等级
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

    // 基础属性
    let hpMultiplier = 1;
    let damageMultiplier = 1;
    let fireRateMultiplier = 1;
    let critChance = 0;
    let shieldBonus = 0;

    // 计算各项加成
    if (upgrades.hpBonus) {
        hpMultiplier = 1 + upgrades.hpBonus * 0.05;
    }
    if (upgrades.damageBonus) {
        damageMultiplier = 1 + upgrades.damageBonus * 0.05;
    }
    if (upgrades.speedBonus) {
        fireRateMultiplier = 1 - upgrades.speedBonus * 0.03;
    }
    if (upgrades.critBonus) {
        critChance = upgrades.critBonus * 0.03;
    }
    if (upgrades.shieldBonus) {
        shieldBonus = upgrades.shieldBonus;
    }

    // 应用到 PlayerState
    PlayerState.shipHpMultiplier = hpMultiplier;
    PlayerState.shipDamageMultiplier = damageMultiplier;
    PlayerState.shipFireRateMultiplier = fireRateMultiplier;
    PlayerState.shipCritChance = critChance;
    PlayerState.shipShieldBonus = shieldBonus;
}

// 渲染机库升级界面
export function renderHangarUpgrade() {
    const container = document.getElementById('upgrade-screen');
    if (!container) return;

    // 清空原有内容
    container.innerHTML = `
        <h2>机库升级</h2>
        <div class="hangar-coins">💰 <span id="hangar-coin-display">${GameState.coins || 0}</span></div>

        <div class="hangar-layout">
            <!-- 左侧飞机列表 -->
            <div class="hangar-ship-list" id="hangar-ship-list">
                <!-- 飞机列表由JS生成 -->
            </div>

            <!-- 右侧强化面板 -->
            <div class="hangar-upgrade-panel" id="hangar-upgrade-panel">
                <div class="no-ship-selected">请从左侧选择一架飞机</div>
            </div>
        </div>

        <div class="menu-buttons-row">
            <button id="back-btn" class="back-btn">返回主菜单</button>
        </div>
    `;

    // 绑定返回按钮事件
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('upgrade-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            // 更新金币显示
            const coinDisplay = document.getElementById('menu-coin-display');
            if (coinDisplay) coinDisplay.textContent = GameState.coins || 0;
        });
    }

    // 渲染飞机列表
    renderShipList();

    // 如果有默认选中，渲染强化面板
    if (selectedUpgradeShip) {
        renderUpgradePanel(selectedUpgradeShip);
    }
}

// 渲染飞机列表
function renderShipList() {
    const listEl = document.getElementById('hangar-ship-list');
    if (!listEl) return;

    const ownedShips = getOwnedShips();
    listEl.innerHTML = '';

    ownedShips.forEach(shipId => {
        const config = SHIP_CONFIGS.find(s => s.id === shipId);
        if (!config) return;

        const isSelected = selectedUpgradeShip === shipId;
        const isCurrent = getCurrentShip() === shipId;

        const item = document.createElement('div');
        item.className = `hangar-ship-item ${isSelected ? 'selected' : ''}`;
        item.dataset.shipId = shipId;

        item.innerHTML = `
            <div class="hangar-ship-preview rank-${config.rank.toLowerCase()}" style="--ship-color: ${config.color}"></div>
            <div class="hangar-ship-info">
                <div class="hangar-ship-name">${config.name}</div>
                <div class="hangar-ship-rank rank-${config.rank.toLowerCase()}">${config.rank}</div>
                ${isCurrent ? '<div class="hangar-ship-current">当前使用</div>' : ''}
            </div>
        `;

        item.addEventListener('click', () => {
            selectedUpgradeShip = shipId;
            // 更新选中状态
            listEl.querySelectorAll('.hangar-ship-item').forEach(el => {
                el.classList.toggle('selected', el.dataset.shipId === shipId);
            });
            // 渲染强化面板
            renderUpgradePanel(shipId);
        });

        listEl.appendChild(item);
    });

    // 默认选中第一个
    if (!selectedUpgradeShip && ownedShips.length > 0) {
        selectedUpgradeShip = ownedShips[0];
        const firstItem = listEl.querySelector('.hangar-ship-item');
        if (firstItem) firstItem.classList.add('selected');
        renderUpgradePanel(selectedUpgradeShip);
    }
}

// 渲染强化面板
function renderUpgradePanel(shipId) {
    const panelEl = document.getElementById('hangar-upgrade-panel');
    if (!panelEl) return;

    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;

    // 获取等级强化信息
    const enhanceLevel = getShipEnhanceLevel(shipId);
    const maxEnhanceLevel = RANK_CONFIGS[config.rank].maxEnhance;
    const enhanceCost = getEnhanceCost(config, enhanceLevel);

    // 计算总强化点数
    const totalPoints = SHIP_UPGRADE_CONFIGS.reduce((sum, upgrade) => {
        return sum + getShipUpgradeLevel(shipId, upgrade.id);
    }, 0);

    panelEl.innerHTML = `
        <div class="upgrade-panel-header">
            <div class="panel-ship-preview rank-${config.rank.toLowerCase()}" style="--ship-color: ${config.color}"></div>
            <div class="panel-ship-info">
                <div class="panel-ship-name">${config.name}</div>
                <div class="panel-ship-rank rank-${config.rank.toLowerCase()}">${config.rank}级</div>
                <div class="panel-total-points">专项强化: ${totalPoints} | 等级: ${enhanceLevel}/${maxEnhanceLevel}</div>
            </div>
        </div>

        <div class="upgrade-panel-stats">
            <h4>当前属性</h4>
            <div class="panel-stats-grid">
                <div class="panel-stat">
                    <span class="stat-label">❤️ 生命值</span>
                    <span class="stat-value">${config.stats.maxHp}</span>
                </div>
                <div class="panel-stat">
                    <span class="stat-label">⚔️ 伤害</span>
                    <span class="stat-value">${config.stats.damage}</span>
                </div>
                <div class="panel-stat">
                    <span class="stat-label">⚡ 射速</span>
                    <span class="stat-value">${(1000/config.stats.fireRate).toFixed(1)}/s</span>
                </div>
            </div>
        </div>

        <!-- 飞机等级强化区域 -->
        <div class="upgrade-panel-level">
            <h4>飞机等级强化</h4>
            <div class="level-enhance-card ${enhanceLevel >= maxEnhanceLevel ? 'maxed' : ''}">
                <div class="level-enhance-info">
                    <div class="level-enhance-title">✨ 进阶强化</div>
                    <div class="level-enhance-desc">全面提升飞机所有属性 (+5%)</div>
                    <div class="level-enhance-current">当前: +${enhanceLevel} / ${maxEnhanceLevel}</div>
                </div>
                <div class="level-enhance-materials" id="level-enhance-materials">
                    <!-- 材料需求显示 -->
                </div>
                <button class="level-enhance-btn ${enhanceLevel >= maxEnhanceLevel ? 'maxed' : ''}" id="level-enhance-btn">
                    ${enhanceLevel >= maxEnhanceLevel ? '已满级' : '进阶'}
                </button>
            </div>
        </div>

        <div class="upgrade-panel-list">
            <h4>专项强化</h4>
            <div class="upgrade-items-grid" id="upgrade-items-grid">
                <!-- 强化项目由JS生成 -->
            </div>
        </div>
    `;

    // 渲染等级强化材料
    renderLevelEnhanceMaterials(shipId, enhanceCost, enhanceLevel >= maxEnhanceLevel);

    // 绑定等级强化按钮
    const levelBtn = document.getElementById('level-enhance-btn');
    if (levelBtn && enhanceLevel < maxEnhanceLevel) {
        levelBtn.addEventListener('click', () => {
            const result = enhanceShip(shipId);
            if (result.success) {
                renderUpgradePanel(shipId);
                updateHangarCoinDisplay();
            } else {
                levelBtn.textContent = result.message;
                setTimeout(() => {
                    levelBtn.textContent = '进阶';
                }, 1500);
            }
        });
    }

    // 渲染专项强化项目
    renderUpgradeItems(shipId);
}

// 渲染等级强化材料
function renderLevelEnhanceMaterials(shipId, cost, isMaxed) {
    const container = document.getElementById('level-enhance-materials');
    if (!container || isMaxed) return;

    const mats = GameState.materials || {};

    let html = '<div class="materials-row">';

    // 金币
    const hasEnoughCoins = (GameState.coins || 0) >= cost.coins;
    html += `
        <div class="material-need ${hasEnoughCoins ? 'enough' : 'not-enough'}">
            <span class="mat-icon">💰</span>
            <span class="mat-count">${GameState.coins || 0}/${cost.coins}</span>
        </div>
    `;

    // 材料
    for (const [type, need] of Object.entries(cost.materials)) {
        const cfg = MATERIAL_CONFIGS[type];
        const have = mats[type] || 0;
        const enough = have >= need;
        html += `
            <div class="material-need ${enough ? 'enough' : 'not-enough'}">
                <span class="mat-icon" style="color: ${cfg.color}">${cfg.icon}</span>
                <span class="mat-count">${have}/${need}</span>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// 渲染强化项目
function renderUpgradeItems(shipId) {
    const gridEl = document.getElementById('upgrade-items-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    SHIP_UPGRADE_CONFIGS.forEach(upgrade => {
        const level = getShipUpgradeLevel(shipId, upgrade.id);
        const cost = getShipUpgradeCost(upgrade, level);
        const isMaxed = level >= upgrade.maxLevel;

        const item = document.createElement('div');
        item.className = `hangar-upgrade-item ${isMaxed ? 'maxed' : ''}`;

        item.innerHTML = `
            <div class="upgrade-item-icon">${upgrade.icon}</div>
            <div class="upgrade-item-info">
                <div class="upgrade-item-name">${upgrade.name}</div>
                <div class="upgrade-item-desc">${upgrade.desc}</div>
                <div class="upgrade-item-level">Lv.${level}/${upgrade.maxLevel}</div>
            </div>
            <button class="upgrade-item-btn ${isMaxed ? 'maxed' : ''}"
                    ${isMaxed || (GameState.coins || 0) < cost ? 'disabled' : ''}
                    data-upgrade-id="${upgrade.id}">
                ${isMaxed ? 'MAX' : `💰 ${cost}`}
            </button>
        `;

        const btn = item.querySelector('.upgrade-item-btn');
        if (!isMaxed) {
            btn.addEventListener('click', () => {
                const result = buyShipUpgrade(shipId, upgrade.id);
                if (result.success) {
                    renderUpgradeItems(shipId);
                    renderUpgradePanel(shipId); // 刷新总点数
                    updateHangarCoinDisplay();
                }
            });
        }

        gridEl.appendChild(item);
    });
}

// 更新金币显示
export function updateHangarCoinDisplay() {
    const el = document.getElementById('hangar-coin-display');
    if (el) el.textContent = GameState.coins || 0;
}
