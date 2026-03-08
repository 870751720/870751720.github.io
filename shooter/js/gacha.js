/**
 * 抽卡系统 - 扭蛋机
 */

import { PlayerState, GameState } from './state.js';
import { saveShipData, SHIP_CONFIGS, addMaterial, getOwnedShips, getConstellationMaterialId } from './ships.js';

// 抽卡货币
export const GACHA_CONFIG = {
    singleCost: 100,      // 单抽金币
    tenCost: 900,         // 十连金币（9折）
    diamondSingle: 100,   // 单抽钻石
    diamondTen: 900       // 十连钻石
};

// 卡池配置
export const GACHA_POOLS = {
    standard: {
        name: '标准池',
        desc: '包含所有飞机和材料',
        // 飞机概率
        shipRates: {
            'C': 0.50,     // 50%
            'B': 0.35,     // 35%
            'A': 0.12,     // 12%
            'SSR': 0.03    // 3%
        },
        // 材料概率 (抽到材料时)
        materialRates: {
            'common': 0.60,
            'rare': 0.30,
            'epic': 0.08,
            'legendary': 0.02
        },
        // 飞机 vs 材料概率
        shipChance: 0.30,  // 30%概率抽到飞机
        materialChance: 0.70  // 70%概率抽到材料
    }
};

// 单抽
export function gachaSingle(poolId = 'standard') {
    const pool = GACHA_POOLS[poolId];
    if (!pool) return null;
    
    // 判断是否抽到飞机
    const isShip = Math.random() < pool.shipChance;
    
    if (isShip) {
        // 抽飞机
        const rank = rollRank(pool.shipRates);
        const shipsOfRank = SHIP_CONFIGS.filter(s => s.rank === rank && !s.isTest);
        const ship = shipsOfRank[Math.floor(Math.random() * shipsOfRank.length)];
        
        // 检查是否已拥有
        const owned = getOwnedShips().includes(ship.id);
        
        return {
            type: 'ship',
            item: ship,
            rank: rank,
            isNew: !owned,
            isDuplicate: owned
        };
    } else {
        // 抽材料
        const materialType = rollMaterial(pool.materialRates);
        const amount = rollMaterialAmount(materialType);
        
        return {
            type: 'material',
            materialType: materialType,
            amount: amount
        };
    }
}

// 十连抽
export function gachaTen(poolId = 'standard') {
    const results = [];
    for (let i = 0; i < 10; i++) {
        results.push(gachaSingle(poolId));
    }
    return results;
}

// 根据概率_roll稀有度
function rollRank(rates) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [rank, rate] of Object.entries(rates)) {
        cumulative += rate;
        if (rand <= cumulative) return rank;
    }
    return 'C';
}

// _roll材料类型
function rollMaterial(rates) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, rate] of Object.entries(rates)) {
        cumulative += rate;
        if (rand <= cumulative) return type;
    }
    return 'common';
}

// _roll材料数量
function rollMaterialAmount(type) {
    switch(type) {
        case 'common': return 3 + Math.floor(Math.random() * 3);  // 3-5
        case 'rare': return 1 + Math.floor(Math.random() * 2);    // 1-2
        case 'epic': return 1;
        case 'legendary': return 1;
        default: return 1;
    }
}

// 执行抽卡并应用结果
export function doGacha(isTen = false) {
    const cost = isTen ? GACHA_CONFIG.tenCost : GACHA_CONFIG.singleCost;
    
    if ((GameState.coins || 0) < cost) {
        return { success: false, message: '金币不足' };
    }
    
    // 扣除金币
    GameState.coins -= cost;
    
    // 执行抽卡
    const results = isTen ? gachaTen() : [gachaSingle()];
    
    // 应用结果
    const displayResults = [];
    
    for (const result of results) {
        if (result.type === 'ship') {
            // 如果未拥有，添加到拥有列表
            if (result.isNew) {
                if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
                GameState.ownedShips.push(result.item.id);
            } else if (result.isDuplicate) {
                // 重复飞机转化为专属命座材料
                const materialId = getConstellationMaterialId(result.item.id);
                if (!GameState.materials) GameState.materials = {};
                if (!GameState.materials[materialId]) GameState.materials[materialId] = 0;
                GameState.materials[materialId] += 1;
                result.constellationMaterial = {
                    shipId: result.item.id,
                    shipName: result.item.name,
                    amount: 1
                };
            }
            
            displayResults.push({
                type: 'ship',
                rank: result.rank,
                name: result.item.name,
                color: result.item.color,
                isNew: result.isNew,
                isDuplicate: result.isDuplicate,
                constellationMaterial: result.constellationMaterial
            });
        } else {
            // 添加材料
            addMaterial(result.materialType, result.amount);
            
            const matNames = {
                common: '普通零件',
                rare: '稀有合金',
                epic: '史诗核心',
                legendary: '传说碎片'
            };
            
            const matColors = {
                common: '#888888',
                rare: '#4ade80',
                epic: '#60a5fa',
                legendary: '#fbbf24'
            };
            
            displayResults.push({
                type: 'material',
                materialType: result.materialType,
                name: matNames[result.materialType],
                amount: result.amount,
                color: matColors[result.materialType]
            });
        }
    }
    
    saveShipData();
    
    return {
        success: true,
        results: displayResults,
        isTen: isTen
    };
}

