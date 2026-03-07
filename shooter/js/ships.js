/**
 * 飞机系统 - 不同等级有不同美术表现 + 强化系统
 */

import { PlayerState, GameState } from './state.js';
import { saveProgress } from './upgrades.js';
import { drawDynamicShip } from './ship-renderer.js';

// 等级配置
export const RANK_CONFIGS = {
    'C': { name: 'C', color: '#888888', glow: 0, priceMultiplier: 1, maxEnhance: 5 },
    'B': { name: 'B', color: '#4ade80', glow: 10, priceMultiplier: 1.5, maxEnhance: 7 },
    'A': { name: 'A', color: '#60a5fa', glow: 20, priceMultiplier: 2.5, maxEnhance: 10 },
    'SSR': { name: 'SSR', color: '#fbbf24', glow: 30, priceMultiplier: 5, maxEnhance: 15 }
};

// 命座配置 - 每架飞机的6个命座效果
export const CONSTELLATION_CONFIGS = {
    basic: {
        name: '标准战机',
        constellations: [
            { level: 1, name: '坚固装甲', desc: '初始生命值 +1' },
            { level: 2, name: '精准射击', desc: '子弹伤害 +0.5' },
            { level: 3, name: '快速装填', desc: '射击间隔 -10ms' },
            { level: 4, name: '能量护盾', desc: '初始护盾 +1' },
            { level: 5, name: '火力覆盖', desc: '多发子弹 +1' },
            { level: 6, name: '终极改造', desc: '全属性 +20%' }
        ]
    },
    training: {
        name: '训练机',
        constellations: [
            { level: 1, name: '防护升级', desc: '初始生命值 +2' },
            { level: 2, name: '机动训练', desc: '移动速度 +10%' },
            { level: 3, name: '稳定输出', desc: '子弹伤害 +0.3' },
            { level: 4, name: '紧急修复', desc: '每关回复1点生命' },
            { level: 5, name: '老兵经验', desc: '金币获取 +15%' },
            { level: 6, name: '生存专家', desc: '死亡时保留1点生命' }
        ]
    },
    speed: {
        name: '闪电号',
        constellations: [
            { level: 1, name: '引擎优化', desc: '射速 +15%' },
            { level: 2, name: '轻盈机身', desc: '移动速度 +15%' },
            { level: 3, name: '电能过载', desc: '子弹可穿透1个敌人' },
            { level: 4, name: '雷暴核心', desc: '攻击时有20%几率连锁闪电' },
            { level: 5, name: '极速模式', desc: '生命值低于30%时射速翻倍' },
            { level: 6, name: '雷霆之神', desc: '所有子弹附带电击效果' }
        ]
    },
    guardian: {
        name: '守卫者',
        constellations: [
            { level: 1, name: '护盾充能', desc: '初始护盾 +1' },
            { level: 2, name: '装甲加固', desc: '初始生命值 +2' },
            { level: 3, name: '能量回馈', desc: '护盾破碎时对周围敌人造成伤害' },
            { level: 4, name: '自我修复', desc: '每10秒回复1点护盾' },
            { level: 5, name: '坚不可摧', desc: '受到的伤害降低15%' },
            { level: 6, name: '守护领域', desc: '护盾上限+3，且免疫首次致命伤害' }
        ]
    },
    tank: {
        name: '重装堡垒',
        constellations: [
            { level: 1, name: '超厚装甲', desc: '初始生命值 +3' },
            { level: 2, name: '重型火力', desc: '子弹伤害 +0.5，体积 +10%' },
            { level: 3, name: '穿甲弹', desc: '子弹可穿透2个敌人' },
            { level: 4, name: '堡垒模式', desc: '静止时伤害 +50%' },
            { level: 5, name: '自我修复', desc: '每秒回复0.5生命' },
            { level: 6, name: '移动要塞', desc: '全属性 +30%，体积 -20%' }
        ]
    },
    spread: {
        name: '散弹王',
        constellations: [
            { level: 1, name: '弹丸改良', desc: '散弹数量 +1' },
            { level: 2, name: '散射范围', desc: '散弹角度 +20%' },
            { level: 3, name: '独头弹', desc: '近距离伤害 +50%' },
            { level: 4, name: '燃烧弹', desc: '子弹有30%几率点燃敌人' },
            { level: 5, name: '弹幕压制', desc: '多发子弹 +1' },
            { level: 6, name: '地狱火', desc: '散弹数量 +2，附带燃烧' }
        ]
    },
    sniper: {
        name: '狙击者',
        constellations: [
            { level: 1, name: '加长枪管', desc: '子弹射程 +50%' },
            { level: 2, name: '穿甲弹', desc: '穿透敌人数量 +1' },
            { level: 3, name: '蓄力射击', desc: '按住射击可蓄力，最大伤害 +100%' },
            { level: 4, name: '弱点洞察', desc: '暴击率 +25%' },
            { level: 5, name: '连锁狙击', desc: '击杀敌人后自动锁定下一个目标' },
            { level: 6, name: '神射', desc: '子弹无限穿透，暴击伤害 +100%' }
        ]
    },
    ghost: {
        name: '幽灵战机',
        constellations: [
            { level: 1, name: '相位偏移', desc: '闪避率 +10%' },
            { level: 2, name: '隐形涂层', desc: '敌人瞄准你的时间 +50%' },
            { level: 3, name: '量子护盾', desc: '初始护盾 +2' },
            { level: 4, name: '幽灵步', desc: '闪避后3秒内无敌' },
            { level: 5, name: '死亡标记', desc: '闪避时对攻击者造成反击伤害' },
            { level: 6, name: '虚无', desc: '闪避率 +30%，可穿过敌人' }
        ]
    },
    phoenix: {
        name: '凤凰号',
        constellations: [
            { level: 1, name: '涅槃之火', desc: '复活时回复50%生命' },
            { level: 2, name: '烈焰之翼', desc: '移动时留下火焰轨迹' },
            { level: 3, name: '不死鸟', desc: '复活次数 +1' },
            { level: 4, name: '焚天', desc: '死亡时爆炸，对全屏敌人造成伤害' },
            { level: 5, name: '浴火重生', desc: '复活后10秒内伤害 +100%' },
            { level: 6, name: '永恒', desc: '每场战斗可复活3次，复活后满血' }
        ]
    },
    divine: {
        name: '神谕',
        constellations: [
            { level: 1, name: '神性觉醒', desc: '全属性 +10%' },
            { level: 2, name: '圣光护体', desc: '初始护盾 +2' },
            { level: 3, name: '审判之弹', desc: '子弹自动追踪敌人' },
            { level: 4, name: '神罚', desc: '攻击时有25%几率召唤雷电' },
            { level: 5, name: '不灭', desc: '生命值降至1时获得5秒无敌' },
            { level: 6, name: '神降', desc: '全属性 +50%，所有攻击附带圣光' }
        ]
    }
};

