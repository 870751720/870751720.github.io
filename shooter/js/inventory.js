/**
 * 背包系统 - 查看当前拥有的所有物品
 */

import { GameState } from './state.js';
import { MATERIAL_CONFIGS, getConstellationMaterialConfig, SHIP_CONFIGS } from './ships.js';
import { gotoUI } from './ui-manager.js';

// 品质颜色配置
const TIER_COLORS = {
    common: '#888888',
    rare: '#4ade80',
    epic: '#60a5fa',
    legendary: '#fbbf24',
    constellation: '#ffd700'
};

// 当前选中的材料
let selectedMaterial = null;

// 渲染背包界面
export function renderInventory() {
    const container = document.getElementById('inventory-screen');
    if (!container) return;

    const mats = GameState.materials || {};

    container.innerHTML = `
        <button id="inventory-back-btn" class="back-btn-fixed">← 返回</button>

        <div class="inventory-content">
            <!-- 左侧：材料格子 -->
            <div class="inventory-left">
                <div class="inventory-coins">💰 ${(GameState.coins || 0).toLocaleString()}</div>
                <div class="inventory-section">
                    <div class="inventory-materials-container">
                        <div class="inventory-materials-grid">
                            ${renderMaterialsGrid(mats)}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 右侧：详情面板 -->
            <div class="inventory-right">
                <div id="material-detail-panel" class="material-detail-panel">
                    <div class="detail-placeholder">点击材料查看详情</div>
                </div>
            </div>
        </div>
    `;

    // 绑定返回按钮
    const backBtn = document.getElementById('inventory-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            gotoUI('start-screen');
        });
    }

    // 绑定格子点击事件
    bindSlotEvents(container, mats);
}

// 绑定格子点击事件
function bindSlotEvents(container, mats) {
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

        slot.addEventListener('click', () => {
            if (matConfig && count > 0) {
                // 移除其他格子的选中状态
                slots.forEach(s => s.classList.remove('selected'));
                // 添加选中状态
                slot.classList.add('selected');
                // 显示详情
                showMaterialDetail(matConfig, count, matKey);
            }
        });
    });
}

// 显示材料详情面板
function showMaterialDetail(mat, count, matKey) {
    const panel = document.getElementById('material-detail-panel');
    if (!panel) return;

    const tierColor = TIER_COLORS[mat.tier] || '#fff';
    const isConstellation = mat.tier === 'constellation' || matKey?.startsWith('constellation_');

    panel.innerHTML = `
        <div class="detail-icon" style="color: ${mat.color}">${mat.icon}</div>
        <div class="detail-name" style="color: ${tierColor}">${mat.name}</div>
        <div class="detail-tier">${getTierName(mat.tier)}</div>
        <div class="detail-count">拥有数量：${count} 个</div>
        <div class="detail-desc">${mat.desc}</div>
        ${isConstellation ? `<button class="detail-use-btn" data-mat-key="${matKey}">使用</button>` : ''}
    `;

    // 绑定使用按钮
    if (isConstellation) {
        const useBtn = panel.querySelector('.detail-use-btn');
        if (useBtn) {
            useBtn.addEventListener('click', () => {
                const key = useBtn.dataset.matKey;
                if (key) {
                    useConstellationMaterial(key);
                }
            });
        }
    }
}

// 获取品质名称
function getTierName(tier) {
    const names = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传说',
        constellation: '命星'
    };
    return names[tier] || '未知';
}

// 使用命座材料 - 跳转到机库命座页面
function useConstellationMaterial(matKey) {
    const shipId = matKey.replace('constellation_', '');
    if (!shipId) return;

    // 使用 gotoUI 跳转到机库，并传递参数
    gotoUI('upgrade-screen', { shipId, tab: 'constellation' });
}

// 渲染材料格子
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

        // 如果数量为0，跳过
        if (count === 0) return;

        // 普通堆叠显示
        html += `
            <div class="material-slot tier-${mat.tier}" data-mat="${mat.key}" data-count="${count}">
                <div class="slot-icon" style="color: ${mat.color}">${mat.icon}</div>
                <div class="slot-count">${count}</div>
            </div>
        `;
    });

    return html;
}
