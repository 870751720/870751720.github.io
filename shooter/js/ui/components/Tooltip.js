/**
 * 通用提示框组件
 * 替代 hangar.js 中的命座提示实现
 */

export class Tooltip {
  constructor(options = {}) {
    this.element = null;
    this.target = null;
    this.content = options.content || '';
    this.position = options.position || 'top'; // top, bottom, left, right
    this.offset = options.offset || 10;
    this.className = options.className || '';
  }

  /**
   * 绑定到目标元素
   */
  attach(target, content) {
    if (content) this.content = content;
    this.target = target;
    
    target.addEventListener('mouseenter', () => this.show());
    target.addEventListener('mouseleave', () => this.hide());
    target.addEventListener('mousemove', (e) => this.updatePosition(e));
    
    return this;
  }

  /**
   * 显示提示框
   */
  show() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = `tooltip ${this.position} ${this.className}`;
      document.body.appendChild(this.element);
    }
    
    this.element.innerHTML = this.content;
    this.element.style.opacity = '1';
    this.updatePosition();
    
    return this;
  }

  /**
   * 隐藏提示框
   */
  hide() {
    if (this.element) {
      this.element.style.opacity = '0';
    }
  }

  /**
   * 更新位置
   */
  updatePosition(event) {
    if (!this.element || !this.target) return;
    
    const rect = this.target.getBoundingClientRect();
    const tooltipRect = this.element.getBoundingClientRect();
    
    let left, top;
    
    switch (this.position) {
      case 'top':
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        top = rect.top - tooltipRect.height - this.offset;
        break;
      case 'bottom':
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        top = rect.bottom + this.offset;
        break;
      case 'left':
        left = rect.left - tooltipRect.width - this.offset;
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        break;
      case 'right':
        left = rect.right + this.offset;
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        break;
      default:
        left = rect.left;
        top = rect.top;
    }
    
    // 边界检查
    left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, left));
    top = Math.max(10, Math.min(window.innerHeight - tooltipRect.height - 10, top));
    
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  /**
   * 销毁
   */
  destroy() {
    this.element?.remove();
    this.element = null;
  }
}

/**
 * 简化版 - 为元素添加提示
 */
export function addTooltip(element, content, options = {}) {
  const tooltip = new Tooltip({ content, ...options });
  return tooltip.attach(element);
}

/**
 * 批量添加提示
 */
export function addTooltips(selector, getContent, options = {}) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    const content = getContent(el);
    if (content) addTooltip(el, content, options);
  });
}