// 飞机故事配置
export const SHIP_STORIES = {
    basic: {
        title: '标准战机',
        subtitle: 'SC-01 通用型',
        content: `
            这是天鹰座联邦最基础的量产战机，编号SC-01。
            
            它没有华丽的外表，也没有传奇的历史，但每一个王牌飞行员都是从它开始。
            
            简单、可靠、易于维护——这些特质让它成为训练新手的最佳选择。
            
            有人说，真正的强者不需要依赖机体性能，而是靠自己的技术弥补一切不足。
            
            或许，驾驶这架战机征服裂隙，才是真正的强者之路。
        `,
        quote: '"从零开始，方见真章。"'
    },
    training: {
        title: '训练机',
        subtitle: 'TR-00 教学型',
        content: `
            TR-00，俗称"铁罐头"，是所有飞行学员的第一位老师。
            
            它的装甲比标准战机更厚，速度更慢，专为让新手有更多反应时间而设计。
            
            许多老兵至今记得第一次驾驶它时的紧张感——那种笨拙但安心的感觉。
            
            虽然它早已退出一线，但每年仍有成千上万的新学员在它的陪伴下，迈出成为飞行员的第一步。
        `,
        quote: '"每一次起飞，都是新的开始。"'
    },
    speed: {
        title: '闪电号',
        subtitle: 'LS-88 高速突击型',
        content: `
            LS-88"闪电号"是边境走私者的最爱。
            
            传闻最初的设计图纸来自一个被查封的黑市工坊，工程师用赛车引擎改造了推进系统。
            
            它的速度令人惊叹，但装甲薄弱也是致命缺陷——就像它的驾驶者一样，追求极致的速度，不惜一切代价。
            
            天鹰座联邦后来收购了设计权，将其改良为军用版本，但保留了那颗狂野的心脏。
        `,
        quote: '"比风更快，比死亡更险。"'
    },
    guardian: {
        title: '守卫者',
        subtitle: 'GD-42 防御特化型',
        content: `
            在裂隙的边缘，有一支被称为"铁壁"的驻守部队。
            
            他们驾驶的GD-42"守卫者"是联邦防御科技的结晶，配备了实验性的能量护盾发生器。
            
            每一架守卫者的机身上都刻着一个数字——那是它所保护过的 civilian 运输舰数量。
            
            有人说，驾驶守卫者的飞行员都有一颗守护他人的心，而不是追求个人荣耀。
        `,
        quote: '"我身后，即是家园。"'
    },
    tank: {
        title: '重装堡垒',
        subtitle: 'HT-99 重型攻击型',
        content: `
            HT-99是移动的火炮平台，而非传统意义上的"战机"。
            
            它的原型是行星登陆舰，后被改装为支援用重型单位。厚重的装甲让它可以直面敌人的弹幕，而它的火力足以粉碎任何障碍。
            
            但代价是机动性几乎为零——在灵活的敌人面前，它就是一座缓慢移动的靶子。
            
            只有最勇敢（或最疯狂）的飞行员才会选择驾驶它。
        `,
        quote: '"前进，碾碎一切。"'
    },
    spread: {
        title: '散弹王',
        subtitle: 'SG-77 压制型',
        content: `
            SG-77的前身是行星采矿用的爆破无人机。
            
            某个天才工程师发现，将爆破用的散弹系统改装到战机上，可以制造出恐怖的压制火力。
            
            它不适合精准射击，但当密集的弹幕覆盖战场时，没有敌人能全身而退。
            
            驾驶它的飞行员通常性格豪爽，喜欢正面硬碰硬——"让敌人在弹雨中跳舞吧！"
        `,
        quote: '"数量即正义。"'
    },
    sniper: {
        title: '狙击者',
        subtitle: 'SR-66 精准打击型',
        content: `
            每一架SR-66都有自己的名字，这是传统。
            
            狙击手相信，只有与武器建立羁绊，才能在千里之外取敌首级。这些名字通常来自古代传说中的神射手。
            
            它的弹仓只能容纳一发特制穿甲弹，装填时间漫长，但那一发足以贯穿舰队的旗舰。
            
            在战场上，狙击者是隐形的死神——敌人倒下时，甚至不知道子弹来自何方。
        `,
        quote: '"一发，一杀。"'
    },
    ghost: {
        title: '幽灵战机',
        subtitle: 'GH-00 实验隐形型',
        content: `
            GH-00是一个不该存在的项目。
            
            它使用了从裂隙深处回收的外星科技——相位偏移装置，让机体可以短暂地脱离现实空间。
            
            但代价是飞行员会逐渐"迷失"，他们报告说能听到来自虚空的声音，看到不存在的景象。
            
            联邦封存了大部分GH-00，只留下少数经过特殊训练的飞行员驾驶它们。那些飞行员被称为"幽灵"——既是称号，也是命运。
        `,
        quote: '"我在此处，又不在此处。"'
    },
    phoenix: {
        title: '凤凰号',
        subtitle: 'FX-∞ 涅槃型',
        content: `
            传说中，不死鸟每五百年会投入火焰中，从灰烬中重生。
            
            FX-∞的原理类似——它搭载了一个微型反应炉，可以在机体损毁的瞬间将飞行员"重构"。
            
            但重构的不是肉体，而是意识。有人认为重生后的飞行员只是原体的复制品，真正的他们已经死去。
            
            无论如何，驾驶凤凰号的人都经历过死亡，他们看待世界的方式，与其他人截然不同。
        `,
        quote: '"死亡不是终点，而是新的开始。"'
    },
    divine: {
        title: '神谕',
        subtitle: 'DIV-001 原型机',
        content: `
            它是第一架，也是唯一一架。
            
            DIV-001的建造图纸出现在天鹰座联邦最高机密档案中，但没有任何记录表明是谁设计的。
            
            它融合了所有战机的优点，却没有任何缺点。驾驶它的人报告称，在战斗的高潮时刻，会听到一个声音在指引他们。
            
            有人说那是联邦开发的AI，有人说那是外星意识，还有人说那是"神"在借飞行员之手展现力量。
            
            真相已不可考。唯一确定的是，DIV-001选择自己的驾驶者——而非相反。
        `,
        quote: '"我被选中，亦被赋予使命。"'
    }
};

