/**
 * 机库升级系统 - 针对单个飞机的强化
 */

import { PlayerState, GameState } from './state.js';
import { getOwnedShips, getCurrentShip, SHIP_CONFIGS, RANK_CONFIGS, getShipEnhanceLevel, getEnhanceCost, enhanceShip, MATERIAL_CONFIGS } from './ships.js';
import { drawStaticShip, drawDynamicShip } from './ship-renderer.js';

// 当前选中的飞机
let selectedUpgradeShip = null;

// 当前选中的标签页 (enhance/constellation/story)
let currentHangarTab = 'enhance';

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

    PlayerState.shipHpMultiplier = hpMultiplier;
    PlayerState.shipDamageMultiplier = damageMultiplier;
    PlayerState.shipFireRateMultiplier = fireRateMultiplier;
    PlayerState.shipCritChance = critChance;
}

// 渲染机库升级界面
export function renderHangarUpgrade() {
    const container = document.getElementById('upgrade-screen');
    if (!container) return;

    container.innerHTML = `
        <h2>机库升级</h2>
        <div class="hangar-layout">
            <div class="hangar-ship-list" id="hangar-ship-list"></div>
            <div class="hangar-upgrade-panel" id="hangar-upgrade-panel">
                <div class="no-ship-selected">请从左侧选择一架飞机</div>
            </div>
        </div>

        <div class="menu-buttons-row">
            <button id="back-btn" class="back-btn">返回主菜单</button>
        </div>
    `;

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('upgrade-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            const coinDisplay = document.getElementById('menu-coin-display');
            if (coinDisplay) coinDisplay.textContent = GameState.coins || 0;
        });
    }

    renderShipList();

    if (selectedUpgradeShip) {
        renderPanel(selectedUpgradeShip);
    }
}

// 渲染飞机列表
function renderShipList() {
    const listEl = document.getElementById('hangar-ship-list');
    if (!listEl) return;

    const ownedShips = getOwnedShips();
    const currentShip = getCurrentShip();
    listEl.innerHTML = '';

    const sortedShips = [...ownedShips].sort((a, b) => {
        const configA = SHIP_CONFIGS.find(s => s.id === a);
        const configB = SHIP_CONFIGS.find(s => s.id === b);
        if (!configA || !configB) return 0;

        if (a === currentShip) return -1;
        if (b === currentShip) return 1;

        const aFav = isFavoriteShip(a);
        const bFav = isFavoriteShip(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        const rankDiff = RANK_WEIGHT[configB.rank] - RANK_WEIGHT[configA.rank];
        if (rankDiff !== 0) return rankDiff;

        return configA.name.localeCompare(configB.name);
    });

    sortedShips.forEach(shipId => {
        const config = SHIP_CONFIGS.find(s => s.id === shipId);
        if (!config) return;

        const isSelected = selectedUpgradeShip === shipId;
        const isCurrent = currentShip === shipId;
        const isFav = isFavoriteShip(shipId);

        const item = document.createElement('div');
        item.className = `hangar-ship-item ${isSelected ? 'selected' : ''}`;
        item.dataset.shipId = shipId;

        const canvasId = `hangar-ship-preview-${shipId}`;

        item.innerHTML = `
            <canvas id="${canvasId}" class="hangar-ship-canvas" width="60" height="60"></canvas>
            <div class="hangar-ship-info">
                <div class="hangar-ship-name">
                    ${isFav ? '<span class="fav-icon">⭐</span>' : ''}
                    ${config.name}
                </div>
                <div class="hangar-ship-rank rank-${config.rank.toLowerCase()}">${config.rank}</div>
                ${isCurrent ? '<div class="hangar-ship-current">当前使用</div>' : ''}
            </div>
            <button class="fav-btn ${isFav ? 'favorited' : ''}" data-ship-id="${shipId}" title="${isFav ? '取消收藏' : '收藏'}">
                ${isFav ? '★' : '☆'}
            </button>
        `;

        requestAnimationFrame(() => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                drawStaticShip(ctx, 30, 30, 20, config);
            }
        });

        item.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return;

            selectedUpgradeShip = shipId;
            currentHangarTab = 'enhance'; // 重置为强化标签
            listEl.querySelectorAll('.hangar-ship-item').forEach(el => {
                el.classList.toggle('selected', el.dataset.shipId === shipId);
            });
            renderPanel(shipId);
        });

        const favBtn = item.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nowFav = toggleFavoriteShip(shipId);
                renderShipList();
                if (selectedUpgradeShip) {
                    const selectedEl = listEl.querySelector(`[data-ship-id="${selectedUpgradeShip}"]`);
                    if (selectedEl) selectedEl.classList.add('selected');
                }
            });
        }

        listEl.appendChild(item);
    });

    if (!selectedUpgradeShip && sortedShips.length > 0) {
        selectedUpgradeShip = sortedShips[0];
        const firstItem = listEl.querySelector('.hangar-ship-item');
        if (firstItem) firstItem.classList.add('selected');
        renderPanel(selectedUpgradeShip);
    }
}

