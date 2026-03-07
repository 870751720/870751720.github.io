/**
 * 工具函数
 */

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

/**
 * 碰撞检测（AABB）
 */
export function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.size + b.size) / 2 &&
           Math.abs(a.y - b.y) < (a.size + b.size) / 2;
}

/**
 * 角度归一化到 [-PI, PI]
 */
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

/**
 * 生成随机数
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 生成随机整数
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 限制数值范围
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
