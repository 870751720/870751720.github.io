/**
 * 飞机系统 - 逻辑层
 * 配置数据已迁移到 config/ships.js
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress } from './upgrades.js';
import { drawStaticShip, drawDynamicShip } from './ship-renderer.js';
import { getStorage, setStorage, updateStorage } from './core/storage.js';
import {
  RANK_CONFIGS,
  SHIP_CONFIGS,
  CONSTELLATION_CONFIGS,
  SHIP_STORIES,
  MATERIAL_CONFIGS,
  getConstellationMaterialId,
  getConstellationMaterialConfig
} from './config/ships.js';

// 重新导出配置，供其他模块使用
export {
  RANK_CONFIGS,
  SHIP_CONFIGS,
  CONSTELLATION_CONFIGS,
  SHIP_STORIES,
  MATERIAL_CONFIGS,
  getConstellationMaterialId,
  getConstellationMaterialConfig
};

// ========== 强化系统 ==========

export function getShipEnhanceLevel(shipId) {
  return (GameState.shipEnhancements || {})[shipId] || 0;
}

export function getEnhancedStats(config) {
  const level = getShipEnhanceLevel(config.id);
  const multiplier = 1 + (level * 0.05);

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

export function getEnhanceCost(config, currentLevel) {
  const baseMultiplier = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 5 }[config.rank];
  const materials = {};
  const nextLevel = currentLevel + 1;

  materials.common = 5 * baseMultiplier * nextLevel;
  if (nextLevel >= 3) materials.rare = 2 * baseMultiplier * (nextLevel - 2);
  if (nextLevel >= 5) materials.epic = 1 * baseMultiplier * (nextLevel - 4);
  if (nextLevel >= 10) materials.legendary = 1 * (nextLevel - 9);

  return { materials, coins: Math.floor(50 * baseMultiplier * Math.pow(1.5, currentLevel)) };
}

export async function enhanceShip(shipId) {
  const config = SHIP_CONFIGS.find(s => s.id === shipId);
  if (!config) return { success: false, message: '飞机不存在' };
  if (!hasShip(shipId)) return { success: false, message: '未拥有该飞机' };

  const currentLevel = getShipEnhanceLevel(shipId);
  const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
  if (currentLevel >= maxLevel) return { success: false, message: '已达到最大强化等级' };

  const cost = getEnhanceCost(config, currentLevel);
  const mats = GameState.materials || {};

  for (const [type, need] of Object.entries(cost.materials)) {
    if ((mats[type] || 0) < need) {
      return { success: false, message: `材料不足: ${MATERIAL_CONFIGS[type].name}` };
    }
  }

  if ((GameState.coins || 0) < cost.coins) return { success: false, message: '金币不足' };

  for (const [type, need] of Object.entries(cost.materials)) mats[type] -= need;
  GameState.coins -= cost.coins;

  if (!GameState.shipEnhancements) GameState.shipEnhancements = {};
  GameState.shipEnhancements[shipId] = currentLevel + 1;
  saveShipData();

  return { success: true, message: '强化成功', newLevel: currentLevel + 1 };
}

// ========== 数据查询 ==========

export function getRankConfig(rank) {
  return RANK_CONFIGS[rank] || { maxEnhance: 5 };
}

export function getOwnedShips() {
  const ships = GameState.ownedShips || ['basic'];
  return [...new Set(ships)];
}

export function getCurrentShip() {
  return GameState.currentShip || 'basic';
}

export function hasShip(shipId) {
  return getOwnedShips().includes(shipId);
}

export async function buyShip(shipId) {
  const config = SHIP_CONFIGS.find(s => s.id === shipId);
  if (!config) return { success: false, message: '飞机不存在' };
  if (hasShip(shipId)) return { success: false, message: '已拥有该飞机' };
  if ((GameState.coins || 0) < config.price) return { success: false, message: '金币不足' };

  GameState.coins -= config.price;
  if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
  GameState.ownedShips.push(shipId);
  saveShipData();
  saveProgress();

  return { success: true, message: '购买成功', ship: config };
}

export async function setCurrentShip(shipId) {
  if (!hasShip(shipId)) return { success: false, message: '未拥有该飞机' };
  GameState.currentShip = shipId;
  saveShipData();
  await applyShipStats(shipId);
  return { success: true, message: '切换成功' };
}

export function applyShipStats(shipId) {
  const config = SHIP_CONFIGS.find(s => s.id === shipId);
  if (!config) return;

  const stats = getEnhancedStats(config);
  PlayerState.maxHp = stats.maxHp;
  PlayerState.hp = PlayerState.maxHp;
  PlayerState.stats.damage = stats.damage;
  PlayerState.stats.fireRate = stats.fireRate;
  PlayerState.stats.multiShot = stats.multiShot;
  PlayerState.stats.bulletSize = stats.bulletSize;
  PlayerState.stats.piercing = stats.piercing;
  PlayerState.stats.dodgeChance = stats.dodgeChance;
  PlayerState.stats.revive = stats.revive;
  PlayerState.shield = stats.startShield;
  PlayerState.shipRank = config.rank;
  PlayerState.shipColor = config.color;
  PlayerState.enhanceLevel = getShipEnhanceLevel(shipId);
}

// ========== 数据持久化 ==========

export function saveShipData() {
  if (GameState.ownedShips) GameState.ownedShips = [...new Set(GameState.ownedShips)];

  updateStorage({
    ownedShips: GameState.ownedShips || ['basic'],
    currentShip: GameState.currentShip || 'basic',
    materials: GameState.materials || { common: 0, rare: 0, epic: 0, legendary: 0 },
    shipEnhancements: GameState.shipEnhancements || {},
    constellations: GameState.constellations || {}
  });
}

export function loadShipData() {
  GameState.ownedShips = getStorage('ownedShips') || ['basic'];
  GameState.currentShip = getStorage('currentShip') || 'basic';
  GameState.materials = getStorage('materials') || { common: 0, rare: 0, epic: 0, legendary: 0 };
  GameState.shipEnhancements = getStorage('shipEnhancements') || {};
  GameState.constellations = getStorage('constellations') || {};
}

export function addMaterial(type, amount) {
  if (!GameState.materials) GameState.materials = { common: 0, rare: 0, epic: 0, legendary: 0 };
  if (!GameState.materials[type]) GameState.materials[type] = 0;
  GameState.materials[type] += amount;
  saveShipData();
  return amount;
}

// ========== 商店渲染 ==========

let carouselState = {
  items: [],
  currentIndex: 0,
  itemWidth: 280,
  gap: 20,
  isDragging: false,
  startX: 0,
  currentX: 0,
  translateX: 0
};

export function renderShipShop() {
  const screen = document.getElementById('ship-screen');
  if (!screen) return;
  
  // 生成完整界面
  screen.innerHTML = `
    <button id="ship-back-btn" class="back-btn-fixed">← 返回</button>
    
    <div class="ship-content">
      <div class="ship-header">
        <div class="ship-coins">💰 <span id="ship-coin-display">0</span></div>
      </div>
      
      <div class="ship-carousel-container">
        <button class="carousel-nav prev" id="ship-prev">◀</button>
        <div class="ship-carousel" id="ship-grid"></div>
        <button class="carousel-nav next" id="ship-next">▶</button>
      </div>
      
      <div class="carousel-dots" id="carousel-dots"></div>
    </div>
  `;
  
  // 绑定返回按钮
  document.getElementById('ship-back-btn')?.addEventListener('click', () => {
    document.getElementById('ship-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
  });
  
  const container = document.getElementById('ship-grid');
  const dotsContainer = document.getElementById('carousel-dots');

  // 按等级分组并排序
  const groups = { 'SSR': [], 'A': [], 'B': [], 'C': [] };
  SHIP_CONFIGS.forEach(config => {
    if (groups[config.rank]) groups[config.rank].push(config);
  });
  
  const rankOrder = ['C', 'B', 'A', 'SSR'];
  carouselState.items = [];
  rankOrder.forEach(rank => {
    carouselState.items.push(...groups[rank]);
  });

  // 找到第一个未购买且品级最低的飞机作为默认选中
  let defaultIndex = 0;
  for (let i = 0; i < carouselState.items.length; i++) {
    if (!hasShip(carouselState.items[i].id)) {
      defaultIndex = i;
      break;
    }
  }
  carouselState.currentIndex = defaultIndex;

  container.innerHTML = carouselState.items.map((ship, index) => createShipCard(ship, index)).join('');

  // 绘制预览 - 动态
  requestAnimationFrame(() => {
    carouselState.items.forEach((ship, index) => {
      const canvasId = `ship-preview-${index}`;
      if (document.getElementById(canvasId)) {
        drawDynamicShip(canvasId, ship, { animateFloat: true, shootBullets: true });
      }
    });
  });

  // 更新指示点
  if (dotsContainer) {
    dotsContainer.innerHTML = carouselState.items.map((_, i) =>
      `<div class="carousel-dot ${i === carouselState.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');
  }

  updateShipCoinDisplay();
  initCarousel();
  updateCarousel();
}

function createShipCard(ship, index) {
  const owned = hasShip(ship.id);
  const current = getCurrentShip() === ship.id;
  const rankClass = ship.rank.toLowerCase();

  let buttonText, buttonClass, buttonDisabled;
  if (current) {
    buttonText = '当前使用';
    buttonClass = 'equipped';
    buttonDisabled = true;
  } else if (owned) {
    buttonText = '装备';
    buttonClass = 'equip';
    buttonDisabled = false;
  } else {
    buttonText = `💰 ${ship.price}`;
    buttonClass = 'buy';
    buttonDisabled = (GameState.coins || 0) < ship.price;
  }

  return `
    <div class="ship-card rank-${rankClass} ${owned ? 'owned' : ''} ${current ? 'current' : ''}" 
         data-ship-id="${ship.id}" data-index="${index}">
      <div class="ship-rank-badge rank-${rankClass}">${ship.rank}</div>
      <canvas id="ship-preview-${index}" class="ship-preview-canvas" width="200" height="200"></canvas>
      <div class="ship-info">
        <h3 class="ship-name">${ship.name}</h3>
        <p class="ship-desc">${ship.desc}</p>
        <div class="ship-stats">
          <span>❤️ ${ship.stats.maxHp}</span>
          <span>⚔️ ${ship.stats.damage}</span>
          <span>⚡ ${(1000/ship.stats.fireRate).toFixed(1)}/s</span>
        </div>
        <button class="ship-btn ${buttonClass}" ${buttonDisabled ? 'disabled' : ''} data-action="${owned ? (current ? '' : 'equip') : 'buy'}" data-ship-id="${ship.id}">
          ${buttonText}
        </button>
      </div>
    </div>
  `;
}

function initCarousel() {
  const container = document.querySelector('.ship-carousel');
  if (!container) return;

  // 清理旧事件（移除所有监听器）
  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);

  // 状态变量
  let isDragging = false;
  let startX = 0;
  let currentX = 0;

  // 获取当前选中项应居中的位置
  const getBaseX = () => {
    const firstCard = newContainer.querySelector('.ship-card');
    const actualItemWidth = firstCard ? firstCard.offsetWidth : carouselState.itemWidth;
    const itemWidth = actualItemWidth + carouselState.gap;
    const containerWidth = newContainer.parentElement.offsetWidth;
    const centerOffset = containerWidth / 2 - actualItemWidth / 2;
    return centerOffset - carouselState.currentIndex * itemWidth;
  };

  // 开始拖拽
  const onStart = (e) => {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentX = startX;
    newContainer.style.cursor = 'grabbing';
    newContainer.style.transition = 'none'; // 拖拽时无动画
  };

  // 拖拽中
  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // 基于当前选中位置 + 拖拽偏移，可以持续拖动
    const baseX = getBaseX();
    newContainer.style.transform = `translateX(${baseX + deltaX}px)`;
    
    // 只有当偏移超过阈值时才切换当前展示的飞机
    const firstCard = newContainer.querySelector('.ship-card');
    const actualItemWidth = firstCard ? firstCard.offsetWidth : carouselState.itemWidth;
    const itemWidth = actualItemWidth + carouselState.gap;
    const threshold = itemWidth / 2; // 超过半个卡片宽度才切换
    
    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? -1 : 1; // 向右拖->看左边的，向左拖->看右边的
      const newIndex = carouselState.currentIndex + direction;
      const clampedIndex = Math.max(0, Math.min(carouselState.items.length - 1, newIndex));
      
      if (clampedIndex !== carouselState.currentIndex) {
        carouselState.currentIndex = clampedIndex;
        // 重置起始点，避免连续快速切换
        startX = currentX;
        updateCarouselState();
      }
    }
  };

  // 结束拖拽
  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    newContainer.style.cursor = 'grab';
    newContainer.style.transition = 'transform 0.3s ease-out'; // 恢复动画
    
    // 松手后吸附到当前选中的卡片
    updateCarousel();
  };

  // 绑定事件到容器
  newContainer.addEventListener('mousedown', onStart);
  newContainer.addEventListener('touchstart', onStart, { passive: true });

  // 窗口级事件确保拖拽不中断
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);

  // 防止拖拽时选中文本
  newContainer.addEventListener('selectstart', (e) => e.preventDefault());

  // 导航按钮
  document.getElementById('ship-prev')?.addEventListener('click', () => {
    goToSlide(Math.max(0, carouselState.currentIndex - 1));
  });

  document.getElementById('ship-next')?.addEventListener('click', () => {
    goToSlide(Math.min(carouselState.items.length - 1, carouselState.currentIndex + 1));
  });

  // 卡片点击事件委托
  newContainer.addEventListener('click', (e) => {
    if (isDragging) return;

    const btn = e.target.closest('.ship-btn');
    if (btn) {
      e.stopPropagation();
      const shipId = btn.dataset.shipId;
      const action = btn.dataset.action;
      
      // 获取当前点击的卡片索引
      const card = btn.closest('.ship-card');
      const cardIndex = parseInt(card?.dataset.index || '0');

      if (action === 'equip') {
        // 只有当前选中的飞机才能装备
        if (cardIndex !== carouselState.currentIndex) {
          return;
        }
        setCurrentShip(shipId).then(() => {
          renderShipShop();
          updateCarousel();
        });
      } else if (action === 'buy') {
        // 只有当前选中的飞机才能购买
        if (cardIndex !== carouselState.currentIndex) {
          // 非选中飞机，不执行购买
          return;
        }
        buyShip(shipId).then(result => {
          if (result.success) {
            renderShipShop();
            updateShipCoinDisplay();
          }
        });
      }
      return;
    }

    // 点击卡片切换到该卡片
    const card = e.target.closest('.ship-card');
    if (card) {
      const index = parseInt(card.dataset.index);
      if (index !== carouselState.currentIndex) {
        goToSlide(index);
      }
    }
  });
}

function goToSlide(index) {
  carouselState.currentIndex = index;
  carouselState.translateX = -index * (carouselState.itemWidth + carouselState.gap);
  updateCarousel();
}

function updateCarousel() {
  const container = document.querySelector('.ship-carousel');
  if (!container) return;
  
  // 动态获取实际卡片宽度（响应式时可能不同）
  const firstCard = container.querySelector('.ship-card');
  const actualItemWidth = firstCard ? firstCard.offsetWidth : carouselState.itemWidth;
  const itemWidth = actualItemWidth + carouselState.gap;
  
  const containerWidth = container.parentElement.offsetWidth;
  const centerOffset = containerWidth / 2 - actualItemWidth / 2;
  
  // 计算目标位置：让当前卡片居中
  const targetX = centerOffset - carouselState.currentIndex * itemWidth;
  
  // 应用变换到容器
  container.style.transform = `translateX(${targetX}px)`;
  
  // 更新卡片状态
  updateCarouselState();
  
  // 更新指示点
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === carouselState.currentIndex);
  });
}

// 只更新卡片状态（不移动容器）
function updateCarouselState() {
  const container = document.querySelector('.ship-carousel');
  if (!container) return;
  
  const cards = container.querySelectorAll('.ship-card');
  cards.forEach((card, i) => {
    const offset = i - carouselState.currentIndex;
    const isActive = i === carouselState.currentIndex;
    
    card.classList.toggle('active', isActive);
    card.style.marginRight = i < cards.length - 1 ? `${carouselState.gap}px` : '0';
    card.style.transform = `scale(${isActive ? 1 : 0.75})`;
    card.style.opacity = Math.abs(offset) > 10 ? '0' : (isActive ? '1' : '0.5');
    card.style.zIndex = isActive ? '10' : '1';
  });
  
  // 更新指示点
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === carouselState.currentIndex);
  });
}

// ========== UI 更新 ==========

export function updateShipCoinDisplay() {
  const display = document.getElementById('ship-coin-display');
  if (display) display.textContent = GameState.coins || 0;
}

export function updateMaterialDisplay() {
  const container = document.getElementById('material-display');
  if (!container) return;

  const mats = GameState.materials || {};
  container.innerHTML = Object.entries(mats).map(([type, count]) => {
    return `<span class="material-count">${type}: ${count}</span>`;
  }).join('');
}

// 全局暴露函数供 HTML 调用
window.equipShip = (shipId) => setCurrentShip(shipId).then(() => renderShipShop());
window.buyShip = (shipId) => buyShip(shipId).then(r => { if (r.success) renderShipShop(); });
