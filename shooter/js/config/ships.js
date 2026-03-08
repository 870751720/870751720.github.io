/**
 * 飞机系统配置数据
 */

// 等级配置
export const RANK_CONFIGS = {
  'C': { name: 'C', color: '#888888', glow: 0, priceMultiplier: 1, maxEnhance: 5 },
  'B': { name: 'B', color: '#4ade80', glow: 10, priceMultiplier: 1.5, maxEnhance: 7 },
  'A': { name: 'A', color: '#60a5fa', glow: 20, priceMultiplier: 2.5, maxEnhance: 10 },
  'SSR': { name: 'SSR', color: '#fbbf24', glow: 30, priceMultiplier: 5, maxEnhance: 15 }
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

// 命座配置
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
    content: `这是天鹰座联邦最基础的量产战机，编号SC-01。\n\n它没有华丽的外表，也没有传奇的历史，但每一个王牌飞行员都是从它开始。\n\n简单、可靠、易于维护——这些特质让它成为训练新手的最佳选择。\n\n有人说，真正的强者不需要依赖机体性能，而是靠自己的技术弥补一切不足。\n\n或许，驾驶这架战机征服裂隙，才是真正的强者之路。`,
    quote: '"从零开始，方见真章。"'
  },
  training: {
    title: '训练机',
    subtitle: 'TR-00 教学型',
    content: `TR-00，俗称"铁罐头"，是所有飞行学员的第一位老师。\n\n它的装甲比标准战机更厚，速度更慢，专为让新手有更多反应时间而设计。\n\n许多老兵至今记得第一次驾驶它时的紧张感——那种笨拙但安心的感觉。\n\n虽然它早已退出一线，但每年仍有成千上万的新学员在它的陪伴下，迈出成为飞行员的第一步。`,
    quote: '"每一次起飞，都是新的开始。"'
  },
  speed: {
    title: '闪电号',
    subtitle: 'LS-88 高速突击型',
    content: `LS-88"闪电号"是边境走私者的最爱。\n\n传闻最初的设计图纸来自一个被查封的黑市工坊，工程师用赛车引擎改造了推进系统。\n\n它的速度令人惊叹，但装甲薄弱也是致命缺陷——就像它的驾驶者一样，追求极致的速度，不惜一切代价。\n\n天鹰座联邦后来收购了设计权，将其改良为军用版本，但保留了那颗狂野的心脏。`,
    quote: '"比风更快，比死亡更险。"'
  },
  guardian: {
    title: '守卫者',
    subtitle: 'GD-42 防御特化型',
    content: `在裂隙的边缘，有一支被称为"铁壁"的驻守部队。\n\n他们驾驶的GD-42"守卫者"是联邦防御科技的结晶，配备了实验性的能量护盾发生器。\n\n每一架守卫者的机身上都刻着一个数字——那是它所保护过的 civilian 运输舰数量。\n\n有人说，驾驶守卫者的飞行员都有一颗守护他人的心，而不是追求个人荣耀。`,
    quote: '"我身后，即是家园。"'
  },
  tank: {
    title: '重装堡垒',
    subtitle: 'HT-99 重型攻击型',
    content: `HT-99是移动的火炮平台，而非传统意义上的"战机"。\n\n它的原型是行星登陆舰，后被改装为支援用重型单位。厚重的装甲让它可以直面敌人的弹幕，而它的火力足以粉碎任何障碍。\n\n但代价是机动性几乎为零——在灵活的敌人面前，它就是一座缓慢移动的靶子。\n\n只有最勇敢（或最疯狂）的飞行员才会选择驾驶它。`,
    quote: '"前进，碾碎一切。"'
  },
  spread: {
    title: '散弹王',
    subtitle: 'SG-77 压制型',
    content: `SG-77的前身是行星采矿用的爆破无人机。\n\n某个天才工程师发现，将爆破用的散弹系统改装到战机上，可以制造出恐怖的压制火力。\n\n它不适合精准射击，但当密集的弹幕覆盖战场时，没有敌人能全身而退。\n\n驾驶它的飞行员通常性格豪爽，喜欢正面硬碰硬——"让敌人在弹雨中跳舞吧！"`,
    quote: '"数量即正义。"'
  },
  sniper: {
    title: '狙击者',
    subtitle: 'SR-66 精准打击型',
    content: `每一架SR-66都有自己的名字，这是传统。\n\n狙击手相信，只有与武器建立羁绊，才能在千里之外取敌首级。这些名字通常来自古代传说中的神射手。\n\n它的弹仓只能容纳一发特制穿甲弹，装填时间漫长，但那一发足以贯穿舰队的旗舰。\n\n在战场上，狙击者是隐形的死神——敌人倒下时，甚至不知道子弹来自何方。`,
    quote: '"一发，一杀。"'
  },
  ghost: {
    title: '幽灵战机',
    subtitle: 'GH-00 实验隐形型',
    content: `GH-00是一个不该存在的项目。\n\n它使用了从裂隙深处回收的外星科技——相位偏移装置，让机体可以短暂地脱离现实空间。\n\n但代价是飞行员会逐渐"迷失"，他们报告说能听到来自虚空的声音，看到不存在的景象。\n\n联邦封存了大部分GH-00，只留下少数经过特殊训练的飞行员驾驶它们。那些飞行员被称为"幽灵"——既是称号，也是命运。`,
    quote: '"我在此处，又不在此处。"'
  },
  phoenix: {
    title: '凤凰号',
    subtitle: 'FX-∞ 涅槃型',
    content: `传说中，不死鸟每五百年会投入火焰中，从灰烬中重生。\n\nFX-∞的原理类似——它搭载了一个微型反应炉，可以在机体损毁的瞬间将飞行员"重构"。\n\n但重构的不是肉体，而是意识。有人认为重生后的飞行员只是原体的复制品，真正的他们已经死去。\n\n无论如何，驾驶凤凰号的人都经历过死亡，他们看待世界的方式，与其他人截然不同。`,
    quote: '"死亡不是终点，而是新的开始。"'
  },
  divine: {
    title: '神谕',
    subtitle: 'DIV-001 原型机',
    content: `它是第一架，也是唯一一架。\n\nDIV-001的建造图纸出现在天鹰座联邦最高机密档案中，但没有任何记录表明是谁设计的。\n\n它融合了所有战机的优点，却没有任何缺点。驾驶它的人报告称，在战斗的高潮时刻，会听到一个声音在指引他们。\n\n有人说那是联邦开发的AI，有人说那是外星意识，还有人说那是"神"在借飞行员之手展现力量。\n\n真相已不可考。唯一确定的是，DIV-001选择自己的驾驶者——而非相反。`,
    quote: '"我被选中，亦被赋予使命。"'
  }
};

// 材料配置
export const MATERIAL_CONFIGS = {
  common: { name: '普通零件', icon: '⚙️', color: '#888888', desc: '普通敌机掉落的零件', tier: 'common', tierName: '普通', stack: 999 },
  rare: { name: '稀有合金', icon: '🔩', color: '#4ade80', desc: '精英敌机掉落的合金', tier: 'rare', tierName: '稀有', stack: 999 },
  epic: { name: '史诗核心', icon: '⚡', color: '#60a5fa', desc: 'Boss掉落的能量核心', tier: 'epic', tierName: '史诗', stack: 999 },
  legendary: { name: '传说碎片', icon: '💎', color: '#fbbf24', desc: '传说中的神秘碎片', tier: 'legendary', tierName: '传说', stack: 999 }
};

// 获取命座材料配置
export function getConstellationMaterialId(shipId) {
  return `constellation_${shipId}`;
}

export function getConstellationMaterialConfig(shipId, shipName, shipColor) {
  return {
    id: getConstellationMaterialId(shipId),
    name: `${shipName}·命星`,
    icon: '⭐',
    color: shipColor,
    desc: `提升${shipName}命座所需的专属材料`,
    tier: 'constellation',
    shipId: shipId,
    stack: 999
  };
}
