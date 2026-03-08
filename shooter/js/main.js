/**
 * 游戏入口文件 - 优化版
 */

import { DOM, setContext, GameState } from './state.js';
import { InputState } from './state.js';
import { startGame } from './game.js';
import { loadProgress, updateCoinDisplays } from './upgrades.js';
import { loadShipData, renderShipShop, updateShipCoinDisplay } from './ships.js';
import { renderGachaShop } from './gacha.js';
import { loadShipUpgrades, renderHangarUpgrade, updateHangarCoinDisplay, loadFavoriteShips } from './hangar.js';
import { renderInventory } from './inventory.js';
import { renderStoryScreen } from './story.js';

// 缓存屏幕元素引用
const screens = {};

/**
 * 切换屏幕
 */
function switchScreen(fromId, toId, onSwitch) {
  if (fromId && screens[fromId]) screens[fromId].classList.add('hidden');
  if (toId && screens[toId]) screens[toId].classList.remove('hidden');
  if (onSwitch) onSwitch();
}

/**
 * 绑定所有路由事件
 */
function bindRoutes() {
  // 主菜单按钮
  document.getElementById('upgrade-btn')?.addEventListener('click', () => {
    switchScreen('start-screen', 'upgrade-screen', () => {
      renderHangarUpgrade();
      updateHangarCoinDisplay();
    });
  });
  
  document.getElementById('inventory-btn')?.addEventListener('click', () => {
    switchScreen('start-screen', 'inventory-screen', () => {
      renderInventory();
    });
  });
  
  document.getElementById('ship-btn')?.addEventListener('click', () => {
    switchScreen('start-screen', 'ship-screen', () => {
      renderShipShop();
      updateShipCoinDisplay();
    });
  });
  
  document.getElementById('gacha-btn')?.addEventListener('click', () => {
    switchScreen('start-screen', 'gacha-screen', () => {
      renderGachaShop();
    });
  });
  
  document.getElementById('start-btn')?.addEventListener('click', startGame);
  
  // 返回主菜单
  document.getElementById('back-btn')?.addEventListener('click', () => {
    switchScreen('upgrade-screen', 'start-screen', updateCoinDisplays);
  });
  
  document.getElementById('ship-back-btn')?.addEventListener('click', () => {
    switchScreen('ship-screen', 'start-screen', updateCoinDisplays);
  });
  
  document.getElementById('gacha-back-btn')?.addEventListener('click', () => {
    switchScreen('gacha-screen', 'start-screen', updateCoinDisplays);
  });
  
  // 屏幕间跳转
  document.getElementById('to-ship-btn')?.addEventListener('click', () => {
    switchScreen('upgrade-screen', 'ship-screen', () => {
      renderShipShop();
      updateShipCoinDisplay();
    });
  });
  
  document.getElementById('to-upgrade-btn')?.addEventListener('click', () => {
    switchScreen('ship-screen', 'upgrade-screen', () => {
      renderHangarUpgrade();
      updateHangarCoinDisplay();
    });
  });
  
  document.getElementById('to-gacha-btn')?.addEventListener('click', () => {
    switchScreen('upgrade-screen', 'gacha-screen', renderGachaShop);
  });
  
  document.getElementById('gacha-to-ship-btn')?.addEventListener('click', () => {
    switchScreen('gacha-screen', 'ship-screen', () => {
      renderShipShop();
      updateShipCoinDisplay();
    });
  });
  
  document.getElementById('gacha-to-upgrade-btn')?.addEventListener('click', () => {
    switchScreen('gacha-screen', 'upgrade-screen', () => {
      renderHangarUpgrade();
      updateHangarCoinDisplay();
    });
  });
  
  // 子屏幕
  document.getElementById('story-entry')?.addEventListener('click', () => {
    switchScreen('upgrade-screen', 'story-screen', renderStoryScreen);
  });
  
  document.getElementById('story-back-btn')?.addEventListener('click', () => {
    switchScreen('story-screen', 'upgrade-screen', updateHangarCoinDisplay);
  });
}

/**
 * 初始化输入事件
 */
function initInputHandlers() {
  window.addEventListener('mousemove', e => {
    InputState.mouseX = e.clientX;
    InputState.mouseY = e.clientY;
  });

  window.addEventListener('mousedown', e => {
    if (GameState.running && e.button === 0) {
      InputState.mouseDown = true;
    }
  });

  window.addEventListener('mouseup', () => {
    InputState.mouseDown = false;
  });

  window.addEventListener('resize', () => {
    if (DOM.gameCanvas) {
      DOM.gameCanvas.width = window.innerWidth;
      DOM.gameCanvas.height = window.innerHeight;
    }
  });
}

/**
 * 初始化游戏
 */
function initGame() {
  // 缓存核心 DOM 引用
  DOM.startScreen = document.getElementById('start-screen');
  DOM.gameCanvas = document.getElementById('game-canvas');
  DOM.gameScore = document.getElementById('game-score');
  DOM.comboDisplay = document.getElementById('combo-display');
  DOM.comboCountEl = DOM.comboDisplay?.querySelector('.combo-count');
  DOM.hpDisplay = document.getElementById('hp-display');
  DOM.buffDisplay = document.getElementById('buff-display');
  
  // 缓存所有屏幕元素
  screens['start-screen'] = document.getElementById('start-screen');
  screens['upgrade-screen'] = document.getElementById('upgrade-screen');
  screens['inventory-screen'] = document.getElementById('inventory-screen');
  screens['ship-screen'] = document.getElementById('ship-screen');
  screens['gacha-screen'] = document.getElementById('gacha-screen');
  screens['story-screen'] = document.getElementById('story-screen');

  // 加载存档
  loadProgress();
  loadShipData();
  loadShipUpgrades();
  loadFavoriteShips();
  updateCoinDisplays();

  // 设置 Canvas
  if (DOM.gameCanvas) {
    DOM.gameCanvas.width = window.innerWidth;
    DOM.gameCanvas.height = window.innerHeight;
    setContext(DOM.gameCanvas.getContext('2d'));
  }

  // 绑定事件
  bindRoutes();
  initInputHandlers();
}

// 启动
document.addEventListener('DOMContentLoaded', initGame);
