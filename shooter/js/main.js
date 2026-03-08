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

/**
 * 屏幕路由配置
 * from: 当前屏幕 (null 表示从任意屏幕)
 * to: 目标屏幕
 * init: 初始化函数
 */
const SCREEN_TRANSITIONS = [
  // 主菜单 -> 其他
  { btn: 'start-btn', from: 'start-screen', to: null, action: startGame },
  { btn: 'upgrade-btn', from: 'start-screen', to: 'upgrade-screen', init: () => { renderHangarUpgrade(); updateHangarCoinDisplay(); } },
  { btn: 'inventory-btn', from: 'start-screen', to: 'inventory-screen', init: renderInventory },
  { btn: 'ship-btn', from: 'start-screen', to: 'ship-screen', init: () => { renderShipShop(); updateShipCoinDisplay(); } },
  { btn: 'gacha-btn', from: 'start-screen', to: 'gacha-screen', init: renderGachaShop },

  // 返回主菜单
  { btn: 'back-btn', from: 'upgrade-screen', to: 'start-screen', init: updateCoinDisplays },
  { btn: 'ship-back-btn', from: 'ship-screen', to: 'start-screen', init: updateCoinDisplays },
  { btn: 'gacha-back-btn', from: 'gacha-screen', to: 'start-screen', init: updateCoinDisplays },

  // 屏幕间跳转
  { btn: 'to-ship-btn', from: 'upgrade-screen', to: 'ship-screen', init: () => { renderShipShop(); updateShipCoinDisplay(); } },
  { btn: 'to-upgrade-btn', from: 'ship-screen', to: 'upgrade-screen', init: () => { renderHangarUpgrade(); updateHangarCoinDisplay(); } },
  { btn: 'to-gacha-btn', from: 'upgrade-screen', to: 'gacha-screen', init: renderGachaShop },
  { btn: 'gacha-to-ship-btn', from: 'gacha-screen', to: 'ship-screen', init: () => { renderShipShop(); updateShipCoinDisplay(); } },
  { btn: 'gacha-to-upgrade-btn', from: 'gacha-screen', to: 'upgrade-screen', init: () => { renderHangarUpgrade(); updateHangarCoinDisplay(); } },

  // 子屏幕
  { btn: 'story-entry', from: 'upgrade-screen', to: 'story-screen', init: renderStoryScreen },
  { btn: 'story-back-btn', from: 'story-screen', to: 'upgrade-screen', init: updateHangarCoinDisplay },
];

/**
 * 切换屏幕
 */
function switchScreen(from, to, onSwitch) {
  if (from) DOM[from]?.classList.add('hidden');
  if (to) DOM[to]?.classList.remove('hidden');
  onSwitch?.();
}

/**
 * 绑定路由事件
 */
function bindRoutes() {
  SCREEN_TRANSITIONS.forEach(({ btn, from, to, init, action }) => {
    const btnEl = document.getElementById(btn);
    if (!btnEl) return;

    btnEl.addEventListener('click', () => {
      if (action) {
        action();
      } else {
        switchScreen(from, to, init);
      }
    });
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
  // 缓存 DOM 引用
  DOM.startScreen = document.getElementById('start-screen');
  DOM.gameCanvas = document.getElementById('game-canvas');
  DOM.gameScore = document.getElementById('game-score');
  DOM.comboDisplay = document.getElementById('combo-display');
  DOM.comboCountEl = DOM.comboDisplay?.querySelector('.combo-count');
  DOM.hpDisplay = document.getElementById('hp-display');
  DOM.buffDisplay = document.getElementById('buff-display');

  // 加载存档
  loadProgress();
  loadShipData();
  loadShipUpgrades();
  loadFavoriteShips();
  updateCoinDisplays();

  // 设置 Canvas
  DOM.gameCanvas.width = window.innerWidth;
  DOM.gameCanvas.height = window.innerHeight;
  setContext(DOM.gameCanvas.getContext('2d'));

  // 绑定事件
  bindRoutes();
  initInputHandlers();
}

// 启动
document.addEventListener('DOMContentLoaded', initGame);