// 渲染右侧面板 - 根据当前标签页
function renderPanel(shipId) {
    const panelEl = document.getElementById('hangar-upgrade-panel');
    if (!panelEl) return;

    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;

    const panelCanvasId = `panel-ship-preview-${shipId}-${Date.now()}`;

    // 渲染头部（通用）
    let html = `
        <div class="upgrade-panel-header">
            <canvas id="${panelCanvasId}" class="panel-ship-canvas" width="120" height="120"></canvas>
            <div class="panel-ship-info">
                <div class="panel-ship-name">${config.name} <span class="panel-ship-rank rank-${config.rank.toLowerCase()}">${config.rank}</span></div>
                <div class="panel-ship-stats">
                    <span class="stat-item"><span class="stat-icon">❤️</span>${config.stats.maxHp}</span>
                    <span class="stat-item"><span class="stat-icon">⚔️</span>${config.stats.damage}</span>
                    <span class="stat-item"><span class="stat-icon">⚡</span>${(1000 / config.stats.fireRate).toFixed(1)}/s</span>
                </div>
            </div>
        </div>

        <!-- 标签按钮 -->
        <div class="hangar-tabs">
            <button class="hangar-tab ${currentHangarTab === 'enhance' ? 'active' : ''}" data-tab="enhance">
                <span class="tab-icon">⚡</span>强化
            </button>
            <button class="hangar-tab ${currentHangarTab === 'constellation' ? 'active' : ''}" data-tab="constellation">
                <span class="tab-icon">⭐</span>命座
            </button>
            <button class="hangar-tab ${currentHangarTab === 'story' ? 'active' : ''}" data-tab="story">
                <span class="tab-icon">📖</span>故事
            </button>
        </div>

        <!-- 内容区域 -->
        <div class="hangar-panel-content" id="hangar-panel-content"></div>
    `;

    panelEl.innerHTML = html;

    // 绑定标签切换
    panelEl.querySelectorAll('.hangar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentHangarTab = tab.dataset.tab;
            renderPanel(shipId);
        });
    });

    // 根据当前标签渲染内容
    const contentEl = document.getElementById('hangar-panel-content');
    if (contentEl) {
        switch (currentHangarTab) {
            case 'enhance':
                renderEnhanceContent(shipId, config, contentEl);
                break;
            case 'constellation':
                renderConstellationContent(shipId, config, contentEl);
                break;
            case 'story':
                renderStoryContent(shipId, config, contentEl);
                break;
        }
    }

    // 绘制飞机预览
    requestAnimationFrame(() => {
        drawDynamicShip(panelCanvasId, config, { animateFloat: true, shootBullets: true });
    });
}

// 渲染强化内容
function renderEnhanceContent(shipId, config, container) {
    const enhanceLevel = getShipEnhanceLevel(shipId);
    const maxEnhanceLevel = RANK_CONFIGS[config.rank].maxEnhance;
    const enhanceCost = getEnhanceCost(config, enhanceLevel);

    container.innerHTML = `
        <div class="upgrade-panel-level">
            <div class="level-enhance-card ${enhanceLevel >= maxEnhanceLevel ? 'maxed' : ''}">
                <div class="level-enhance-info">
                    <div class="level-enhance-title">✨ 进阶强化 (+5%全属性)</div>
                    <div class="level-enhance-desc">当前等级: Lv.${enhanceLevel}/${maxEnhanceLevel}</div>
                </div>
                <div class="level-enhance-materials" id="level-enhance-materials"></div>
                <button class="level-enhance-btn ${enhanceLevel >= maxEnhanceLevel ? 'maxed' : ''}" id="level-enhance-btn">
                    ${enhanceLevel >= maxEnhanceLevel ? '已满级' : '进阶'}
                </button>
            </div>
        </div>

        <div class="upgrade-panel-list">
            <h4>专项强化</h4>
            <div class="upgrade-items-grid" id="upgrade-items-grid"></div>
        </div>
    `;

    renderLevelEnhanceMaterials(shipId, enhanceCost, enhanceLevel >= maxEnhanceLevel);

    const levelBtn = document.getElementById('level-enhance-btn');
    if (levelBtn && enhanceLevel < maxEnhanceLevel) {
        levelBtn.addEventListener('click', () => {
            const result = enhanceShip(shipId);
            if (result.success) {
                renderPanel(shipId);
                updateHangarCoinDisplay();
            } else {
                levelBtn.textContent = result.message;
                setTimeout(() => {
                    levelBtn.textContent = '进阶';
                }, 1500);
            }
        });
    }

    renderUpgradeItems(shipId);
}