// 命座材料配置 - 每个飞机专属
export function getConstellationMaterialId(shipId) {
    return `constellation_${shipId}`;
}

export function getConstellationMaterialConfig(shipId) {
    const ship = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!ship) return null;
    
    return {
        id: getConstellationMaterialId(shipId),
        name: `${ship.name}·命星`,
        icon: '⭐',
        color: ship.color,
        desc: `提升${ship.name}命座所需的专属材料`,
        tier: 'constellation',
        shipId: shipId,
        stack: 999
    };
}

export const MATERIAL_CONFIGS = {
    common: { name: '普通零件', icon: '⚙️', color: '#888888', desc: '普通敌机掉落的零件', tier: 'common', tierName: '普通', stack: 999 },
    rare: { name: '稀有合金', icon: '🔩', color: '#4ade80', desc: '精英敌机掉落的合金', tier: 'rare', tierName: '稀有', stack: 999 },
    epic: { name: '史诗核心', icon: '⚡', color: '#60a5fa', desc: 'Boss掉落的能量核心', tier: 'epic', tierName: '史诗', stack: 999 },
    legendary: { name: '传说碎片', icon: '💎', color: '#fbbf24', desc: '传说中的神秘碎片', tier: 'legendary', tierName: '传说', stack: 999 }
};

