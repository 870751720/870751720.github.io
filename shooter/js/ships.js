/**
 * 飞机系统 - 逻辑层
 * 配置数据已迁移到 config/ships.js
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress } from './upgrades.js';
import { drawDynamicShip } from './ship-renderer.js';
import { getStorage, setStorage, updateStorage } from './core/storage.js';

// 从配置文件导入
export {
  RANK_CONFIGS,
  SHIP_CONFIGS,
  CONSTELLATION_CONFIGS,
  SHIP_STORIES,
  MATERIAL_CONFIGS,
  getConstellationMaterialId,
  getConstellationMaterialConfig
} from './config/ships.js';

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

export function enhanceShip(shipId) {
  const { SHIP_CONFIGS, RANK_CONFIGS, MATERIAL_CONFIGS } = await import('./config/ships.js');
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
  return (await import('./config/ships.js')).RANK_CONFIGS[rank] || { maxEnhance: 5 };
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
  const { SHIP_CONFIGS } = await import('./config/ships.js');
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
  applyShipStats(shipId);
  return { success: true, message: '切换成功' };
}

export async function applyShipStats(shipId) {
  const { SHIP_CONFIGS } = await import('./config/ships.js');
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
  itemWidth: 300,
  gap: 40,
  isDragging: false,
  startX: 0,
  currentX: 0,
  translateX: 0
};

export async function renderShipShop() {
  const { SHIP_CONFIGS } = await import('./config/ships.js');
  const container = document.getElementById('ship-grid');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!container) return;
  
  carouselState.items = SHIP_CONFIGS;
  
  container.innerHTML = carouselState.items.map((ship, index) => createShipCard(ship, index)).join('');
  
  requestAnimationFrame(() => {
    carouselState.items.forEach((ship, index) => {
      const canvas = document.getElementById(`ship-preview-${index}`);
      if (canvas) drawDynamicShip(canvas, ship);
    });
  });
  
  if (dotsContainer) {
    dotsContainer.innerHTML = carouselState.items.map((_, i) => 
      `<div class="carousel-dot ${i === carouselState.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');
  }
  
  initCarousel();
}

function createShipCard(ship, index) {
  const owned = hasShip(ship.id);
  const current = getCurrentShip() === ship.id;
  const rankClass = ship.rank.toLowerCase();
  
  return `
    <div class="ship-card ${rankClass} ${owned ? 'owned' : ''} ${current ? 'current' : ''}" data-ship-id="${ship.id}" data-index="${index}">
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
        ${owned ? 
          (current ? '<button class="equip-btn equipped" disabled>当前使用</button>' : 
                     '<button class="equip-btn" onclick="window.equipShip(\'' + ship.id + '\')">装备</button>') :
          `<button class="buy-btn" onclick="window.buyShip('${ship.id}')">💰 ${ship.price}</button>`
        }
      </div>
    </div>
  `;
}

function initCarousel() {
  const container = document.querySelector('.ship-carousel');
  if (!container) return;
  
  const updatePosition = () => {
    const totalWidth = carouselState.items.length * (carouselState.itemWidth + carouselState.gap);
    const maxTranslate = Math.max(0, totalWidth - container.parentElement.offsetWidth);
    carouselState.translateX = Math.max(-maxTranslate, Math.min(0, carouselState.translateX));
    container.style.transform = `translateX(${carouselState.translateX}px)`;
  };
  
  document.getElementById('ship-prev')?.addEventListener('click', () => {
    carouselState.translateX += carouselState.itemWidth + carouselState.gap;
    updatePosition();
  });
  
  document.getElementById('ship-next')?.addEventListener('click', () => {
    carouselState.translateX -= carouselState.itemWidth + carouselState.gap;
    updatePosition();
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