// 渲染命座内容
function renderConstellationContent(shipId, config, container) {
    import('./ships.js').then(shipModule => {
        const constellations = shipModule.CONSTELLATION_CONFIGS?.[shipId];
        const materialId = `constellation_${shipId}`;
        const materialCount = GameState.materials?.[materialId] || 0;
        const level = GameState.constellations?.[shipId] || 0;

        if (!constellations) {
            container.innerHTML = '<div class="empty-content">该飞机暂无需座系统</div>';
            return;
        }

        // 构建命座节点HTML - 使用六边形布局
        let nodesHtml = '';
        const configs = constellations.constellations;
        
        configs.forEach((c, i) => {
            const unlocked = i < level;
            const isNext = i === level;
            const canUnlock = isNext && materialCount > 0;
            const locked = i > level;
            
            nodesHtml += `
                <div class="constellation-hex ${unlocked ? 'unlocked' : ''} ${canUnlock ? 'can-unlock' : ''} ${locked ? 'locked' : ''}">
                    <div class="hex-inner">
                        <div class="hex-icon">${unlocked ? '★' : (canUnlock ? '✦' : '☆')}</div>
                        <div class="hex-level">${c.level}命</div>
                    </div>
                    <div class="hex-info">
                        <div class="hex-name">${c.name}</div>
                        <div class="hex-desc">${c.desc}</div>
                        ${canUnlock ? `<button class="hex-unlock-btn" data-index="${i}">激活</button>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="constellation-container">
                <div class="constellation-header">
                    <div class="constellation-material">
                        <div class="material-icon-glow" style="background: ${config.color}"></div>
                        <div class="material-info">
                            <div class="material-label">命星材料</div>
                            <div class="material-name">${config.name}·命星</div>
                            <div class="material-count ${materialCount > 0 ? 'has' : ''}">× ${materialCount}</div>
                        </div>
                    </div>
                    <div class="constellation-progress-ring">
                        <div class="progress-text">
                            <span class="current">${level}</span>
                            <span class="total">/6</span>
                        </div>
                        <svg class="progress-svg" viewBox="0 0 100 100">
                            <circle class="progress-bg" cx="50" cy="50" r="45"/>
                            <circle class="progress-bar" cx="50" cy="50" r="45" 
                                style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (283 * level / 6)}"/>
                        </svg>
                    </div>
                </div>
                
                <div class="constellation-nodes">
                    ${nodesHtml}
                </div>
                
                ${level >= 6 ? `
                    <div class="constellation-complete">
                        <div class="complete-icon">👑</div>
                        <div class="complete-text">命座已满，觉醒达成</div>
                    </div>
                ` : ''}
            </div>
        `;

        // 绑定激活按钮
        container.querySelectorAll('.hex-unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (materialCount > 0 && GameState.materials[materialId] > 0) {
                    GameState.materials[materialId]--;
                    if (!GameState.constellations) GameState.constellations = {};
                    if (!GameState.constellations[shipId]) GameState.constellations[shipId] = 0;
                    GameState.constellations[shipId]++;
                    saveShipData();
                    renderPanel(shipId);
                }
            });
        });
    });
}

// 渲染故事内容
function renderStoryContent(shipId, config, container) {
    // SHIP_STORIES 在 ships.js 中，直接导入
    import('./ships.js').then(module => {
        const story = module.SHIP_STORIES?.[shipId];

        if (!story) {
            container.innerHTML = '<div class="empty-content">该飞机暂无背景故事</div>';
            return;
        }

        const formattedContent = story.content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => `<p>${line}</p>`)
            .join('');

        container.innerHTML = `
            <div class="story-panel">
                <div class="story-panel-subtitle">${story.subtitle}</div>
                <div class="story-panel-content">
                    ${formattedContent}
                </div>
                <div class="story-panel-quote">
                    <span class="quote-mark">"</span>${story.quote.replace(/"/g, '')}<span class="quote-mark">"</span>
                </div>
            </div>
        `;
    });
}

// 渲染强化面板（旧函数，保留兼容）
function renderUpgradePanel(shipId) {
    currentHangarTab = 'enhance';
    renderPanel(shipId);
}

// 渲染等级强化材料
function renderLevelEnhanceMaterials(shipId, cost, isMaxed) {
    const container = document.getElementById('level-enhance-materials');
    if (!container || isMaxed) return;

    const mats = GameState.materials || {};

    let html = '<div class="materials-row">';

    const hasEnoughCoins = (GameState.coins || 0) >= cost.coins;
    html += `
        <div class="material-need ${hasEnoughCoins ? 'enough' : 'not-enough'}">
            <span class="mat-icon">💰</span>
            <span class="mat-count">${GameState.coins || 0}/${cost.coins}</span>
        </div>
    `;

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
                    renderUpgradePanel(shipId);
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