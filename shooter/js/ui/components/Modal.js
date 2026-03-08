/**
 * 通用弹窗组件
 * 替代各处分散的弹窗实现
 */

export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.className = options.className || '';
    this.showClose = options.showClose !== false;
    this.closeOnOverlay = options.closeOnOverlay !== false;
    this.onClose = options.onClose || null;
    this.onOpen = options.onOpen || null;
    this.element = null;
    this.overlay = null;
  }

  /**
   * 显示弹窗
   */
  show() {
    this.createElement();
    document.body.appendChild(this.element);
    
    // 触发打开回调
    if (this.onOpen) {
      requestAnimationFrame(() => this.onOpen());
    }
    
    return this;
  }

  /**
   * 关闭弹窗
   */
  close() {
    if (!this.element) return;
    
    // 添加关闭动画
    this.element.classList.add('closing');
    
    setTimeout(() => {
      this.element?.remove();
      this.element = null;
      if (this.onClose) this.onClose();
    }, 200);
  }

  /**
   * 更新内容
   */
  update(content) {
    const body = this.element?.querySelector('.modal-body');
    if (body) body.innerHTML = content;
  }

  /**
   * 创建 DOM 元素
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = `modal-overlay ${this.className}`;
    
    const closeBtn = this.showClose ? 
      `<button class="modal-close-btn">×</button>` : '';
    
    this.element.innerHTML = `
      <div class="modal-container">
        ${closeBtn}
        ${this.title ? `<div class="modal-header"><h3>${this.title}</h3></div>` : ''}
        <div class="modal-body">${this.content}</div>
      </div>
    `;
    
    // 绑定事件
    if (this.showClose) {
      this.element.querySelector('.modal-close-btn')?.addEventListener('click', () => this.close());
    }
    
    if (this.closeOnOverlay) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) this.close();
      });
    }
    
    // ESC 关闭
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escHandler);
    
    // 清理
    const originalClose = this.close.bind(this);
    this.close = () => {
      document.removeEventListener('keydown', this.escHandler);
      originalClose();
    };
  }

  /**
   * 静态方法：快速显示确认对话框
   */
  static confirm(message, onConfirm, onCancel) {
    const modal = new Modal({
      title: '确认',
      content: `
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn-secondary modal-btn-cancel">取消</button>
          <button class="btn-primary modal-btn-confirm">确定</button>
        </div>
      `,
      onClose: onCancel
    });
    
    modal.show();
    
    modal.element.querySelector('.modal-btn-confirm')?.addEventListener('click', () => {
      modal.close();
      onConfirm?.();
    });
    
    modal.element.querySelector('.modal-btn-cancel')?.addEventListener('click', () => {
      modal.close();
      onCancel?.();
    });
    
    return modal;
  }

  /**
   * 静态方法：快速显示提示
   */
  static alert(message, onClose) {
    const modal = new Modal({
      title: '提示',
      content: `
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn-primary">确定</button>
        </div>
      `,
      onClose
    });
    
    modal.show();
    modal.element.querySelector('button')?.addEventListener('click', () => modal.close());
    
    return modal;
  }
}

/**
 * 简化版弹窗 - 直接传入 HTML 内容
 */
export function showModal(html, options = {}) {
  const modal = new Modal({
    content: html,
    ...options
  });
  return modal.show();
}
