/**
 * 游戏入口文件 - 优化版
 */

import { DOM, setContext, GameState } from './state.js';
import { InputState } from './state.js';
import { startGame } from './game.js';
import { loadProgress, updateCoinDisplays } from './upgrades.js';
import { loadShipData, renderShipShop, updateShipCoinDisplay } from './ships.js';
import { renderGachaShop } from './gacha.js';
import { loadShipUpgrades, renderHangarUpgrade, updateHangarCoinDisplay, loadFavoriteShips, setSelectedUpgradeShip, setCurrentHangarTab } from './hangar.js';
import { renderInventory } from './inventory.js';
import { renderStoryScreen } from './story.js';
import { initUIManager, registerUI, pushUI, popUI, gotoUI, backToMain } from './ui-manager.js';

// 缓存屏幕元素引用
const screens = {};

/**
 * 初始化 UI 管理器（注册所有界面）
 */
function setupUIManager() {
  // 注册所有界面
  registerUI('start-screen', {
    onOpen: () => updateCoinDisplays()
  });
  
  registerUI('upgrade-screen', {
    onOpen: (params = {}) => {
      // 如果传入了 shipId，设置选中的飞机
      if (params.shipId && typeof setSelectedUpgradeShip === 'function') {
        setSelectedUpgradeShip(params.shipId);
      }
      // 如果传入了 tab，设置当前标签
      if (params.tab && typeof setCurrentHangarTab === 'function') {
        setCurrentHangarTab(params.tab);
      }
      renderHangarUpgrade();
      updateHangarCoinDisplay();
    },
    onBack: () => 'start-screen'
  });
  
  registerUI('inventory-screen', {
    onOpen: () => renderInventory(),
    onBack: () => 'start-screen'
  });
  
  registerUI('ship-screen', {
    onOpen: () => {
      renderShipShop();
      updateShipCoinDisplay();
    },
    onBack: () => 'start-screen'
  });
  
  registerUI('gacha-screen', {
    onOpen: () => renderGachaShop(),
    onBack: () => 'start-screen'
  });
  
  registerUI('story-screen', {
    onOpen: () => renderStoryScreen(),
    onBack: () => 'upgrade-screen'
  });
}

/**
 * 绑定所有路由事件
 */
function bindRoutes() {
  // 主菜单按钮
  document.getElementById('upgrade-btn')?.addEventListener('click', () => {
    pushUI('upgrade-screen');
  });
  
  document.getElementById('inventory-btn')?.addEventListener('click', () => {
    pushUI('inventory-screen');
  });
  
  document.getElementById('ship-btn')?.addEventListener('click', () => {
    pushUI('ship-screen');
  });
  
  document.getElementById('gacha-btn')?.addEventListener('click', () => {
    pushUI('gacha-screen');
  });
  
  document.getElementById('start-btn')?.addEventListener('click', startGame);
  
  // 返回主菜单
  document.getElementById('back-btn')?.addEventListener('click', () => {
    backToMain();
  });
  
  document.getElementById('ship-back-btn')?.addEventListener('click', () => {
    backToMain();
  });
  
  document.getElementById('gacha-back-btn')?.addEventListener('click', () => {
    backToMain();
  });
  
  // 屏幕间跳转
  document.getElementById('to-ship-btn')?.addEventListener('click', () => {
    pushUI('ship-screen');
  });
  
  document.getElementById('to-upgrade-btn')?.addEventListener('click', () => {
    pushUI('upgrade-screen');
  });
  
  document.getElementById('to-gacha-btn')?.addEventListener('click', () => {
    pushUI('gacha-screen');
  });
  
  document.getElementById('gacha-to-ship-btn')?.addEventListener('click', () => {
    pushUI('ship-screen');
  });
  
  document.getElementById('gacha-to-upgrade-btn')?.addEventListener('click', () => {
    pushUI('upgrade-screen');
  });
  
  // 子屏幕
  document.getElementById('story-entry')?.addEventListener('click', () => {
    pushUI('story-screen');
  });
  
  document.getElementById('story-back-btn')?.addEventListener('click', () => {
    popUI();
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

  // 初始化 UI 管理器
  setupUIManager();

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
