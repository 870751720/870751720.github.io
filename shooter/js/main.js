/**
 * 游戏入口文件
 */

import { DOM, setContext } from './state.js';
import { startGame, gameLoop } from './game.js';
import { InputState } from './state.js';

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
    
    // 设置 Canvas
    DOM.gameCanvas.width = window.innerWidth;
    DOM.gameCanvas.height = window.innerHeight;
    const ctx = DOM.gameCanvas.getContext('2d');
    setContext(ctx);
    
    // 绑定事件
    DOM.startBtn.addEventListener('click', startGame);
    
    window.addEventListener('mousemove', e => {
        InputState.mouseX = e.clientX;
        InputState.mouseY = e.clientY;
    });
    
    window.addEventListener('mousedown', e => {
        if (gameRunning && e.button === 0) {
            InputState.mouseDown = true;
            shoot();
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