// 渲染抽卡商店
export function renderGachaShop() {
    const screen = document.getElementById('gacha-screen');
    if (!screen) return;
    
    screen.innerHTML = `
        <button id="gacha-back-btn" class="back-btn-fixed">← 返回</button>
        
        <div class="gacha-container" id="gacha-container">
            <div class="gacha-header">
                <div class="gacha-coins">💰 <span id="gacha-coin-display">${GameState.coins || 0}</span></div>
                <div class="gacha-title">🎰 扭蛋机</div>
                <div class="gacha-desc">抽取飞机和强化材料</div>
            </div>
            
            <div class="gacha-machine">
                <div class="gacha-ball">🎱</div>
                <div class="gacha-light"></div>
            </div>
            
            <div class="gacha-rates">
                <div class="rate-title">卡池概率</div>
                <div class="rate-list">
                    <div class="rate-item ssr">SSR飞机: 3%</div>
                    <div class="rate-item a">A飞机: 12%</div>
                    <div class="rate-item b">B飞机: 35%</div>
                    <div class="rate-item c">C飞机: 50%</div>
                    <div class="rate-item material">材料: 70% (每次)</div>
                </div>
            </div>
            
            <div class="gacha-buttons">
                <button class="gacha-btn single" id="gacha-single">
                    <div class="btn-title">单抽</div>
                    <div class="btn-cost">💰 ${GACHA_CONFIG.singleCost}</div>
                </button>
                <button class="gacha-btn ten" id="gacha-ten">
                    <div class="btn-title">十连抽</div>
                    <div class="btn-cost">💰 ${GACHA_CONFIG.tenCost} <span class="discount">9折</span></div>
                </button>
            </div>
        </div>
    `;
    
    // 绑定返回按钮
    document.getElementById('gacha-back-btn')?.addEventListener('click', () => {
        document.getElementById('gacha-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    });
    
    // 绑定按钮
    document.getElementById('gacha-single').addEventListener('click', () => {
        const result = doGacha(false);
        if (result.success) {
            showGachaResult(result);
            updateGachaCoinDisplay();
        } else {
            showGachaMessage(result.message);
        }
    });
    
    document.getElementById('gacha-ten').addEventListener('click', () => {
        const result = doGacha(true);
        if (result.success) {
            showGachaResult(result);
            updateGachaCoinDisplay();
        } else {
            showGachaMessage(result.message);
        }
    });
}

// 显示抽卡结果
function showGachaResult(gachaResult) {
    const results = gachaResult.results;
    const isTen = gachaResult.isTen;
    
    // 创建结果弹窗
    const modal = document.createElement('div');
    modal.className = 'gacha-result-modal';
    
    if (isTen) {
        // 十连抽结果
        modal.innerHTML = `
            <div class="gacha-result-content ten">
                <h3>十连抽结果</h3>
                <div class="gacha-results-grid">
                    ${results.map((r, i) => createResultCard(r, i)).join('')}
                </div>
                <button class="gacha-confirm-btn">确定</button>
            </div>
        `;
    } else {
        // 单抽结果
        const r = results[0];
        modal.innerHTML = `
            <div class="gacha-result-content single">
                ${createSingleResult(r)}
                <button class="gacha-confirm-btn">确定</button>
            </div>
        `;
    }
    
    modal.querySelector('.gacha-confirm-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // 播放动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// 创建结果卡片
function createResultCard(result, index) {
    const delay = index * 100;

    if (result.type === 'ship') {
        const rankClass = result.rank.toLowerCase();
        let extraBadge = '';
        
        if (result.isNew) {
            extraBadge = '<div class="card-new">NEW!</div>';
        } else if (result.constellationMaterial) {
            extraBadge = `<div class="card-constellation-material">⭐ x1</div>`;
        }

        return `
            <div class="gacha-card ${rankClass}" style="animation-delay: ${delay}ms">
                <div class="card-rank">${result.rank}</div>
                <div class="card-icon" style="background: ${result.color}"></div>
                <div class="card-name">${result.name}</div>
                ${extraBadge}
            </div>
        `;
    } else {
        return `
            <div class="gacha-card material" style="animation-delay: ${delay}ms">
                <div class="card-icon" style="background: ${result.color}">⚙️</div>
                <div class="card-name">${result.name}</div>
                <div class="card-amount">x${result.amount}</div>
            </div>
        `;
    }
}

// 创建单抽结果（全屏展示）
function createSingleResult(result) {
    if (result.type === 'ship') {
        const rankClass = result.rank.toLowerCase();
        const isHighRank = result.rank === 'A' || result.rank === 'SSR';
        
        let extraBadge = '';
        if (result.isNew) {
            extraBadge = '<div class="result-new-badge">✨ 新飞机! ✨</div>';
        } else if (result.constellationMaterial) {
            extraBadge = `<div class="result-constellation-badge">⭐ ${result.constellationMaterial.shipName}·命星 x1</div>`;
        }
        
        return `
            <div class="single-ship-result ${rankClass} ${isHighRank ? 'special' : ''}">
                <div class="result-bg-effect"></div>
                <div class="result-rank">${result.rank}</div>
                <div class="result-ship-preview" style="background: ${result.color}"></div>
                <div class="result-ship-name">${result.name}</div>
                ${extraBadge}
            </div>
        `;
    } else {
        return `
            <div class="single-material-result">
                <div class="result-material-icon" style="color: ${result.color}">⚙️</div>
                <div class="result-material-name">${result.name}</div>
                <div class="result-material-amount">x${result.amount}</div>
            </div>
        `;
    }
}

// 显示消息
function showGachaMessage(message) {
    const msg = document.createElement('div');
    msg.className = 'gacha-message';
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

// 更新金币显示
function updateGachaCoinDisplay() {
    const el = document.getElementById('gacha-coin-display');
    if (el) el.textContent = GameState.coins || 0;
}
