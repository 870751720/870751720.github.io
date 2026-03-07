/**
 * 飞机系统 - 不同等级有不同美术表现 + 强化系统
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress } from './upgrades.js';

// 等级配置
export const RANK_CONFIGS = {
    'C': { name: 'C', color: '#888888', glow: 0, priceMultiplier: 1, maxEnhance: 5 },
    'B': { name: 'B', color: '#4ade80', glow: 10, priceMultiplier: 1.5, maxEnhance: 7 },
    'A': { name: 'A', color: '#60a5fa', glow: 20, priceMultiplier: 2.5, maxEnhance: 10 },
    'SSR': { name: 'SSR', color: '#fbbf24', glow: 30, priceMultiplier: 5, maxEnhance: 15 }
};

// 材料配置
export const MATERIAL_CONFIGS = {
    common: { name: '普通零件', icon: '⚙️', color: '#888888', desc: '普通敌机掉落的零件' },
    rare: { name: '稀有合金', icon: '🔩', color: '#4ade80', desc: '精英敌机掉落的合金' },
    epic: { name: '史诗核心', icon: '⚡', color: '#60a5fa', desc: 'Boss掉落的能量核心' },
    legendary: { name: '传说碎片', icon: '💎', color: '#fbbf24', desc: '传说中的神秘碎片' }
};

// 飞机配置
export const SHIP_CONFIGS = [
    // C级 - 量产型
    {
        id: 'basic',
        name: '标准战机',
        rank: 'C',
        desc: '均衡的入门级战机',
        price: 0,
        color: '#9d8df7',
        stats: { maxHp: 3, damage: 1, fireRate: 150, multiShot: 1, bulletSize: 1 }
    },
    {
        id: 'training',
        name: '训练机',
        rank: 'C',
        desc: '新手练习用机，血量略高',
        price: 100,
        color: '#a8a8a8',
        stats: { maxHp: 4, damage: 0.8, fireRate: 160, multiShot: 1, bulletSize: 1 }
    },
    // B级 - 改装型
    {
        id: 'speed',
        name: '闪电号',
        rank: 'B',
        desc: '改装引擎，射速极快',
        price: 600,
        color: '#00ffff',
        stats: { maxHp: 2, damage: 0.9, fireRate: 75, multiShot: 1, bulletSize: 0.9 }
    },
    {
        id: 'guardian',
        name: '守卫者',
        rank: 'B',
        desc: '强化装甲，初始带护盾',
        price: 750,
        color: '#4ade80',
        stats: { maxHp: 4, damage: 1, fireRate: 160, multiShot: 1, bulletSize: 1, startShield: 1 }
    },
    // A级 - 特装型
    {
        id: 'tank',
        name: '重装堡垒',
        rank: 'A',
        desc: '重装机体，高血高伤',
        price: 1500,
        color: '#ff6b6b',
        stats: { maxHp: 6, damage: 1.5, fireRate: 200, multiShot: 1, bulletSize: 1.5 }
    },
    {
        id: 'spread',
        name: '散弹王',
        rank: 'A',
        desc: '火力覆盖型，3发散弹',
        price: 1800,
        color: '#ffd93d',
        stats: { maxHp: 4, damage: 0.8, fireRate: 170, multiShot: 3, bulletSize: 0.9 }
    },
    {
        id: 'sniper',
        name: '狙击者',
        rank: 'A',
        desc: '远距离精准打击，穿透敌人',
        price: 2000,
        color: '#a855f7',
        stats: { maxHp: 3, damage: 2.5, fireRate: 280, multiShot: 1, bulletSize: 1.8, piercing: true }
    },
    // SSR级 - 传说
    {
        id: 'ghost',
        name: '幽灵战机',
        rank: 'SSR',
        desc: '传说级隐身战机，30%闪避',
        price: 5000,
        color: '#00ff88',
        stats: { maxHp: 4, damage: 1.5, fireRate: 130, multiShot: 1, bulletSize: 1.1, dodgeChance: 0.3, startShield: 2 }
    },
    {
        id: 'phoenix',
        name: '凤凰号',
        rank: 'SSR',
        desc: '不死传说，死亡时复活一次',
        price: 6000,
        color: '#ff4500',
        stats: { maxHp: 5, damage: 1.8, fireRate: 150, multiShot: 2, bulletSize: 1.3, revive: true }
    },
    {
        id: 'divine',
        name: '神谕',
        rank: 'SSR',
        desc: '终极机体，全方位强化',
        price: 8000,
        color: '#ffd700',
        stats: { maxHp: 8, damage: 2, fireRate: 120, multiShot: 3, bulletSize: 1.5, startShield: 2, piercing: true }
    }
];

// 获取飞机强化等级
export function getShipEnhanceLevel(shipId) {
    return (GameState.shipEnhancements || {})[shipId] || 0;
}

// 计算强化属性加成
export function getEnhancedStats(config) {
    const level = getShipEnhanceLevel(config.id);
    const multiplier = 1 + (level * 0.05); // 每级+5%
    
    return {
        maxHp: Math.floor(config.stats.maxHp * multiplier),
        damage: config.stats.damage * multiplier,
        fireRate: Math.max(30, config.stats.fireRate - (level * 3)),
        multiShot: config.stats.multiShot,
        bulletSize: config.stats.bulletSize * (1 + level * 0.02),
        piercing: config.stats.piercing || false,
        dodgeChance: (config.stats.dodgeChance || 0) + (level * 0.01),
        startShield: (config.stats.startShield || 0) + Math.floor(level / 3),
        revive: config.stats.revive || false
    };
}

// 计算强化消耗
export function getEnhanceCost(config, currentLevel) {
    const rankCfg = RANK_CONFIGS[config.rank];
    const baseMultiplier = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 5 }[config.rank];
    
    // 材料需求
    const materials = {};
    const nextLevel = currentLevel + 1;
    
    // 每级都需要普通材料
    materials.common = 5 * baseMultiplier * nextLevel;
    
    // 3级以上需要稀有材料
    if (nextLevel >= 3) {
        materials.rare = 2 * baseMultiplier * (nextLevel - 2);
    }
    
    // 5级以上需要史诗材料
    if (nextLevel >= 5) {
        materials.epic = 1 * baseMultiplier * (nextLevel - 4);
    }
    
    // 10级以上需要传说材料
    if (nextLevel >= 10) {
        materials.legendary = 1 * (nextLevel - 9);
    }
    
    // 金币需求
    const coins = 50 * baseMultiplier * Math.pow(1.5, currentLevel);
    
    return { materials, coins: Math.floor(coins) };
}

// 强化飞机
export function enhanceShip(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return { success: false, message: '飞机不存在' };
    if (!hasShip(shipId)) return { success: false, message: '未拥有该飞机' };
    
    const currentLevel = getShipEnhanceLevel(shipId);
    const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
    
    if (currentLevel >= maxLevel) {
        return { success: false, message: '已达到最大强化等级' };
    }
    
    const cost = getEnhanceCost(config, currentLevel);
    
    // 检查材料
    const mats = GameState.materials || {};
    for (const [type, need] of Object.entries(cost.materials)) {
        if ((mats[type] || 0) < need) {
            return { success: false, message: `材料不足: ${MATERIAL_CONFIGS[type].name}` };
        }
    }
    
    // 检查金币
    if ((GameState.coins || 0) < cost.coins) {
        return { success: false, message: '金币不足' };
    }
    
    // 扣除材料和金币
    for (const [type, need] of Object.entries(cost.materials)) {
        mats[type] -= need;
    }
    GameState.coins -= cost.coins;
    
    // 升级
    if (!GameState.shipEnhancements) GameState.shipEnhancements = {};
    GameState.shipEnhancements[shipId] = currentLevel + 1;
    
    saveShipData();
    
    return { 
        success: true, 
        message: '强化成功',
        newLevel: currentLevel + 1
    };
}

// 获取等级配置
export function getRankConfig(rank) {
    return RANK_CONFIGS[rank] || RANK_CONFIGS['C'];
}

// 获取已拥有的飞机
export function getOwnedShips() {
    return GameState.ownedShips || ['basic'];
}

// 获取当前选择的飞机
export function getCurrentShip() {
    return GameState.currentShip || 'basic';
}

// 检查是否拥有某飞机
export function hasShip(shipId) {
    return getOwnedShips().includes(shipId);
}

// 购买飞机
export function buyShip(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return { success: false, message: '飞机不存在' };
    if (hasShip(shipId)) return { success: false, message: '已拥有该飞机' };
    if ((GameState.coins || 0) < config.price) return { success: false, message: '金币不足' };
    
    GameState.coins -= config.price;
    if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
    GameState.ownedShips.push(shipId);
    saveShipData();
    
    return { success: true, message: '购买成功' };
}

// 选择飞机
export function selectShip(shipId) {
    if (!hasShip(shipId)) return false;
    GameState.currentShip = shipId;
    saveShipData();
    return true;
}

// 应用飞机属性
export function applyShipStats() {
    const shipId = getCurrentShip();
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;
    
    // 获取强化后的属性
    const enhanced = getEnhancedStats(config);
    
    PlayerState.maxHp = enhanced.maxHp;
    PlayerState.stats.damage = enhanced.damage;
    PlayerState.stats.fireRate = enhanced.fireRate;
    PlayerState.stats.multiShot = enhanced.multiShot;
    PlayerState.stats.bulletSize = enhanced.bulletSize;
    PlayerState.stats.piercing = enhanced.piercing;
    PlayerState.stats.dodgeChance = enhanced.dodgeChance;
    PlayerState.stats.startShield = enhanced.startShield;
    PlayerState.stats.revive = enhanced.revive;
    
    PlayerState.shipColor = config.color;
    PlayerState.shipId = config.id;
    PlayerState.shipRank = config.rank;
    PlayerState.enhanceLevel = getShipEnhanceLevel(shipId);
}

// 保存数据
export function saveShipData() {
    const data = JSON.parse(localStorage.getItem('shooterProgress') || '{}');
    data.ownedShips = GameState.ownedShips || ['basic'];
    data.currentShip = GameState.currentShip || 'basic';
    data.coins = GameState.coins || 0;
    data.materials = GameState.materials || { common: 0, rare: 0, epic: 0, legendary: 0 };
    data.shipEnhancements = GameState.shipEnhancements || {};
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 加载数据
export function loadShipData() {
    try {
        const data = JSON.parse(localStorage.getItem('shooterProgress'));
        if (data) {
            GameState.ownedShips = data.ownedShips || ['basic'];
            GameState.currentShip = data.currentShip || 'basic';
            GameState.materials = data.materials || { common: 0, rare: 0, epic: 0, legendary: 0 };
            GameState.shipEnhancements = data.shipEnhancements || {};
        }
    } catch (e) {
        GameState.ownedShips = ['basic'];
        GameState.currentShip = 'basic';
        GameState.materials = { common: 0, rare: 0, epic: 0, legendary: 0 };
        GameState.shipEnhancements = {};
    }
}

// 添加材料
export function addMaterial(type, amount) {
    if (!GameState.materials) GameState.materials = { common: 0, rare: 0, epic: 0, legendary: 0 };
    if (!GameState.materials[type]) GameState.materials[type] = 0;
    GameState.materials[type] += amount;
    saveShipData();
    return amount;
}

// 渲染商店 - 横版轮播
export function renderShipShop() {
    const carousel = document.getElementById('ship-grid');
    if (!carousel) return;
    
    carousel.innerHTML = '';
    
    // 按等级分组
    const groups = { 'SSR': [], 'A': [], 'B': [], 'C': [] };
    SHIP_CONFIGS.forEach(config => {
        if (groups[config.rank]) groups[config.rank].push(config);
    });
    
    const rankOrder = ['C', 'B', 'A', 'SSR'];
    const allShips = [];
    
    // 合并所有飞机 (低等级到高等级从左到右)
    rankOrder.forEach(rank => {
        allShips.push(...groups[rank]);
    });
    
    // 渲染每个飞机卡片
    allShips.forEach((config, index) => {
        const owned = hasShip(config.id);
        const selected = getCurrentShip() === config.id;
        const enhanceLevel = getShipEnhanceLevel(config.id);
        const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
        
        const card = document.createElement('div');
        card.className = `ship-card rank-${config.rank.toLowerCase()} ${owned ? 'owned' : ''} ${selected ? 'selected' : ''}`;
        card.dataset.index = index;
        
        let buttonText, buttonClass, buttonDisabled;
        if (selected) {
            buttonText = '当前使用';
            buttonClass = 'selected';
            buttonDisabled = true;
        } else if (owned) {
            buttonText = '装备';
            buttonClass = 'equip';
            buttonDisabled = false;
        } else {
            buttonText = `💰 ${config.price}`;
            buttonClass = '';
            buttonDisabled = (GameState.coins || 0) < config.price;
        }
        
        // 创建 canvas 预览
        const canvasId = `ship-preview-${config.id}-${Date.now()}`;
        
        card.innerHTML = `
            <div class="card-rank-badge rank-${config.rank.toLowerCase()}">${config.rank}</div>
            <canvas id="${canvasId}" class="card-ship-canvas" width="120" height="120"></canvas>
            <div class="card-info">
                <div class="card-name">${config.name}</div>
                <div class="card-desc">${config.desc}</div>
                <div class="card-stats">
                    <span title="生命值">❤️ ${config.stats.maxHp}</span>
                    <span title="伤害">⚔️ ${config.stats.damage}</span>
                    <span title="射速">⚡ ${(1000/config.stats.fireRate).toFixed(1)}/s</span>
                </div>
            </div>
            <button class="card-btn ${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        
        // 延迟绘制 canvas (等 DOM 插入后)
        requestAnimationFrame(() => {
            drawShipPreview(canvasId, config);
        });
        
        // 点击卡片切换 (如果不是当前激活的卡片)
        card.addEventListener('click', (e) => {
            // 如果点击的是按钮，不触发切换
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            
            const cardIndex = parseInt(card.dataset.index);
            if (cardIndex !== carouselState.currentIndex) {
                goToSlide(cardIndex);
            }
        });
        
        // 装备按钮
        const btn = card.querySelector('.card-btn');
        btn.addEventListener('click', () => {
            if (owned && !selected) {
                selectShip(config.id);
                renderShipShop();
                updateCarousel();
            } else if (!owned) {
                const result = buyShip(config.id);
                if (result.success) {
                    renderShipShop();
                    updateShipCoinDisplay();
                    updateMaterialDisplay();
                }
            }
        });
        
        // 强化按钮
        const enhanceBtn = card.querySelector('.enhance-btn-small');
        if (enhanceBtn && enhanceLevel < maxLevel) {
            enhanceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEnhanceModal(config);
            });
        }
        
        carousel.appendChild(card);
    });
    
    // 找到默认显示位置：未购买的最低等级飞机
    const rankWeight = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 4 };
    let targetIndex = 0;
    let minRankWeight = Infinity;
    
    allShips.forEach((config, index) => {
        if (!hasShip(config.id)) {
            const weight = rankWeight[config.rank];
            if (weight < minRankWeight) {
                minRankWeight = weight;
                targetIndex = index;
            }
        }
    });
    
    // 设置默认索引
    carouselState.currentIndex = targetIndex;
    
    // 初始化轮播
    initCarousel();
}

// 轮播状态
let carouselState = {
    currentIndex: 0,
    cardWidth: 320,
    gap: 20,
    isDragging: false,
    startX: 0,
    startIndex: 0,
    dragOffset: 0
};

// 初始化轮播
function initCarousel() {
    const carousel = document.getElementById('ship-grid');
    const dots = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('ship-prev');
    const nextBtn = document.getElementById('ship-next');
    
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.ship-card');
    const totalCards = cards.length;
    
    // 创建指示点
    if (dots) {
        dots.innerHTML = '';
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === carouselState.currentIndex ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(i));
            dots.appendChild(dot);
        }
    }
    
    // 按钮事件
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
            updateCarousel();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
            updateCarousel();
        });
    }
    
    // 触摸/鼠标拖动
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('touchstart', startDrag, { passive: true });
    
    carousel.addEventListener('mousemove', onDrag);
    carousel.addEventListener('touchmove', onDrag, { passive: true });
    
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('touchend', endDrag);
    carousel.addEventListener('mouseleave', endDrag);
    
    // 滚轮滑动
    carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0 || e.deltaX > 0) {
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
        } else {
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
        }
        updateCarousel();
    }, { passive: false });
    
    updateCarousel();
}

function startDrag(e) {
    const carousel = document.getElementById('ship-grid');
    carouselState.isDragging = true;
    carouselState.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    carouselState.startIndex = carouselState.currentIndex;
    carouselState.dragOffset = 0;
    carousel.style.cursor = 'grabbing';
}

function onDrag(e) {
    if (!carouselState.isDragging) return;
    e.preventDefault();
    
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const diff = carouselState.startX - x;
    carouselState.dragOffset = diff;
    
    // 增加阈值到120像素，降低拖动速度
    if (Math.abs(diff) > 120) {
        const carousel = document.getElementById('ship-grid');
        const cards = carousel.querySelectorAll('.ship-card');
        const totalCards = cards.length;
        
        if (diff > 0) {
            // 向左拖动，显示下一个
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
        } else {
            // 向右拖动，显示上一个
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
        }
        
        // 重置起始位置，避免连续触发
        carouselState.startX = x;
        updateCarousel();
    }
}

function endDrag() {
    const carousel = document.getElementById('ship-grid');
    carouselState.isDragging = false;
    carousel.style.cursor = 'grab';
}

function goToSlide(index) {
    const carousel = document.getElementById('ship-grid');
    const cards = carousel.querySelectorAll('.ship-card');
    carouselState.currentIndex = Math.max(0, Math.min(cards.length - 1, index));
    updateCarousel();
}

function updateCarousel() {
    const carousel = document.getElementById('ship-grid');
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.ship-card');
    const dots = document.getElementById('carousel-dots');
    
    cards.forEach((card, index) => {
        const offset = index - carouselState.currentIndex;
        const absOffset = Math.abs(offset);
        
        // 位置计算
        const translateX = offset * (carouselState.cardWidth + carouselState.gap);
        const scale = absOffset === 0 ? 1 : 0.85;
        const opacity = absOffset > 2 ? 0 : (absOffset === 0 ? 1 : 0.6);
        const zIndex = 100 - absOffset;
        
        card.style.transform = `translateX(${translateX}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
        card.classList.toggle('active', index === carouselState.currentIndex);
    });
    
    // 更新指示点
    if (dots) {
        const dotElements = dots.querySelectorAll('.carousel-dot');
        dotElements.forEach((dot, index) => {
            dot.classList.toggle('active', index === carouselState.currentIndex);
        });
    }
}

// 显示强化弹窗
function showEnhanceModal(config) {
    const level = getShipEnhanceLevel(config.id);
    const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
    const cost = getEnhanceCost(config, level);
    const mats = GameState.materials || {};
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'enhance-modal';
    
    // 材料列表
    let materialsHtml = '';
    for (const [type, need] of Object.entries(cost.materials)) {
        const cfg = MATERIAL_CONFIGS[type];
        const have = mats[type] || 0;
        const enough = have >= need;
        materialsHtml += `
            <div class="material-item ${enough ? 'enough' : 'not-enough'}">
                <span class="material-icon" style="color: ${cfg.color}">${cfg.icon}</span>
                <span class="material-name">${cfg.name}</span>
                <span class="material-need">${have}/${need}</span>
            </div>
        `;
    }
    
    // 强化后属性预览
    const currentStats = getEnhancedStats(config);
    const nextStats = (() => {
        // 模拟+1级
        GameState.shipEnhancements[config.id] = level + 1;
        const stats = getEnhancedStats(config);
        delete GameState.shipEnhancements[config.id];
        if (level > 0) GameState.shipEnhancements[config.id] = level;
        return stats;
    })();
    
    modal.innerHTML = `
        <div class="enhance-modal-content">
            <h3>${config.name} 强化</h3>
            <div class="enhance-current">当前等级: +${level} / ${maxLevel}</div>
            
            <div class="enhance-stats-compare">
                <div class="stats-column">
                    <div class="stats-title">当前</div>
                    <div>❤️ ${currentStats.maxHp}</div>
                    <div>⚔️ ${currentStats.damage.toFixed(1)}</div>
                    <div>⚡ ${(1000/currentStats.fireRate).toFixed(1)}/s</div>
                </div>
                <div class="stats-arrow">→</div>
                <div class="stats-column next">
                    <div class="stats-title">+${level + 1}</div>
                    <div>❤️ ${nextStats.maxHp}</div>
                    <div>⚔️ ${nextStats.damage.toFixed(1)}</div>
                    <div>⚡ ${(1000/nextStats.fireRate).toFixed(1)}/s</div>
                </div>
            </div>
            
            <div class="enhance-materials">
                <div class="materials-title">强化材料</div>
                ${materialsHtml}
            </div>
            
            <div class="enhance-coin-cost">
                💰 ${cost.coins}
            </div>
            
            <div class="enhance-buttons">
                <button class="cancel-btn">取消</button>
                <button class="confirm-btn ${GameState.coins < cost.coins ? 'disabled' : ''}">强化</button>
            </div>
        </div>
    `;
    
    // 关闭弹窗
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    // 确认强化
    const confirmBtn = modal.querySelector('.confirm-btn');
    confirmBtn.addEventListener('click', () => {
        const result = enhanceShip(config.id);
        if (result.success) {
            modal.remove();
            renderShipShop();
            updateShipCoinDisplay();
            updateMaterialDisplay();
        } else {
            confirmBtn.textContent = result.message;
            confirmBtn.classList.add('error');
            setTimeout(() => {
                confirmBtn.textContent = '强化';
                confirmBtn.classList.remove('error');
            }, 1500);
        }
    });
    
    document.body.appendChild(modal);
}

// 更新金币显示
export function updateShipCoinDisplay() {
    ['menu-coin-display', 'upgrade-coin-display', 'ship-coin-display'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = GameState.coins || 0;
    });
}

// 更新材料显示
export function updateMaterialDisplay() {
    const container = document.getElementById('material-display');
    if (!container) return;
    
    const mats = GameState.materials || {};
    container.innerHTML = `
        <div class="material-count" title="${MATERIAL_CONFIGS.common.name}">
            <span style="color: ${MATERIAL_CONFIGS.common.color}">⚙️</span> ${mats.common || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.rare.name}">
            <span style="color: ${MATERIAL_CONFIGS.rare.color}">🔩</span> ${mats.rare || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.epic.name}">
            <span style="color: ${MATERIAL_CONFIGS.epic.color}">⚡</span> ${mats.epic || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.legendary.name}">
            <span style="color: ${MATERIAL_CONFIGS.legendary.color}">💎</span> ${mats.legendary || 0}
        </div>
    `;
}

// 在 canvas 上绘制飞机预览
function drawShipPreview(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const s = 35; // 飞机大小
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const color = config.color;
    const rank = config.rank;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 根据等级绘制
    switch(rank) {
        case 'SSR':
            drawSSRPreview(ctx, centerX, centerY, s, color);
            break;
        case 'A':
            drawAPreview(ctx, centerX, centerY, s, color);
            break;
        case 'B':
            drawBPreview(ctx, centerX, centerY, s, color);
            break;
        case 'C':
        default:
            drawCPreview(ctx, centerX, centerY, s, color);
            break;
    }
}

// C级预览
function drawCPreview(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // 基础三角形
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 尾焰
    ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 10);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

// B级预览
function drawBPreview(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // 双层机身
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.65, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.65, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 内层浅色
    ctx.fillStyle = lightenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.lineTo(x + s * 0.4, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.1);
    ctx.lineTo(x - s * 0.4, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 机翼推进器
    ctx.fillStyle = color;
    ctx.fillRect(x - s * 0.75, y + s * 0.1, s * 0.12, s * 0.35);
    ctx.fillRect(x + s * 0.63, y + s * 0.1, s * 0.12, s * 0.35);

    // 蓝色尾焰
    ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 12);
    ctx.lineTo(x + s * 0.25, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

// A级预览
function drawAPreview(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // 能量光环
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, 0.5, 0.5 + Math.PI * 1.5);
    ctx.stroke();

    // 流线型机身 - 渐变填充
    const gradient = ctx.createLinearGradient(x - s * 0.5, y - s, x + s * 0.5, y + s * 0.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 40));
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.5, y + s * 0.1);
    ctx.lineTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.7, y + s * 0.6);
    ctx.lineTo(x - s * 0.5, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#e0f7fa';
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.25, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 紫青色尾焰
    const tailGradient = ctx.createLinearGradient(x, y + s * 0.3, x, y + s * 0.3 + 15);
    tailGradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)');
    tailGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.6)');
    tailGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');

    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 15);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

// SSR级预览
function drawSSRPreview(ctx, x, y, s, color) {
    // 双层能量光环
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // 外环
    ctx.beginPath();
    ctx.arc(x, y, s + 5, 0.3, 0.3 + Math.PI * 2);
    ctx.stroke();

    // 内环
    ctx.strokeStyle = 'rgba(255, 100, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, -0.5, -0.5 + Math.PI * 2);
    ctx.stroke();

    // 护盾板/翅膀
    ctx.fillStyle = lightenColor(color, 20);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y);
    ctx.lineTo(x - s * 1.1, y - s * 0.2);
    ctx.lineTo(x - s * 0.9, y + s * 0.15);
    ctx.lineTo(x - s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y);
    ctx.lineTo(x + s * 1.1, y - s * 0.2);
    ctx.lineTo(x + s * 0.9, y + s * 0.15);
    ctx.lineTo(x + s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 主体 - 金属质感
    const metalGradient = ctx.createLinearGradient(x, y - s, x, y + s * 0.5);
    metalGradient.addColorStop(0, '#ffffff');
    metalGradient.addColorStop(0.2, color);
    metalGradient.addColorStop(0.5, lightenColor(color, 30));
    metalGradient.addColorStop(0.8, color);
    metalGradient.addColorStop(1, darkenColor(color, 20));

    ctx.fillStyle = metalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // 彩虹边缘
    const rainbowGradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
    rainbowGradient.addColorStop(0, '#ff0000');
    rainbowGradient.addColorStop(0.17, '#ff8800');
    rainbowGradient.addColorStop(0.33, '#ffff00');
    rainbowGradient.addColorStop(0.5, '#00ff00');
    rainbowGradient.addColorStop(0.67, '#0088ff');
    rainbowGradient.addColorStop(0.83, '#8800ff');
    rainbowGradient.addColorStop(1, '#ff0088');

    ctx.strokeStyle = rainbowGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.stroke();

    // 核心
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 多色尾焰
    for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * s * 0.12;
        const hue = i * 60;
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
        ctx.beginPath();
        ctx.moveTo(x + offset - s * 0.08, y + s * 0.3);
        ctx.lineTo(x + offset, y + s * 0.3 + 12);
        ctx.lineTo(x + offset + s * 0.08, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

// 颜色辅助函数
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
