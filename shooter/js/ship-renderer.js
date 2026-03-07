/**
 * 飞机绘制工具 - 可复用的飞机渲染模块
 * 支持静态预览和动态预览两种模式
 */

import { SHIP_CONFIGS } from './ships.js';

// 品级配置
const RANK_CONFIG = {
    'SSR': { weight: 4, label: 'SSR' },
    'A': { weight: 3, label: 'A' },
    'B': { weight: 2, label: 'B' },
    'C': { weight: 1, label: 'C' }
};

/**
 * 在游戏中绘制飞机（直接绘制到游戏画布）
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} x - 中心X坐标
 * @param {number} y - 中心Y坐标
 * @param {number} size - 飞机大小
 * @param {string} rank - 飞机品级
 * @param {string} color - 飞机颜色
 * @param {number} now - 当前时间戳
 * @param {boolean} isMoving - 是否正在移动（影响尾焰）
 */
export function drawGameShip(ctx, x, y, size, rank, color, now, isMoving = false) {
    const s = size;
    
    switch (rank) {
        case 'SSR':
            drawSSRGame(ctx, x, y, s, color, now, isMoving);
            break;
        case 'A':
            drawAGame(ctx, x, y, s, color, now, isMoving);
            break;
        case 'B':
            drawBGame(ctx, x, y, s, color, now, isMoving);
            break;
        case 'C':
        default:
            drawCGame(ctx, x, y, s, color, now, isMoving);
            break;
    }
}

/**
 * 绘制静态飞机预览（用于列表展示）
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} x - 中心X坐标
 * @param {number} y - 中心Y坐标
 * @param {number} size - 飞机大小
 * @param {Object} config - 飞机配置对象
 */
export function drawStaticShip(ctx, x, y, size, config) {
    const rank = config.rank;
    const color = config.color;
    const s = size;

    ctx.save();

    switch (rank) {
        case 'SSR':
            drawSSRStatic(ctx, x, y, s, color);
            break;
        case 'A':
            drawAStatic(ctx, x, y, s, color);
            break;
        case 'B':
            drawBStatic(ctx, x, y, s, color);
            break;
        case 'C':
        default:
            drawCStatic(ctx, x, y, s, color);
            break;
    }

    ctx.restore();
}

/**
 * 绘制动态飞机预览（带动画效果）
 * @param {string} canvasId - Canvas元素ID
 * @param {Object} config - 飞机配置对象
 * @param {Object} options - 可选配置 { animateFloat: boolean, shootBullets: boolean }
 */
export function drawDynamicShip(canvasId, config, options = {}) {
    const { animateFloat = true, shootBullets = true } = options;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const s = 35; // 飞机大小
    const centerX = canvas.width / 2;
    const color = config.color;
    const rank = config.rank;

    let startTime = Date.now();
    let bullets = [];
    let lastBulletTime = 0;

    function animate() {
        if (!document.getElementById(canvasId)) return;

        const now = Date.now();
        const elapsed = now - startTime;

        // 上下浮动效果
        const floatOffset = animateFloat ? Math.sin(elapsed / 500) * 5 : 0;
        const centerY = canvas.height / 2 + floatOffset;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 更新和绘制子弹
        if (shootBullets && now - lastBulletTime > 300) {
            bullets.push({
                x: centerX,
                y: centerY - s,
                speed: 3,
                life: 60
            });
            lastBulletTime = now;
        }

        // 更新子弹
        bullets = bullets.filter(b => {
            b.y -= b.speed;
            b.life--;
            return b.life > 0 && b.y > -10;
        });

        // 绘制子弹
        if (shootBullets) {
            bullets.forEach(b => {
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        }

        // 绘制飞机（使用动态版本）
        drawShipByRank(ctx, centerX, centerY, s, color, rank, now);

        requestAnimationFrame(animate);
    }

    animate();
}

/**
 * 根据品级绘制飞机（支持动态效果）
 */
function drawShipByRank(ctx, x, y, s, color, rank, now = 0) {
    switch (rank) {
        case 'SSR':
            drawSSRDynamic(ctx, x, y, s, color, now);
            break;
        case 'A':
            drawADynamic(ctx, x, y, s, color, now);
            break;
        case 'B':
            drawBDynamic(ctx, x, y, s, color, now);
            break;
        case 'C':
        default:
            drawCDynamic(ctx, x, y, s, color, now);
            break;
    }
}

// ==================== C级飞机 ====================

function drawCStatic(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // 基础三角形
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 尾焰
    ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 10);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawCDynamic(ctx, x, y, s, color, now) {
    drawCStatic(ctx, x, y, s, color);
}

// ==================== B级飞机 ====================

function drawBStatic(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // 双层机身
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.65, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.65, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 内层浅色
    ctx.fillStyle = lightenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.lineTo(x + s * 0.4, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.1);
    ctx.lineTo(x - s * 0.4, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 机翼推进器
    ctx.fillStyle = color;
    ctx.fillRect(x - s * 0.75, y + s * 0.1, s * 0.12, s * 0.35);
    ctx.fillRect(x + s * 0.63, y + s * 0.1, s * 0.12, s * 0.35);

    // 蓝色尾焰
    ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 12);
    ctx.lineTo(x + s * 0.25, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawBDynamic(ctx, x, y, s, color, now) {
    drawBStatic(ctx, x, y, s, color);
}

// ==================== A级飞机 ====================

function drawAStatic(ctx, x, y, s, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // 流线型机身（静态版本去掉能量光环）
    const gradient = ctx.createLinearGradient(x - s * 0.5, y - s, x + s * 0.5, y + s * 0.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 40));
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.5, y + s * 0.1);
    ctx.lineTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.7, y + s * 0.6);
    ctx.lineTo(x - s * 0.5, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#e0f7fa';
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.25, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 紫青色尾焰
    const tailGradient = ctx.createLinearGradient(x, y + s * 0.3, x, y + s * 0.3 + 15);
    tailGradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)');
    tailGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.6)');
    tailGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');

    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 15);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawADynamic(ctx, x, y, s, color, now) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // 能量光环（动态旋转）
    const ringRotation = now / 400;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, ringRotation, ringRotation + Math.PI * 1.5);
    ctx.stroke();

    // 流线型机身
    const gradient = ctx.createLinearGradient(x - s * 0.5, y - s, x + s * 0.5, y + s * 0.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 40));
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.5, y + s * 0.1);
    ctx.lineTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.7, y + s * 0.6);
    ctx.lineTo(x - s * 0.5, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#e0f7fa';
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.25, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 紫青色尾焰（动态）
    const tailGradient = ctx.createLinearGradient(x, y + s * 0.3, x, y + s * 0.3 + 15);
    tailGradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)');
    tailGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.6)');
    tailGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');

    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + 15);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

