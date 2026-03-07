/**
 * 背包系统 - 查看当前拥有的所有物品
 */

import { GameState } from './state.js';
import { MATERIAL_CONFIGS } from './ships.js';

// 渲染背包界面
export function renderInventory() {
    const container = document.getElementById('inventory-screen');
    if (!container) return;

    const mats = GameState.materials || {};

    container.innerHTML = `
        <h2>🎒 我的背包</h2>

        <div class="inventory-content">
            <!-- 金币 -->
            <div class="inventory-section">
                <h3>💰 金币</h3>
                <div class="inventory-coins">
                    <span class="coin-icon">💰</span>
                    <span class="coin-amount">${(GameState.coins || 0).toLocaleString()}</span>
                </div>
            </div>

            <!-- 材料格子 -->
            <div class="inventory-section">
                <h3>📦 材料</h3>
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
}

// 渲染材料格子
function renderMaterialsGrid(mats) {
    const materials = [
        { key: 'common', ...MATERIAL_CONFIGS.common },
        { key: 'rare', ...MATERIAL_CONFIGS.rare },
        { key: 'epic', ...MATERIAL_CONFIGS.epic },
        { key: 'legendary', ...MATERIAL_CONFIGS.legendary }
    ];

    return materials.map(mat => `
        <div class="material-slot" data-tooltip="${mat.name}: ${mat.desc}">
            <div class="slot-icon" style="color: ${mat.color}">${mat.icon}</div>
            <div class="slot-count">${mats[mat.key] || 0}</div>
        </div>
    `).join('');
}