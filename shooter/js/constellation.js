/**
 * 命座系统 - 重复飞机转化为命座
 */

import { GameState } from './state.js';
import { SHIP_CONFIGS, CONSTELLATION_CONFIGS, hasShip, saveShipData } from './ships.js';

// 获取命座等级
export function getConstellationLevel(shipId) {
    return (GameState.constellations || {})[shipId] || 0;
}

// 设置命座等级
export function setConstellationLevel(shipId, level) {
    if (!GameState.constellations) GameState.constellations = {};
    GameState.constellations[shipId] = Math.min(6, Math.max(0, level));
    saveShipData();
}

// 增加命座（抽卡抽到重复飞机时调用）
export function addConstellation(shipId) {
    const currentLevel = getConstellationLevel(shipId);
    if (currentLevel >= 6) {
        return { success: false, message: '命座已满', converted: true };
    }
    
    setConstellationLevel(shipId, currentLevel + 1);
    return { 
        success: true, 
        message: `${SHIP_CONFIGS.find(s => s.id === shipId)?.name || shipId} 命座 +1`,
        newLevel: currentLevel + 1
    };
}

// 应用命座效果
export function applyConstellationEffects(shipId) {
    const level = getConstellationLevel(shipId);
    const effects = [];
    
    const config = CONSTELLATION_CONFIGS[shipId];
    if (!config) return effects;
    
    for (let i = 0; i < level && i < config.constellations.length; i++) {
        effects.push(config.constellations[i]);
    }
    
    return effects;
}

// 渲染命座界面
export function renderConstellationScreen() {
    const container = document.getElementById('constellation-container');
    if (!container) return;
    
    const ownedShips = SHIP_CONFIGS.filter(ship => hasShip(ship.id));
    
    if (ownedShips.length === 0) {
        container.innerHTML = '<div class="empty-state">还没有拥有的飞机</div>';
        return;
    }
    
    let html = '<div class="constellation-grid">';
    
    ownedShips.forEach(ship => {
        const level = getConstellationLevel(ship.id);
        
        html += `
            <div class="constellation-card" data-ship="${ship.id}">
                <div class="constellation-nodes">
                    ${renderConstellationNodes(ship.id, level)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // 绑定点击事件
    container.querySelectorAll('.constellation-card').forEach(card => {
        card.addEventListener('click', () => {
            const shipId = card.dataset.ship;
            showConstellationDetail(shipId);
        });
    });
    
    // 更新金币显示
    updateConstellationCoinDisplay();
}

// 渲染命座节点
function renderConstellationNodes(shipId, currentLevel) {
    const config = CONSTELLATION_CONFIGS[shipId];
    if (!config) return '';
    
    return config.constellations.map((c, i) => {
        const unlocked = i < currentLevel;
        return `
            <div class="constellation-node ${unlocked ? 'unlocked' : 'locked'}" title="${c.name}: ${c.desc}">
                <div class="node-icon">${unlocked ? '★' : '☆'}</div>
                <div class="node-level">${c.level}</div>
            </div>
        `;
    }).join('');
}

// 显示命座详情
function showConstellationDetail(shipId) {
    const ship = SHIP_CONFIGS.find(s => s.id === shipId);
    const config = CONSTELLATION_CONFIGS[shipId];
    const level = getConstellationLevel(shipId);
    
    if (!ship || !config) return;
    
    const modal = document.createElement('div');
    modal.className = 'constellation-modal';
    
    let nodesHtml = '';
    config.constellations.forEach((c, i) => {
        const unlocked = i < level;
        nodesHtml += `
            <div class="constellation-detail-node ${unlocked ? 'unlocked' : 'locked'}">
                <div class="detail-node-icon">${unlocked ? '★' : '☆'}</div>
                <div class="detail-node-info">
                    <div class="detail-node-name">${c.level}命 · ${c.name}</div>
                    <div class="detail-node-desc">${c.desc}</div>
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="constellation-modal-content">
            <div class="constellation-modal-header">
                <div class="modal-ship-icon" style="background: ${ship.color}"></div>
                <div class="modal-ship-info">
                    <h3>${ship.name}</h3>
                    <div class="modal-constellation-progress">命座 ${level}/6</div>
                </div>
            </div>
            <div class="constellation-detail-nodes">
                ${nodesHtml}
            </div>
            <div class="constellation-modal-footer">
                <button class="close-modal-btn">关闭</button>
            </div>
        </div>
    `;
    
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// 更新金币显示
export function updateConstellationCoinDisplay() {
    const el = document.getElementById('constellation-coin-display');
    if (el) el.textContent = GameState.coins || 0;
}