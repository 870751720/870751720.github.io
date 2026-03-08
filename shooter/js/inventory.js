/**
 * 背包系统 - 查看当前拥有的所有物品
 */

import { GameState } from './state.js';
import { MATERIAL_CONFIGS, getConstellationMaterialConfig, SHIP_CONFIGS } from './ships.js';

// 品质颜色配置
const TIER_COLORS = {
    common: '#888888',
    rare: '#4ade80',
    epic: '#60a5fa',
    legendary: '#fbbf24',
    constellation: '#ffd700'
};

// 全局 tooltip 元素
let globalTooltip = null;

// 创建全局 tooltip
function createGlobalTooltip() {
    if (globalTooltip) return;

    globalTooltip = document.createElement('div');
    globalTooltip.id = 'global-inventory-tooltip';
    globalTooltip.className = 'global-inventory-tooltip';
    document.body.appendChild(globalTooltip);
}

// 显示 tooltip
function showTooltip(e, mat, count) {
    if (!globalTooltip) createGlobalTooltip();

    const tierColor = TIER_COLORS[mat.tier] || '#fff';

    globalTooltip.innerHTML = `
        <div class="tooltip-name" style="color: ${tierColor}">${mat.name}</div>
        <div class="tooltip-count">${mat.icon} ${count} 个</div>
        <div class="tooltip-desc">${mat.desc}</div>
    `;

    globalTooltip.classList.add('show');
    updateTooltipPosition(e);
}

// 更新 tooltip 位置
function updateTooltipPosition(e) {
    if (!globalTooltip) return;

    const x = e.clientX;
    const y = e.clientY - 15;

    globalTooltip.style.left = x + 'px';
    globalTooltip.style.top = y + 'px';
}

// 隐藏 tooltip
function hideTooltip() {
    if (!globalTooltip) return;
    globalTooltip.classList.remove('show');
}

// 渲染背包界面
export function renderInventory() {
    const container = document.getElementById('inventory-screen');
    if (!container) return;

    const mats = GameState.materials || {};

    container.innerHTML = `
        <h2>🎒 我的背包</h2>

        <div class="inventory-content">
            <!-- 材料格子 -->
            <div class="inventory-section">
                <div class="inventory-header">
                    <div class="inventory-coins-inline">💰 ${(GameState.coins || 0).toLocaleString()}</div>
                </div>
                <div class="inventory-materials-container">
                    <div class="inventory-materials-grid">
                        ${renderMaterialsGrid(mats)}
                    </div>
                </div>
            </div>
        </div>

        <div class="menu-buttons-row">
            <button id="inventory-back-btn" class="back-btn">返回主菜单</button>
        </div>
    `;

    // 绑定返回按钮
    const backBtn = document.getElementById('inventory-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            container.classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        });
    }

    // 绑定格子 tooltip 事件
    bindSlotEvents(container);
}

// 绑定格子事件
function bindSlotEvents(container) {
    const slots = container.querySelectorAll('.material-slot');

    slots.forEach(slot => {
        const matKey = slot.dataset.mat;
        const count = parseInt(slot.dataset.count) || 0;

        // 获取材料配置（支持动态命座材料）
        let matConfig = MATERIAL_CONFIGS[matKey];
        if (!matConfig && matKey.startsWith('constellation_')) {
            const shipId = matKey.replace('constellation_', '');
            const shipConfig = SHIP_CONFIGS.find(s => s.id === shipId);
            if (shipConfig) {
                matConfig = getConstellationMaterialConfig(shipId, shipConfig.name, shipConfig.color);
            }
        }

        slot.addEventListener('mouseenter', (e) => {
            if (matConfig && count > 0) showTooltip(e, matConfig, count);
        });

        slot.addEventListener('mouseleave', () => {
            hideTooltip();
        });

        slot.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e);
        });
    });
}

// 渲染材料格子 - 支持展开显示（无堆叠上限的材料每个占一个格子）
function renderMaterialsGrid(mats) {
    // 基础材料
    const baseMaterials = [
        { key: 'common', ...MATERIAL_CONFIGS.common },
        { key: 'rare', ...MATERIAL_CONFIGS.rare },
        { key: 'epic', ...MATERIAL_CONFIGS.epic },
        { key: 'legendary', ...MATERIAL_CONFIGS.legendary }
    ];

    // 命座材料（已拥有的）
    const constellationMaterials = [];
    Object.keys(mats).forEach(key => {
        if (key.startsWith('constellation_') && mats[key] > 0) {
            const shipId = key.replace('constellation_', '');
            const shipConfig = SHIP_CONFIGS.find(s => s.id === shipId);
            if (shipConfig) {
                const config = getConstellationMaterialConfig(shipId, shipConfig.name, shipConfig.color);
                if (config) {
                    constellationMaterials.push({ key, ...config });
                }
            }
        }
    });

    // 合并所有材料
    const allMaterials = [...baseMaterials, ...constellationMaterials];

    let html = '';

    allMaterials.forEach(mat => {
        const count = mats[mat.key] || 0;
        const stackLimit = mat.stack || 999;

        // 如果数量为0，跳过
        if (count === 0) return;

        // 如果堆叠上限为1，且数量大于0，展开显示每个物品
        if (stackLimit === 1 && count > 0) {
            // 生成 count 个单独的格子
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="material-slot tier-${mat.tier}" data-mat="${mat.key}" data-count="1">
                        <div class="slot-icon" style="color: ${mat.color}">${mat.icon}</div>
                    </div>
                `;
            }
        } else {
            // 普通堆叠显示（一个格子显示数量）
            html += `
                <div class="material-slot tier-${mat.tier}" data-mat="${mat.key}" data-count="${count}">
                    <div class="slot-icon" style="color: ${mat.color}">${mat.icon}</div>
                    <div class="slot-count">${count}</div>
                </div>
            `;
        }
    });

    return html;
}