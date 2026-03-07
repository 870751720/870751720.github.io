/**
 * 游戏配置常量
 */

/** 道具类型定义 */
export const ITEM_TYPES = [
    // 临时 Buff（持续一定时间）
    { id: 'rapid', name: '疾速射击', color: '#00ff00', duration: 50000, icon: '⚡' },
    { id: 'slow', name: '时间缓速', color: '#00ffff', duration: 40000, icon: '❄' },
    { id: 'double', name: '分数翻倍', color: '#ffd700', duration: 80000, icon: '×2' },
    { id: 'homing', name: '追踪弹', color: '#ff8800', duration: 45000, icon: '➤' },
    
    // 永久升级
    { id: 'spread', name: '散弹枪', color: '#ff6600', duration: 0, icon: '✦', permanent: true },
    { id: 'big', name: '巨型子弹', color: '#ff00ff', duration: 0, icon: '●', permanent: true },
    { id: 'perm_spd', name: '永久攻速+', color: '#ffffff', duration: 0, icon: '↑⚡', permanent: true },
    { id: 'perm_dmg', name: '永久伤害+', color: '#ff4444', duration: 0, icon: '↑✦', permanent: true },
    { id: 'wingman', name: '僚机', color: '#00aaff', duration: 0, icon: '✈', permanent: true },
    { id: 'maxhp', name: '生命上限+', color: '#ff8888', duration: 0, icon: '↑♥', permanent: true },
    
    // 即时效果
    { id: 'shield', name: '护盾', color: '#00ffaa', duration: 0, icon: '⛨', instant: true },
    { id: 'heal', name: '回血', color: '#ff5555', duration: 0, icon: '♥', instant: true }
];

/** 敌人类型 */
export const ENEMY_TYPES = ['basic', 'fast', 'tank', 'shooter', 'splitter'];

/** Boss 类型列表 */
export const BOSS_TYPES = ['Destroyer', 'FrostGiant', 'LightningRider', 'MechSpider', 'ShadowAssassin', 'ChaosEye'];

/** 游戏颜色配置 */
export const COLORS = {
    background: '#1a1a2e',
    player: '#9d8df7',
    wingman: '#00aaff',
    bullet: '#ffffff',
    enemyBullet: '#ff6666'
};

/** 敌人配置 */
export const ENEMY_CONFIGS = {
    basic: { size: 24, vx: 0, vy: 1.5, color: '#e87e7e', hp: 2 },
    fast: { size: 18, vx: 'random', vy: 3.5, color: '#ffff00', hp: 1 },
    tank: { size: 40, vx: 0, vy: 0.6, color: '#666666', hp: 8 },
    shooter: { size: 28, vx: 0, vy: 1, color: '#4ade80', hp: 3 },
    splitter: { size: 22, vx: 0, vy: 2, color: '#ff00ff', hp: 2 }
};