// 飞机配置
export const SHIP_CONFIGS = [
    // C级 - 量产型
    {
        id: 'basic',
        name: '标准战机',
        rank: 'C',
        desc: '均衡的入门级战机',
        price: 0,
        color: '#9d8df7',
        stats: { maxHp: 3, damage: 1, fireRate: 150, multiShot: 1, bulletSize: 1 }
    },
    {
        id: 'training',
        name: '训练机',
        rank: 'C',
        desc: '新手练习用机，血量略高',
        price: 100,
        color: '#a8a8a8',
        stats: { maxHp: 4, damage: 0.8, fireRate: 160, multiShot: 1, bulletSize: 1 }
    },
    // B级 - 改装型
    {
        id: 'speed',
        name: '闪电号',
        rank: 'B',
        desc: '改装引擎，射速极快',
        price: 600,
        color: '#00ffff',
        stats: { maxHp: 2, damage: 0.9, fireRate: 75, multiShot: 1, bulletSize: 0.9 }
    },
    {
        id: 'guardian',
        name: '守卫者',
        rank: 'B',
        desc: '强化装甲，初始带护盾',
        price: 750,
        color: '#4ade80',
        stats: { maxHp: 4, damage: 1, fireRate: 160, multiShot: 1, bulletSize: 1, startShield: 1 }
    },
    // A级 - 特装型
    {
        id: 'tank',
        name: '重装堡垒',
        rank: 'A',
        desc: '重装机体，高血高伤',
        price: 1500,
        color: '#ff6b6b',
        stats: { maxHp: 6, damage: 1.5, fireRate: 200, multiShot: 1, bulletSize: 1.5 }
    },
    {
        id: 'spread',
        name: '散弹王',
        rank: 'A',
        desc: '火力覆盖型，3发散弹',
        price: 1800,
        color: '#ffd93d',
        stats: { maxHp: 4, damage: 0.8, fireRate: 170, multiShot: 3, bulletSize: 0.9 }
    },
    {
        id: 'sniper',
        name: '狙击者',
        rank: 'A',
        desc: '远距离精准打击，穿透敌人',
        price: 2000,
        color: '#a855f7',
        stats: { maxHp: 3, damage: 2.5, fireRate: 280, multiShot: 1, bulletSize: 1.8, piercing: true }
    },
    // SSR级 - 传说
    {
        id: 'ghost',
        name: '幽灵战机',
        rank: 'SSR',
        desc: '传说级隐身战机，30%闪避',
        price: 5000,
        color: '#00ff88',
        stats: { maxHp: 4, damage: 1.5, fireRate: 130, multiShot: 1, bulletSize: 1.1, dodgeChance: 0.3, startShield: 2 }
    },
    {
        id: 'phoenix',
        name: '凤凰号',
        rank: 'SSR',
        desc: '不死传说，死亡时复活一次',
        price: 6000,
        color: '#ff4500',
        stats: { maxHp: 5, damage: 1.8, fireRate: 150, multiShot: 2, bulletSize: 1.3, revive: true }
    },
    {
        id: 'divine',
        name: '神谕',
        rank: 'SSR',
        desc: '终极机体，全方位强化',
        price: 8000,
        color: '#ffd700',
        stats: { maxHp: 8, damage: 2, fireRate: 120, multiShot: 3, bulletSize: 1.5, startShield: 2, piercing: true }
    }
];

// 获取飞机强化等级
export function getShipEnhanceLevel(shipId) {
    return (GameState.shipEnhancements || {})[shipId] || 0;
}

// 计算强化属性加成
export function getEnhancedStats(config) {
    const level = getShipEnhanceLevel(config.id);
    const multiplier = 1 + (level * 0.05); // 每级+5%
    
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

// 计算强化消耗
export function getEnhanceCost(config, currentLevel) {
    const rankCfg = RANK_CONFIGS[config.rank];
    const baseMultiplier = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 5 }[config.rank];
    
    // 材料需求
    const materials = {};
    const nextLevel = currentLevel + 1;
    
    // 每级都需要普通材料
    materials.common = 5 * baseMultiplier * nextLevel;
    
    // 3级以上需要稀有材料
    if (nextLevel >= 3) {
        materials.rare = 2 * baseMultiplier * (nextLevel - 2);
    }
    
    // 5级以上需要史诗材料
    if (nextLevel >= 5) {
        materials.epic = 1 * baseMultiplier * (nextLevel - 4);
    }
    
    // 10级以上需要传说材料
    if (nextLevel >= 10) {
        materials.legendary = 1 * (nextLevel - 9);
    }
    
    // 金币需求
    const coins = 50 * baseMultiplier * Math.pow(1.5, currentLevel);
    
    return { materials, coins: Math.floor(coins) };
}