// ==================== SSR级飞机 ====================

function drawSSRStatic(ctx, x, y, s, color) {
    // 护盾板/翅膀（静态版本去掉双层能量光环）
    ctx.fillStyle = lightenColor(color, 20);
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y);
    ctx.lineTo(x - s * 1.1, y - s * 0.2);
    ctx.lineTo(x - s * 0.9, y + s * 0.15);
    ctx.lineTo(x - s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y);
    ctx.lineTo(x + s * 1.1, y - s * 0.2);
    ctx.lineTo(x + s * 0.9, y + s * 0.15);
    ctx.lineTo(x + s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 主体 - 金属质感
    const metalGradient = ctx.createLinearGradient(x, y - s, x, y + s * 0.5);
    metalGradient.addColorStop(0, '#ffffff');
    metalGradient.addColorStop(0.2, color);
    metalGradient.addColorStop(0.5, lightenColor(color, 30));
    metalGradient.addColorStop(0.8, color);
    metalGradient.addColorStop(1, darkenColor(color, 20));

    ctx.fillStyle = metalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // 彩虹边缘
    const rainbowGradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
    rainbowGradient.addColorStop(0, '#ff0000');
    rainbowGradient.addColorStop(0.17, '#ff8800');
    rainbowGradient.addColorStop(0.33, '#ffff00');
    rainbowGradient.addColorStop(0.5, '#00ff00');
    rainbowGradient.addColorStop(0.67, '#0088ff');
    rainbowGradient.addColorStop(0.83, '#8800ff');
    rainbowGradient.addColorStop(1, '#ff0088');

    ctx.strokeStyle = rainbowGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.stroke();

    // 核心
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 多色尾焰（静态）
    for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * s * 0.12;
        const hue = i * 60;
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
        ctx.beginPath();
        ctx.moveTo(x + offset - s * 0.08, y + s * 0.3);
        ctx.lineTo(x + offset, y + s * 0.3 + 12);
        ctx.lineTo(x + offset + s * 0.08, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

function drawSSRDynamic(ctx, x, y, s, color, now) {
    const rotation = now / 300;

    // 双层能量光环反向旋转
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(now / 200) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // 外环
    ctx.beginPath();
    ctx.arc(x, y, s + 10, rotation, rotation + Math.PI * 2);
    ctx.stroke();

    // 内环反向
    ctx.strokeStyle = `rgba(255, 100, 200, ${0.4 + Math.sin(now / 200 + 1) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, -rotation * 1.5, -rotation * 1.5 + Math.PI * 2);
    ctx.stroke();

    // 护盾板/翅膀展开动画
    const wingOffset = Math.sin(now / 500) * 5;
    ctx.fillStyle = lightenColor(color, 20);
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;

    // 左翼
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y);
    ctx.lineTo(x - s * 1.2, y - s * 0.3 + wingOffset);
    ctx.lineTo(x - s * 1.0, y + s * 0.2);
    ctx.lineTo(x - s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 右翼
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y);
    ctx.lineTo(x + s * 1.2, y - s * 0.3 + wingOffset);
    ctx.lineTo(x + s * 1.0, y + s * 0.2);
    ctx.lineTo(x + s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 主体 - 金属质感多层
    const metalGradient = ctx.createLinearGradient(x, y - s, x, y + s * 0.5);
    metalGradient.addColorStop(0, '#ffffff');
    metalGradient.addColorStop(0.2, color);
    metalGradient.addColorStop(0.5, lightenColor(color, 30));
    metalGradient.addColorStop(0.8, color);
    metalGradient.addColorStop(1, darkenColor(color, 20));

    ctx.fillStyle = metalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // 彩虹边缘
    const rainbowGradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
    rainbowGradient.addColorStop(0, '#ff0000');
    rainbowGradient.addColorStop(0.17, '#ff8800');
    rainbowGradient.addColorStop(0.33, '#ffff00');
    rainbowGradient.addColorStop(0.5, '#00ff00');
    rainbowGradient.addColorStop(0.67, '#0088ff');
    rainbowGradient.addColorStop(0.83, '#8800ff');
    rainbowGradient.addColorStop(1, '#ff0088');

    ctx.strokeStyle = rainbowGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.stroke();

    // 核心
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.1, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 动态多色尾焰
    const baseFlameSize = 20;

    for (let layer = 0; layer < 3; layer++) {
        const layerOffset = (layer - 1) * s * 0.12;
        const layerPhase = now / (200 + layer * 50);
        const flicker = Math.sin(layerPhase) * 0.3 + 0.7;
        const flameLength = baseFlameSize * flicker * (1 - layer * 0.15);
        const flameWidth = s * (0.1 - layer * 0.02);

        const hueShift = (now / 20) % 360;
        const baseHue = layer * 60;

        const fireGradient = ctx.createLinearGradient(
            x + layerOffset, y + s * 0.3,
            x + layerOffset, y + s * 0.3 + flameLength
        );
        fireGradient.addColorStop(0, `hsla(${(baseHue + hueShift) % 360}, 100%, 70%, ${0.9 - layer * 0.2})`);
        fireGradient.addColorStop(0.3, `hsla(${(baseHue + hueShift + 40) % 360}, 100%, 60%, ${0.6 - layer * 0.1})`);
        fireGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = fireGradient;
        ctx.shadowColor = `hsla(${(baseHue + hueShift) % 360}, 100%, 50%, 0.8)`;
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(x + layerOffset - flameWidth, y + s * 0.3);
        ctx.lineTo(x + layerOffset, y + s * 0.3 + flameLength);
        ctx.lineTo(x + layerOffset + flameWidth, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

// ==================== 游戏内绘制函数 ====================

function drawCGame(ctx, x, y, s, color, now, isMoving) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;

    // 基础三角形
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 简单橙色尾焰（动态）
    const flameSize = isMoving ? 12 : 6;
    ctx.fillStyle = `rgba(255, 150, 0, ${0.6 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + flameSize);
    ctx.lineTo(x + s * 0.25, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawBGame(ctx, x, y, s, color, now, isMoving) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // 双层机身
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.65, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 0.65, y + s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 内层浅色
    ctx.fillStyle = lightenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.lineTo(x + s * 0.4, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.1);
    ctx.lineTo(x - s * 0.4, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.2, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 机翼推进器
    ctx.fillStyle = color;
    ctx.fillRect(x - s * 0.8, y + s * 0.1, s * 0.15, s * 0.4);
    ctx.fillRect(x + s * 0.65, y + s * 0.1, s * 0.15, s * 0.4);

    // 蓝色脉动尾焰
    const flameSize = isMoving ? 15 : 8;
    const pulse = Math.sin(now / 150) * 0.2;
    ctx.fillStyle = `rgba(0, 200, 255, ${0.6 + pulse + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + flameSize);
    ctx.lineTo(x + s * 0.3, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawAGame(ctx, x, y, s, color, now, isMoving) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // 能量光环（动态旋转）
    const ringRotation = now / 400;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.8, ringRotation, ringRotation + Math.PI * 1.5);
    ctx.stroke();

    // 流线型机身
    const gradient = ctx.createLinearGradient(x - s * 0.5, y - s, x + s * 0.5, y + s * 0.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 40));
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.5, y + s * 0.1);
    ctx.lineTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.7, y + s * 0.6);
    ctx.lineTo(x - s * 0.5, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#e0f7fa';
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.25, s * 0.25, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 紫青色尾焰
    const flameSize = isMoving ? 18 : 10;
    const tailGradient = ctx.createLinearGradient(x, y + s * 0.3, x, y + s * 0.3 + flameSize);
    tailGradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)');
    tailGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.6)');
    tailGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');

    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.3);
    ctx.lineTo(x, y + s * 0.3 + flameSize);
    ctx.lineTo(x + s * 0.25, y + s * 0.3);
    ctx.closePath();
    ctx.fill();

    // 随机粒子
    if (Math.random() < 0.3) {
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()})`;
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * s * 0.3, y + s * 0.5 + Math.random() * flameSize, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

function drawSSRGame(ctx, x, y, s, color, now, isMoving) {
    const rotation = now / 300;

    // 双层能量光环反向旋转
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(now / 200) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // 外环
    ctx.beginPath();
    ctx.arc(x, y, s + 10, rotation, rotation + Math.PI * 2);
    ctx.stroke();

    // 内环反向
    ctx.strokeStyle = `rgba(255, 100, 200, ${0.4 + Math.sin(now / 200 + 1) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, -rotation * 1.5, -rotation * 1.5 + Math.PI * 2);
    ctx.stroke();

    // 护盾板/翅膀展开动画
    const wingOffset = Math.sin(now / 500) * 5;
    ctx.fillStyle = lightenColor(color, 20);
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;

    // 左翼
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y);
    ctx.lineTo(x - s * 1.2, y - s * 0.3 + wingOffset);
    ctx.lineTo(x - s * 1.0, y + s * 0.2);
    ctx.lineTo(x - s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 右翼
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y);
    ctx.lineTo(x + s * 1.2, y - s * 0.3 + wingOffset);
    ctx.lineTo(x + s * 1.0, y + s * 0.2);
    ctx.lineTo(x + s * 0.2, y + s * 0.1);
    ctx.closePath();
    ctx.fill();

    // 主体
    const metalGradient = ctx.createLinearGradient(x, y - s, x, y + s * 0.5);
    metalGradient.addColorStop(0, '#ffffff');
    metalGradient.addColorStop(0.2, color);
    metalGradient.addColorStop(0.5, lightenColor(color, 30));
    metalGradient.addColorStop(0.8, color);
    metalGradient.addColorStop(1, darkenColor(color, 20));

    ctx.fillStyle = metalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // 彩虹边缘
    const rainbowGradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
    rainbowGradient.addColorStop(0, '#ff0000');
    rainbowGradient.addColorStop(0.17, '#ff8800');
    rainbowGradient.addColorStop(0.33, '#ffff00');
    rainbowGradient.addColorStop(0.5, '#00ff00');
    rainbowGradient.addColorStop(0.67, '#0088ff');
    rainbowGradient.addColorStop(0.83, '#8800ff');
    rainbowGradient.addColorStop(1, '#ff0088');

    ctx.strokeStyle = rainbowGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 0.4, y + s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.5);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.2);
    ctx.closePath();
    ctx.stroke();

    // 核心
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.1, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 动态多色尾焰
    const baseFlameSize = isMoving ? 30 : 20;

    for (let layer = 0; layer < 3; layer++) {
        const layerOffset = (layer - 1) * s * 0.12;
        const layerPhase = now / (200 + layer * 50);
        const flicker = Math.sin(layerPhase) * 0.3 + 0.7;
        const flameLength = baseFlameSize * flicker * (1 - layer * 0.15);
        const flameWidth = s * (0.1 - layer * 0.02);

        const hueShift = (now / 20) % 360;
        const baseHue = layer * 60;

        const fireGradient = ctx.createLinearGradient(
            x + layerOffset, y + s * 0.3,
            x + layerOffset, y + s * 0.3 + flameLength
        );
        fireGradient.addColorStop(0, `hsla(${(baseHue + hueShift) % 360}, 100%, 70%, ${0.9 - layer * 0.2})`);
        fireGradient.addColorStop(0.3, `hsla(${(baseHue + hueShift + 40) % 360}, 100%, 60%, ${0.6 - layer * 0.1})`);
        fireGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = fireGradient;
        ctx.shadowColor = `hsla(${(baseHue + hueShift) % 360}, 100%, 50%, 0.8)`;
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(x + layerOffset - flameWidth, y + s * 0.3);
        ctx.lineTo(x + layerOffset, y + s * 0.3 + flameLength);
        ctx.lineTo(x + layerOffset + flameWidth, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

// ==================== 颜色工具函数 ====================

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
