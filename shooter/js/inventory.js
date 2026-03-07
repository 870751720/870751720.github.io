/**
 * 背包系统 - 查看当前拥有的所有物品
 */

import { GameState } from './state.js';
import { SHIP_CONFIGS, getCurrentShip, MATERIAL_CONFIGS } from './ships.js';
import { drawStaticShip } from './ship-renderer.js';
import { SHIP_UPGRADE_CONFIGS, getShipUpgradeLevel } from './hangar.js';

// 渲染背包界面
export function renderInventory() {
    const container = document.getElementById('inventory-screen');
    if (!container) return;

    const ownedShips = GameState.ownedShips || ['basic'];
    const currentShip = getCurrentShip();
    const mats = GameState.materials || {};

    // 计算总资产价值
    const totalShips = ownedShips.length;
    const totalCoins = GameState.coins || 0;

    container.innerHTML = `
        <h2>我的背包</h2>

        <div class="inventory-layout">
            <!-- 左侧：资产概览 -->
            <div class="inventory-sidebar">
                <div class="inventory-section">
                    <h3>💰 财富</h3>
                    <div class="inventory-coins">
                        <span class="coin-amount">${totalCoins.toLocaleString()}</span>
                        <span class="coin-label">金币</span>
                    </div>
                </div>

                <div class="inventory-section">
                    <h3>📦 材料</h3>
                    <div class="inventory-materials">
                        ${renderMaterialsList(mats)}
                    </div>
                </div>

                <div class="inventory-section">
                    <h3>📊 统计</h3>
                    <div class="inventory-stats">
                        <div class="stat-row">
                            <span>拥有飞机</span>
                            <span>${totalShips}</span>
                        </div>
                        <div class="stat-row">
                            <span>当前使用</span>
                            <span>${getShipName(currentShip)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：飞机列表 -->
            <div class="inventory-main">
                <div class="inventory-section">
                    <h3>✈️ 我的机库 (${totalShips})</h3>
                    <div class="inventory-ships-grid" id="inventory-ships-grid">
                        <!-- 飞机会在这里渲染 -->
                    </div>
                </div>
            </div>
        </div>

        <div class="menu-buttons-row">
            <button id="inventory-back-btn" class="back-btn">返回主菜单</button>
        </div>
    `;

    // 渲染飞机列表
    renderInventoryShips(ownedShips, currentShip);

    // 绑定返回按钮
    const backBtn = document.getElementById('inventory-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            container.classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        });
    }
}

// 渲染材料列表
function renderMaterialsList(mats) {
    const materials = [
        { key: 'common', ...MATERIAL_CONFIGS.common },
        { key: 'rare', ...MATERIAL_CONFIGS.rare },
        { key: 'epic', ...MATERIAL_CONFIGS.epic },
        { key: 'legendary', ...MATERIAL_CONFIGS.legendary }
    ];

    return materials.map(mat => `
        <div class="inventory-material-item">
            <span class="material-icon" style="color: ${mat.color}">${mat.icon}</span>
            <div class="material-info">
                <div class="material-name">${mat.name}</div>
                <div class="material-count">${mats[mat.key] || 0}</div>
            </div>
        </div>
    `).join('');
}

// 渲染背包中的飞机
function renderInventoryShips(ownedShips, currentShip) {
    const gridEl = document.getElementById('inventory-ships-grid');
    if (!gridEl) return;

    // 按品级排序
    const rankWeight = { 'SSR': 4, 'A': 3, 'B': 2, 'C': 1 };
    const sortedShips = [...ownedShips].sort((a, b) => {
        const configA = SHIP_CONFIGS.find(s => s.id === a);
        const configB = SHIP_CONFIGS.find(s => s.id === b);
        if (!configA || !configB) return 0;
        return rankWeight[configB.rank] - rankWeight[configA.rank];
    });

    gridEl.innerHTML = sortedShips.map(shipId => {
        const config = SHIP_CONFIGS.find(s => s.id === shipId);
        if (!config) return '';

        const isCurrent = shipId === currentShip;
        const enhanceLevel = GameState.shipEnhancements?.[shipId] || 0;

        // 计算专项强化等级
        const upgradeLevels = SHIP_UPGRADE_CONFIGS.map(u => getShipUpgradeLevel(shipId, u.id));
        const totalUpgradeLevel = upgradeLevels.reduce((a, b) => a + b, 0);

        const canvasId = `inventory-ship-${shipId}`;

        return `
            <div class="inventory-ship-card ${isCurrent ? 'current' : ''} rank-${config.rank.toLowerCase()}">
                <div class="ship-card-header">
                    <span class="ship-rank-badge rank-${config.rank.toLowerCase()}">${config.rank}</span>
                    ${isCurrent ? '<span class="ship-current-badge">当前使用</span>' : ''}
                </div>
                <canvas id="${canvasId}" class="ship-card-canvas" width="80" height="80"></canvas>
                <div class="ship-card-info">
                    <div class="ship-card-name">${config.name}</div>
                    <div class="ship-card-levels">
                        <span>等级 ${enhanceLevel}</span>
                        ${totalUpgradeLevel > 0 ? `<span>强化 ${totalUpgradeLevel}</span>` : ''}
                    </div>
                </div>
                <div class="ship-card-stats">
                    <span>❤️ ${config.stats.maxHp}</span>
                    <span>⚔️ ${config.stats.damage}</span>
                    <span>⚡ ${(1000/config.stats.fireRate).toFixed(1)}/s</span>
                </div>
            </div>
        `;
    }).join('');

    // 绘制飞机预览
    requestAnimationFrame(() => {
        sortedShips.forEach(shipId => {
            const config = SHIP_CONFIGS.find(s => s.id === shipId);
            if (!config) return;

            const canvas = document.getElementById(`inventory-ship-${shipId}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                drawStaticShip(ctx, 40, 40, 25, config);
            }
        });
    });
}

// 获取飞机名称
function getShipName(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    return config ? config.name : shipId;
}