// 强化飞机
export function enhanceShip(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return { success: false, message: '飞机不存在' };
    if (!hasShip(shipId)) return { success: false, message: '未拥有该飞机' };
    
    const currentLevel = getShipEnhanceLevel(shipId);
    const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
    
    if (currentLevel >= maxLevel) {
        return { success: false, message: '已达到最大强化等级' };
    }
    
    const cost = getEnhanceCost(config, currentLevel);
    
    // 检查材料
    const mats = GameState.materials || {};
    for (const [type, need] of Object.entries(cost.materials)) {
        if ((mats[type] || 0) < need) {
            return { success: false, message: `材料不足: ${MATERIAL_CONFIGS[type].name}` };
        }
    }
    
    // 检查金币
    if ((GameState.coins || 0) < cost.coins) {
        return { success: false, message: '金币不足' };
    }
    
    // 扣除材料和金币
    for (const [type, need] of Object.entries(cost.materials)) {
        mats[type] -= need;
    }
    GameState.coins -= cost.coins;
    
    // 升级
    if (!GameState.shipEnhancements) GameState.shipEnhancements = {};
    GameState.shipEnhancements[shipId] = currentLevel + 1;
    
    saveShipData();
    
    return { 
        success: true, 
        message: '强化成功',
        newLevel: currentLevel + 1
    };
}

// 获取等级配置
export function getRankConfig(rank) {
    return RANK_CONFIGS[rank] || RANK_CONFIGS['C'];
}

// 获取已拥有的飞机（去重）
export function getOwnedShips() {
    const ships = GameState.ownedShips || ['basic'];
    // 去重，保留首次出现的顺序
    return [...new Set(ships)];
}

// 获取当前选择的飞机
export function getCurrentShip() {
    return GameState.currentShip || 'basic';
}

// 检查是否拥有某飞机
export function hasShip(shipId) {
    return getOwnedShips().includes(shipId);
}

// 购买飞机
export function buyShip(shipId) {
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return { success: false, message: '飞机不存在' };
    if (hasShip(shipId)) return { success: false, message: '已拥有该飞机' };
    if ((GameState.coins || 0) < config.price) return { success: false, message: '金币不足' };
    
    GameState.coins -= config.price;
    if (!GameState.ownedShips) GameState.ownedShips = ['basic'];
    GameState.ownedShips.push(shipId);
    saveShipData();
    
    return { success: true, message: '购买成功' };
}

// 选择飞机
export function selectShip(shipId) {
    if (!hasShip(shipId)) return false;
    GameState.currentShip = shipId;
    saveShipData();
    return true;
}

// 应用飞机属性
export function applyShipStats() {
    const shipId = getCurrentShip();
    const config = SHIP_CONFIGS.find(s => s.id === shipId);
    if (!config) return;
    
    // 获取强化后的属性
    const enhanced = getEnhancedStats(config);
    
    PlayerState.maxHp = enhanced.maxHp;
    PlayerState.stats.damage = enhanced.damage;
    PlayerState.stats.fireRate = enhanced.fireRate;
    PlayerState.stats.multiShot = enhanced.multiShot;
    PlayerState.stats.bulletSize = enhanced.bulletSize;
    PlayerState.stats.piercing = enhanced.piercing;
    PlayerState.stats.dodgeChance = enhanced.dodgeChance;
    PlayerState.stats.startShield = enhanced.startShield;
    PlayerState.stats.revive = enhanced.revive;
    
    PlayerState.shipColor = config.color;
    PlayerState.shipId = config.id;
    PlayerState.shipRank = config.rank;
    PlayerState.enhanceLevel = getShipEnhanceLevel(shipId);
}

// 保存数据
export function saveShipData() {
    // 保存前先去重
    if (GameState.ownedShips) {
        GameState.ownedShips = [...new Set(GameState.ownedShips)];
    }
    
    const data = JSON.parse(localStorage.getItem('shooterProgress') || '{}');
    data.ownedShips = GameState.ownedShips || ['basic'];
    data.currentShip = GameState.currentShip || 'basic';
    data.coins = GameState.coins || 0;
    data.materials = GameState.materials || { common: 0, rare: 0, epic: 0, legendary: 0 };
    data.shipEnhancements = GameState.shipEnhancements || {};
    data.constellations = GameState.constellations || {};
    localStorage.setItem('shooterProgress', JSON.stringify(data));
}

