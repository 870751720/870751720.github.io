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
  const container = document.getElementById('ship-grid');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!container) return;

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

  // 清除旧事件
  container.onmousedown = null;
  container.ontouchstart = null;
  
  // 鼠标/触摸按下
  container.onmousedown = container.ontouchstart = (e) => {
    carouselState.isDragging = true;
    carouselState.startX = e.touches ? e.touches[0].clientX : e.clientX;
    carouselState.currentX = carouselState.startX;
    container.style.cursor = 'grabbing';
  };
  
  // 鼠标/触摸移动
  const moveHandler = (e) => {
    if (!carouselState.isDragging) return;
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    carouselState.currentX = x;
    const deltaX = x - carouselState.startX;
    
    // 实时更新容器位置（跟随手指/鼠标）
    const itemWidth = carouselState.itemWidth + carouselState.gap;
    const containerWidth = container.parentElement.offsetWidth;
    const centerOffset = containerWidth / 2 - carouselState.itemWidth / 2;
    const baseX = centerOffset - carouselState.currentIndex * itemWidth;
    container.style.transform = `translateX(${baseX + deltaX}px)`;
  };
  
  container.onmousemove = moveHandler;
  container.ontouchmove = moveHandler;
  
  // 鼠标/触摸松开
  const endHandler = () => {
    if (!carouselState.isDragging) return;
    carouselState.isDragging = false;
    container.style.cursor = 'grab';
    
    // 根据滑动距离判断是否切换
    const x = carouselState.currentX;
    const deltaX = x - carouselState.startX;
    const threshold = carouselState.itemWidth / 3;
    
    if (deltaX > threshold && carouselState.currentIndex > 0) {
      goToSlide(carouselState.currentIndex - 1);
    } else if (deltaX < -threshold && carouselState.currentIndex < carouselState.items.length - 1) {
      goToSlide(carouselState.currentIndex + 1);
    } else {
      updateCarousel(); // 回弹到原位
    }
  };
  
  container.onmouseup = container.onmouseleave = endHandler;
  container.ontouchend = endHandler;
  
  // 按钮点击
  document.getElementById('ship-prev')?.addEventListener('click', () => {
    goToSlide(Math.max(0, carouselState.currentIndex - 1));
  });
  
  document.getElementById('ship-next')?.addEventListener('click', () => {
    goToSlide(Math.min(carouselState.items.length - 1, carouselState.currentIndex + 1));
  });
  
  // 卡片点击事件委托
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.ship-btn');
    if (btn) {
      e.stopPropagation();
      const shipId = btn.dataset.shipId;
      const action = btn.dataset.action;
      
      if (action === 'equip') {
        setCurrentShip(shipId).then(() => {
          renderShipShop();
          updateCarousel();
        });
      } else if (action === 'buy') {
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
  
  const itemWidth = carouselState.itemWidth + carouselState.gap;
  const containerWidth = container.parentElement.offsetWidth;
  const centerOffset = containerWidth / 2 - carouselState.itemWidth / 2;
  
  // 计算目标位置：让当前卡片居中
  const targetX = centerOffset - carouselState.currentIndex * itemWidth;
  
  // 应用变换到容器
  container.style.transform = `translateX(${targetX}px)`;
  
  // 更新卡片状态
  const cards = container.querySelectorAll('.ship-card');
  cards.forEach((card, i) => {
    const offset = i - carouselState.currentIndex;
    const isActive = i === carouselState.currentIndex;
    
    card.classList.toggle('active', isActive);
    // 卡片使用 margin 来设置间距，不需要 transform
    card.style.marginRight = i < cards.length - 1 ? `${carouselState.gap}px` : '0';
    card.style.transform = `scale(${isActive ? 1 : 0.85})`;
    // 只隐藏非常远的卡片，显示更多相邻卡片
    card.style.opacity = Math.abs(offset) > 10 ? '0' : (isActive ? '1' : '0.6');
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
