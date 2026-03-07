/**
 * 道具系统
 */

import { PlayerState, GameObjects } from './state.js';
import { showFloatingText, updateHpDisplay, updateBuffDisplay } from './ui.js';
import { Particle, Wingman } from './entities.js';

/**
 * 处理即时道具
 */
function handleInstantItem(type, item) {
    if (type.id === 'heal' && PlayerState.hp < PlayerState.maxHp) {
        PlayerState.hp++;
        updateHpDisplay();
        showFloatingText(item.x, item.y, '+♥', '#ff5555');
    } else if (type.id === 'shield') {
        PlayerState.shield++;
        updateHpDisplay();
        showFloatingText(item.x, item.y, '+⛨护盾', '#00ffaa');
    }
}

/**
 * 处理永久升级道具
 */
function handlePermanentItem(type, item) {
    const stats = PlayerState.stats;
    const effects = {
        spread: () => { stats.multiShot = 3; return '永久散弹!'; },
        big: () => { stats.bulletSizeBuff = 2.5; return '永久巨弹!'; },
        perm_spd: () => { stats.fireRate = Math.max(50, stats.fireRate - 10); return '攻速+!'; },
        perm_dmg: () => { stats.damage++; return '伤害+!'; },
        wingman: () => { 
            stats.wingmanCount++; 
            updateWingmen(); 
            return '+僚机!'; 
        },
        maxhp: () => { 
            PlayerState.maxHp++; 
            PlayerState.hp++; 
            updateHpDisplay(); 
            return '生命上限+1'; 
        }
    };
    
    const text = effects[type.id]();
    showFloatingText(item.x, item.y, text, type.color);
}

/**
 * 处理临时 Buff 道具
 */
function handleTemporaryBuff(type, item) {
    if (GameObjects.activeBuffs[type.id]) {
        GameObjects.activeBuffs[type.id].timeLeft += type.duration;
    } else {
        GameObjects.activeBuffs[type.id] = { timeLeft: type.duration, type };
    }
    showFloatingText(item.x, item.y, type.name, type.color);
    updateBuffDisplay();
}

/**
 * 收集道具
 */
export function collectItem(item) {
    const type = item.type;
    
    if (type.instant) {
        handleInstantItem(type, item);
    } else if (type.permanent) {
        handlePermanentItem(type, item);
    } else {
        handleTemporaryBuff(type, item);
    }
    
    item.active = false;
    for (let i = 0; i < 6; i++) {
        GameObjects.particles.push(new Particle(item.x, item.y, type.color));
    }
}

/**
 * 更新僚机
 */
export function updateWingmen() {
    GameObjects.wingmen = [];
    for (let i = 0; i < PlayerState.stats.wingmanCount; i++) {
        GameObjects.wingmen.push(new Wingman(i, PlayerState.stats.wingmanCount));
    }
}

/**
 * 更新 Buffs
 */
export function updateBuffs(dt) {
    let changed = false;
    
    // 重置临时属性
    PlayerState.stats.magnetRange = 0;
    PlayerState.stats.scoreMultiplier = 1;
    PlayerState.stats.homing = false;
    
    for (const id in GameObjects.activeBuffs) {
        const buff = GameObjects.activeBuffs[id];
        buff.timeLeft -= dt * 1000;
        
        if (buff.timeLeft <= 0) {
            delete GameObjects.activeBuffs[id];
            changed = true;
        } else {
            switch(id) {
                case 'rapid': PlayerState.stats.fireRate = 75; break;
                case 'spread': PlayerState.stats.multiShot = 3; break;
                case 'big': PlayerState.stats.bulletSizeBuff = 2.5; break;
                case 'double': PlayerState.stats.scoreMultiplier = 2; break;
                case 'homing': PlayerState.stats.homing = true; break;
                case 'magnet': PlayerState.stats.magnetRange = 200; break;
            }
        }
    }
    
    if (changed) updateBuffDisplay();
}

/**
 * 生成道具
 */
export function spawnItem(x, y, Item) {
    GameObjects.items.push(new Item(x, y));
}