// 加载数据
export function loadShipData() {
    try {
        const data = JSON.parse(localStorage.getItem('shooterProgress'));
        if (data) {
            GameState.ownedShips = data.ownedShips || ['basic'];
            GameState.currentShip = data.currentShip || 'basic';
            GameState.materials = data.materials || { common: 0, rare: 0, epic: 0, legendary: 0 };
            GameState.shipEnhancements = data.shipEnhancements || {};
            GameState.constellations = data.constellations || {};
        }
    } catch (e) {
        GameState.ownedShips = ['basic'];
        GameState.currentShip = 'basic';
        GameState.materials = { common: 0, rare: 0, epic: 0, legendary: 0 };
        GameState.shipEnhancements = {};
        GameState.constellations = {};
    }
}

// 添加材料
export function addMaterial(type, amount) {
    if (!GameState.materials) GameState.materials = { common: 0, rare: 0, epic: 0, legendary: 0 };
    if (!GameState.materials[type]) GameState.materials[type] = 0;
    GameState.materials[type] += amount;
    saveShipData();
    return amount;
}

// 渲染商店 - 横版轮播
export function renderShipShop() {
    const carousel = document.getElementById('ship-grid');
    if (!carousel) return;
    
    carousel.innerHTML = '';
    
    // 按等级分组
    const groups = { 'SSR': [], 'A': [], 'B': [], 'C': [] };
    SHIP_CONFIGS.forEach(config => {
        if (groups[config.rank]) groups[config.rank].push(config);
    });
    
    const rankOrder = ['C', 'B', 'A', 'SSR'];
    const allShips = [];
    
    // 合并所有飞机 (低等级到高等级从左到右)
    rankOrder.forEach(rank => {
        allShips.push(...groups[rank]);
    });
    
    // 渲染每个飞机卡片
    allShips.forEach((config, index) => {
        const owned = hasShip(config.id);
        const selected = getCurrentShip() === config.id;
        const enhanceLevel = getShipEnhanceLevel(config.id);
        const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
        
        const card = document.createElement('div');
        card.className = `ship-card rank-${config.rank.toLowerCase()} ${owned ? 'owned' : ''} ${selected ? 'selected' : ''}`;
        card.dataset.index = index;
        
        let buttonText, buttonClass, buttonDisabled;
        if (selected) {
            buttonText = '当前使用';
            buttonClass = 'selected';
            buttonDisabled = true;
        } else if (owned) {
            buttonText = '装备';
            buttonClass = 'equip';
            buttonDisabled = false;
        } else {
            buttonText = `💰 ${config.price}`;
            buttonClass = '';
            buttonDisabled = (GameState.coins || 0) < config.price;
        }
        
        // 创建 canvas 预览
        const canvasId = `ship-preview-${config.id}-${Date.now()}`;
        
        card.innerHTML = `
            <div class="card-rank-badge rank-${config.rank.toLowerCase()}">${config.rank}</div>
            <canvas id="${canvasId}" class="card-ship-canvas" width="120" height="120"></canvas>
            <div class="card-info">
                <div class="card-name">${config.name}</div>
                <div class="card-desc">${config.desc}</div>
                <div class="card-stats">
                    <span title="生命值">❤️ ${config.stats.maxHp}</span>
                    <span title="伤害">⚔️ ${config.stats.damage}</span>
                    <span title="射速">⚡ ${(1000/config.stats.fireRate).toFixed(1)}/s</span>
                </div>
            </div>
            <button class="card-btn ${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        
        // 延迟绘制 canvas (等 DOM 插入后)
        requestAnimationFrame(() => {
            drawShipPreview(canvasId, config);
        });
        
        // 点击卡片切换 (如果不是当前激活的卡片)
        card.addEventListener('click', (e) => {
            // 如果点击的是按钮，不触发切换
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            
            const cardIndex = parseInt(card.dataset.index);
            if (cardIndex !== carouselState.currentIndex) {
                goToSlide(cardIndex);
            }
        });
        
        // 装备按钮
        const btn = card.querySelector('.card-btn');
        btn.addEventListener('click', () => {
            if (owned && !selected) {
                selectShip(config.id);
                renderShipShop();
                updateCarousel();
            } else if (!owned) {
                const result = buyShip(config.id);
                if (result.success) {
                    renderShipShop();
                    updateShipCoinDisplay();
                }
            }
        });
        
        // 强化按钮
        const enhanceBtn = card.querySelector('.enhance-btn-small');
        if (enhanceBtn && enhanceLevel < maxLevel) {
            enhanceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEnhanceModal(config);
            });
        }
        
        carousel.appendChild(card);
    });
    
    // 只在首次进入商店时，跳转到未购买的最低等级飞机
    if (!carouselState.initialized) {
        const rankWeight = { 'C': 1, 'B': 2, 'A': 3, 'SSR': 4 };
        let targetIndex = 0;
        let minRankWeight = Infinity;
        
        allShips.forEach((config, index) => {
            if (!hasShip(config.id)) {
                const weight = rankWeight[config.rank];
                if (weight < minRankWeight) {
                    minRankWeight = weight;
                    targetIndex = index;
                }
            }
        });
        
        carouselState.currentIndex = targetIndex;
        carouselState.initialized = true;
    }

    // 初始化轮播
    initCarousel();
}

// 轮播状态
let carouselState = {
    currentIndex: 0,
    cardWidth: 320,
    gap: 20,
    isDragging: false,
    startX: 0,
    startIndex: 0,
    dragOffset: 0,
    initialized: false  // 是否已初始化默认位置
};

// 初始化轮播
function initCarousel() {
    const carousel = document.getElementById('ship-grid');
    const dots = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('ship-prev');
    const nextBtn = document.getElementById('ship-next');
    
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.ship-card');
    const totalCards = cards.length;
    
    // 创建指示点
    if (dots) {
        dots.innerHTML = '';
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === carouselState.currentIndex ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(i));
            dots.appendChild(dot);
        }
    }
    
    // 按钮事件
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
            updateCarousel();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
            updateCarousel();
        });
    }
    
    // 触摸/鼠标拖动
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('touchstart', startDrag, { passive: true });
    
    carousel.addEventListener('mousemove', onDrag);
    carousel.addEventListener('touchmove', onDrag, { passive: true });
    
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('touchend', endDrag);
    carousel.addEventListener('mouseleave', endDrag);
    
    // 滚轮滑动
    carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0 || e.deltaX > 0) {
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
        } else {
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
        }
        updateCarousel();
    }, { passive: false });
    
    updateCarousel();
}

function startDrag(e) {
    const carousel = document.getElementById('ship-grid');
    carouselState.isDragging = true;
    carouselState.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    carouselState.startIndex = carouselState.currentIndex;
    carouselState.dragOffset = 0;
    carousel.style.cursor = 'grabbing';
}

function onDrag(e) {
    if (!carouselState.isDragging) return;
    e.preventDefault();
    
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const diff = carouselState.startX - x;
    carouselState.dragOffset = diff;
    
    // 增加阈值到120像素，降低拖动速度
    if (Math.abs(diff) > 120) {
        const carousel = document.getElementById('ship-grid');
        const cards = carousel.querySelectorAll('.ship-card');
        const totalCards = cards.length;
        
        if (diff > 0) {
            // 向左拖动，显示下一个
            carouselState.currentIndex = Math.min(totalCards - 1, carouselState.currentIndex + 1);
        } else {
            // 向右拖动，显示上一个
            carouselState.currentIndex = Math.max(0, carouselState.currentIndex - 1);
        }
        
        // 重置起始位置，避免连续触发
        carouselState.startX = x;
        updateCarousel();
    }
}

function endDrag() {
    const carousel = document.getElementById('ship-grid');
    carouselState.isDragging = false;
    carousel.style.cursor = 'grab';
}

function goToSlide(index) {
    const carousel = document.getElementById('ship-grid');
    const cards = carousel.querySelectorAll('.ship-card');
    carouselState.currentIndex = Math.max(0, Math.min(cards.length - 1, index));
    updateCarousel();
}

function updateCarousel() {
    const carousel = document.getElementById('ship-grid');
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.ship-card');
    const dots = document.getElementById('carousel-dots');
    
    cards.forEach((card, index) => {
        const offset = index - carouselState.currentIndex;
        const absOffset = Math.abs(offset);
        
        // 位置计算
        const translateX = offset * (carouselState.cardWidth + carouselState.gap);
        const scale = absOffset === 0 ? 1 : 0.85;
        const opacity = absOffset > 2 ? 0 : (absOffset === 0 ? 1 : 0.6);
        const zIndex = 100 - absOffset;
        
        card.style.transform = `translateX(${translateX}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
        card.classList.toggle('active', index === carouselState.currentIndex);
    });
    
    // 更新指示点
    if (dots) {
        const dotElements = dots.querySelectorAll('.carousel-dot');
        dotElements.forEach((dot, index) => {
            dot.classList.toggle('active', index === carouselState.currentIndex);
        });
    }
}

// 显示强化弹窗
function showEnhanceModal(config) {
    const level = getShipEnhanceLevel(config.id);
    const maxLevel = RANK_CONFIGS[config.rank].maxEnhance;
    const cost = getEnhanceCost(config, level);
    const mats = GameState.materials || {};
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'enhance-modal';
    
    // 材料列表
    let materialsHtml = '';
    for (const [type, need] of Object.entries(cost.materials)) {
        const cfg = MATERIAL_CONFIGS[type];
        const have = mats[type] || 0;
        const enough = have >= need;
        materialsHtml += `
            <div class="material-item ${enough ? 'enough' : 'not-enough'}">
                <span class="material-icon" style="color: ${cfg.color}">${cfg.icon}</span>
                <span class="material-name">${cfg.name}</span>
                <span class="material-need">${have}/${need}</span>
            </div>
        `;
    }
    
    // 强化后属性预览
    const currentStats = getEnhancedStats(config);
    const nextStats = (() => {
        // 模拟+1级
        GameState.shipEnhancements[config.id] = level + 1;
        const stats = getEnhancedStats(config);
        delete GameState.shipEnhancements[config.id];
        if (level > 0) GameState.shipEnhancements[config.id] = level;
        return stats;
    })();
    
    modal.innerHTML = `
        <div class="enhance-modal-content">
            <h3>${config.name} 强化</h3>
            <div class="enhance-current">当前等级: +${level} / ${maxLevel}</div>
            
            <div class="enhance-stats-compare">
                <div class="stats-column">
                    <div class="stats-title">当前</div>
                    <div>❤️ ${currentStats.maxHp}</div>
                    <div>⚔️ ${currentStats.damage.toFixed(1)}</div>
                    <div>⚡ ${(1000/currentStats.fireRate).toFixed(1)}/s</div>
                </div>
                <div class="stats-arrow">→</div>
                <div class="stats-column next">
                    <div class="stats-title">+${level + 1}</div>
                    <div>❤️ ${nextStats.maxHp}</div>
                    <div>⚔️ ${nextStats.damage.toFixed(1)}</div>
                    <div>⚡ ${(1000/nextStats.fireRate).toFixed(1)}/s</div>
                </div>
            </div>
            
            <div class="enhance-materials">
                <div class="materials-title">强化材料</div>
                ${materialsHtml}
            </div>
            
            <div class="enhance-coin-cost">
                💰 ${cost.coins}
            </div>
            
            <div class="enhance-buttons">
                <button class="cancel-btn">取消</button>
                <button class="confirm-btn ${GameState.coins < cost.coins ? 'disabled' : ''}">强化</button>
            </div>
        </div>
    `;
    
    // 关闭弹窗
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    // 确认强化
    const confirmBtn = modal.querySelector('.confirm-btn');
    confirmBtn.addEventListener('click', () => {
        const result = enhanceShip(config.id);
        if (result.success) {
            modal.remove();
            renderShipShop();
            updateShipCoinDisplay();
            updateMaterialDisplay();
        } else {
            confirmBtn.textContent = result.message;
            confirmBtn.classList.add('error');
            setTimeout(() => {
                confirmBtn.textContent = '强化';
                confirmBtn.classList.remove('error');
            }, 1500);
        }
    });
    
    document.body.appendChild(modal);
}

// 更新金币显示
export function updateShipCoinDisplay() {
    ['menu-coin-display', 'upgrade-coin-display', 'ship-coin-display'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = GameState.coins || 0;
    });
}

// 更新材料显示
export function updateMaterialDisplay() {
    const container = document.getElementById('material-display');
    if (!container) return;
    
    const mats = GameState.materials || {};
    container.innerHTML = `
        <div class="material-count" title="${MATERIAL_CONFIGS.common.name}">
            <span style="color: ${MATERIAL_CONFIGS.common.color}">⚙️</span> ${mats.common || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.rare.name}">
            <span style="color: ${MATERIAL_CONFIGS.rare.color}">🔩</span> ${mats.rare || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.epic.name}">
            <span style="color: ${MATERIAL_CONFIGS.epic.color}">⚡</span> ${mats.epic || 0}
        </div>
        <div class="material-count" title="${MATERIAL_CONFIGS.legendary.name}">
            <span style="color: ${MATERIAL_CONFIGS.legendary.color}">💎</span> ${mats.legendary || 0}
        </div>
    `;
}

// 在 canvas 上绘制飞机预览（使用可复用模块）
function drawShipPreview(canvasId, config) {
    drawDynamicShip(canvasId, config, { animateFloat: true, shootBullets: true });
}
