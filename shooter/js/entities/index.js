/**
 * 实体类统一入口
 * 逐步迁移到独立文件中
 */

// 粒子
export { Particle } from './Particle.js';

// 重新导出原 entities.js 中的类（暂时兼容）
export { Player, Wingman, Bullet, Item, Enemy, Boss } from './entities_legacy.js';
