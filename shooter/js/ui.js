/**
 * UI 更新模块
 */

import { PlayerState, GameObjects, DOM } from './state.js';

/**
 * 更新血量显示
 */
export function updateHpDisplay() {
    DOM.hpDisplay.innerHTML = '';
    
    for (let i = 0; i < PlayerState.maxHp; i++) {
        const heart = document.createElement('span');
        heart.style.cssText = 'display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;font-size:20px;';
        heart.textContent = i < PlayerState.hp ? '♥' : '♡';
        DOM.hpDisplay.appendChild(heart);
    }
    
    if (PlayerState.shield > 0) {
        const shield = document.createElement('span');
        shield.style.cssText = 'margin-left:10px;color:#00ffaa;font-size:20px;';
        shield.textContent = `⛨${PlayerState.shield}`;
        DOM.hpDisplay.appendChild(shield);
    }
}

/**
 * 更新 Buff 显示
 */
export function updateBuffDisplay() {
    DOM.buffDisplay.innerHTML = '';
    
    for (const id in GameObjects.activeBuffs) {
        const buff = GameObjects.activeBuffs[id];
        const el = document.createElement('div');
        el.className = 'buff-item';
        el.innerHTML = `
            <span class="buff-icon" style="color:${buff.type.color}">${buff.type.icon}</span>
            <div class="buff-bar"><div class="buff-fill" style="width:${(buff.timeLeft / buff.type.duration) * 100}%"></div></div>
        `;
        DOM.buffDisplay.appendChild(el);
    }
}

/**
 * 更新连击显示
 */
export function updateCombo(gameState, comboTimerRef) {
    const now = performance.now();
    if (now - gameState.lastKillTime < 20000) { // 20秒内连击
        gameState.combo++;
    } else {
        gameState.combo = 1;
    }
    gameState.lastKillTime = now;
    
    DOM.comboCountEl.textContent = gameState.combo;
    DOM.comboDisplay.classList.add('active', 'pop');
    setTimeout(() => DOM.comboDisplay.classList.remove('pop'), 100);
    
    if (comboTimerRef.timer) clearTimeout(comboTimerRef.timer);
    comboTimerRef.timer = setTimeout(() => {
        gameState.combo = 0;
        DOM.comboDisplay.classList.remove('active');
    }, 20000); // 20秒后重置
}

/**
 * 显示浮动文字
 */
export function showFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}
