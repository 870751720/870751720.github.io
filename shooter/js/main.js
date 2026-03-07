/**
 * 游戏入口文件
 */

import { DOM, setContext, GameState } from './state.js';
import { startGame } from './game.js';
import { InputState } from './state.js';
import { loadProgress, renderUpgradeShop, updateCoinDisplays } from './upgrades.js';
import { loadShipData, renderShipShop, updateShipCoinDisplay, updateMaterialDisplay } from './ships.js';

/**
 * 初始化游戏
 */
function initGame() {
    // 缓存 DOM 引用
    DOM.startScreen = document.getElementById('start-screen');
    DOM.startBtn = document.getElementById('start-btn');
    DOM.gameCanvas = document.getElementById('game-canvas');
    DOM.gameScore = document.getElementById('game-score');
    DOM.comboDisplay = document.getElementById('combo-display');
    DOM.comboCountEl = DOM.comboDisplay.querySelector('.combo-count');
    DOM.hpDisplay = document.getElementById('hp-display');
    DOM.buffDisplay = document.getElementById('buff-display');

    // 加载存档
    loadProgress();
    loadShipData();
    updateCoinDisplays();

    // 设置 Canvas
    DOM.gameCanvas.width = window.innerWidth;
    DOM.gameCanvas.height = window.innerHeight;
    const ctx = DOM.gameCanvas.getContext('2d');
    setContext(ctx);

    // 绑定事件
    DOM.startBtn.addEventListener('click', startGame);

    // 升级菜单按钮
    const upgradeBtn = document.getElementById('upgrade-btn');
    const upgradeScreen = document.getElementById('upgrade-screen');
    const backBtn = document.getElementById('back-btn');
    const toShipBtn = document.getElementById('to-ship-btn');

    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            DOM.startScreen.classList.add('hidden');
            upgradeScreen.classList.remove('hidden');
            renderUpgradeShop();
            updateCoinDisplays();
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            upgradeScreen.classList.add('hidden');
            DOM.startScreen.classList.remove('hidden');
            updateCoinDisplays();
        });
    }

    // 飞机商店
    const shipBtn = document.getElementById('ship-btn');
    const shipScreen = document.getElementById('ship-screen');
    const shipBackBtn = document.getElementById('ship-back-btn');
    const toUpgradeBtn = document.getElementById('to-upgrade-btn');

    if (shipBtn) {
        shipBtn.addEventListener('click', () => {
            DOM.startScreen.classList.add('hidden');
            shipScreen.classList.remove('hidden');
            renderShipShop();
            updateShipCoinDisplay();
            updateMaterialDisplay();
        });
    }

    if (shipBackBtn) {
        shipBackBtn.addEventListener('click', () => {
            shipScreen.classList.add('hidden');
            DOM.startScreen.classList.remove('hidden');
            updateCoinDisplays();
        });
    }

    if (toShipBtn) {
        toShipBtn.addEventListener('click', () => {
            upgradeScreen.classList.add('hidden');
            shipScreen.classList.remove('hidden');
            renderShipShop();
            updateShipCoinDisplay();
        });
    }

    if (toUpgradeBtn) {
        toUpgradeBtn.addEventListener('click', () => {
            shipScreen.classList.add('hidden');
            upgradeScreen.classList.remove('hidden');
            renderUpgradeShop();
            updateCoinDisplays();
        });
    }

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

// 启动
document.addEventListener('DOMContentLoaded', initGame);
