/**
 * 背包系统 - 查看当前拥有的所有物品
 */

import { GameState } from './state.js';
import { MATERIAL_CONFIGS } from './ships.js';

// 全局 tooltip 元素
let globalTooltip = null;

// 创建全局 tooltip
function createGlobalTooltip() {
    if (globalTooltip) return;
    
    globalTooltip = document.createElement('div');
    globalTooltip.id = 'global-inventory-tooltip';
    globalTooltip.className = 'global-inventory-tooltip';
    globalTooltip.style.cssText = `
        position: fixed;
        background: linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(20, 20, 35, 0.98));
        color: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        white-space: nowrap;
        z-index: 99999;
        border: 1px solid rgba(157, 141, 247, 0.6);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s;
    `;
    document.body.appendChild(globalTooltip);
}

// 显示 tooltip
function showTooltip(e, text) {
    if (!globalTooltip) createGlobalTooltip();
    
    globalTooltip.textContent = text;
    globalTooltip.style.opacity = '1';
    globalTooltip.style.visibility = 'visible';
    
    updateTooltipPosition(e);
}

// 更新 tooltip 位置
function updateTooltipPosition(e) {
    if (!globalTooltip) return;
    
    const x = e.clientX;
    const y = e.clientY - 15;
    
    globalTooltip.style.left = x + 'px';
    globalTooltip.style.top = y + 'px';
    globalTooltip.style.transform = 'translate(-50%, -100%)';
}

// 隐藏 tooltip
function hideTooltip() {
    if (!globalTooltip) return;
    globalTooltip.style.opacity = '0';
    globalTooltip.style.visibility = 'hidden';
}

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
    
    // 绑定格子 tooltip 事件
    bindSlotEvents(container);
}

// 绑定格子事件
function bindSlotEvents(container) {
    const slots = container.querySelectorAll('.material-slot');
    
    slots.forEach(slot => {
        slot.addEventListener('mouseenter', (e) => {
            const tooltipText = slot.dataset.tooltip;
            if (tooltipText) showTooltip(e, tooltipText);
        });
        
        slot.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        slot.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e);
        });
    });
}

// 渲染材料格子
function renderMaterialsGrid(mats) {
    const materials = [
        { key: 'common', ...MATERIAL_CONFIGS.common },
        { key: 'rare', ...MATERIAL_CONFIGS.rare },
        { key: 'epic', ...MATERIAL_CONFIGS.epic },
        { key: 'legendary', ...MATERIAL_CONFIGS.legendary }
    ];

    return materials.map(mat => {
        const tooltipText = `${mat.name}: ${mat.desc}`;
        return `
            <div class="material-slot" data-tooltip="${tooltipText}">
                <div class="slot-icon" style="color: ${mat.color}">${mat.icon}</div>
                <div class="slot-count">${mats[mat.key] || 0}</div>
            </div>
        `;
    }).join('');
}