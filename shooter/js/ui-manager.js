/**
 * UI 管理器 - 统一管理界面切换
 */

import { updateCoinDisplays } from './upgrades.js';

// UI 栈
const uiStack = [];

// 注册的 UI 配置
const uiRegistry = new Map();

// 屏幕元素缓存
const screenElements = new Map();

/**
 * 注册 UI 界面
 * @param {string} id - 界面 ID (如 'upgrade-screen')
 * @param {Object} config - 配置对象
 * @param {Function} config.onOpen - 打开时回调
 * @param {Function} config.onClose - 关闭时回调
 * @param {Function} config.onResume - 从其他界面返回时回调
 * @param {Function} config.onBack - 返回时目标，返回字符串 id 或 null
 */
export function registerUI(id, config = {}) {
  uiRegistry.set(id, {
    onOpen: config.onOpen || (() => {}),
    onClose: config.onClose || (() => {}),
    onResume: config.onResume || (() => {}),
    onBack: config.onBack || (() => null),
    singleton: config.singleton !== false // 默认单例
  });
  
  // 缓存 DOM 元素
  const el = document.getElementById(id);
  if (el) screenElements.set(id, el);
}

/**
 * 获取屏幕元素
 */
function getScreen(id) {
  if (!screenElements.has(id)) {
    const el = document.getElementById(id);
    if (el) screenElements.set(id, el);
  }
  return screenElements.get(id);
}

/**
 * 显示/隐藏屏幕
 */
function setScreenVisible(id, visible) {
  const screen = getScreen(id);
  if (screen) {
    screen.classList.toggle('hidden', !visible);
  }
}

/**
 * 打开新界面（压栈）
 * @param {string} id - 界面 ID
 * @param {Object} params - 传给 onOpen 的参数
 * @returns {boolean} 是否成功
 */
export function pushUI(id, params = {}) {
  const config = uiRegistry.get(id);
  if (!config) {
    console.warn(`UI ${id} 未注册`);
    return false;
  }
  
  // 隐藏当前界面
  if (uiStack.length > 0) {
    const current = uiStack[uiStack.length - 1];
    setScreenVisible(current.id, false);
    
    const currentConfig = uiRegistry.get(current.id);
    if (currentConfig) {
      currentConfig.onClose(params);
    }
  }
  
  // 压栈
  uiStack.push({ id, params });
  
  // 显示新界面
  setScreenVisible(id, true);
  config.onOpen(params);
  
  return true;
}

/**
 * 返回上一级（弹栈）
 * @param {Object} params - 传给上一级 onResume 的参数
 * @returns {boolean} 是否成功
 */
export function popUI(params = {}) {
  if (uiStack.length <= 1) {
    // 只剩主菜单了，不能返回
    return false;
  }
  
  // 获取当前界面
  const current = uiStack.pop();
  const currentConfig = uiRegistry.get(current.id);
  
  // 关闭当前
  setScreenVisible(current.id, false);
  if (currentConfig) {
    const backTarget = currentConfig.onBack(params);
    currentConfig.onClose(params);
    
    // 如果指定了返回目标，直接跳转
    if (backTarget && backTarget !== current.id) {
      // 清空栈到目标
      while (uiStack.length > 0 && uiStack[uiStack.length - 1].id !== backTarget) {
        uiStack.pop();
      }
    }
  }
  
  // 显示上一级
  if (uiStack.length > 0) {
    const prev = uiStack[uiStack.length - 1];
    setScreenVisible(prev.id, true);
    
    const prevConfig = uiRegistry.get(prev.id);
    if (prevConfig) {
      prevConfig.onResume(params);
    }
  }
  
  return true;
}

/**
 * 跳转到指定界面（清空栈）
 * @param {string} id - 目标界面 ID
 * @param {Object} params - 参数
 */
export function gotoUI(id, params = {}) {
  // 关闭所有当前界面
  while (uiStack.length > 0) {
    const current = uiStack.pop();
    setScreenVisible(current.id, false);
    
    const config = uiRegistry.get(current.id);
    if (config) config.onClose(params);
  }
  
  // 打开目标界面
  pushUI(id, params);
}

/**
 * 返回到主菜单
 */
export function backToMain(params = {}) {
  gotoUI('start-screen', params);
  updateCoinDisplays();
}

/**
 * 获取当前界面 ID
 */
export function getCurrentUI() {
  if (uiStack.length === 0) return null;
  return uiStack[uiStack.length - 1].id;
}

/**
 * 获取界面栈深度
 */
export function getUIDepth() {
  return uiStack.length;
}

/**
 * 替换当前界面（不增加栈深度）
 * @param {string} id - 新界面 ID
 * @param {Object} params - 参数
 */
export function replaceUI(id, params = {}) {
  if (uiStack.length === 0) {
    pushUI(id, params);
    return;
  }
  
  // 关闭当前
  const current = uiStack.pop();
  setScreenVisible(current.id, false);
  
  const currentConfig = uiRegistry.get(current.id);
  if (currentConfig) currentConfig.onClose(params);
  
  // 打开新界面
  pushUI(id, params);
}

/**
 * 初始化 UI 管理器
 * 自动注册常见的界面
 */
export function initUIManager() {
  // 预注册所有屏幕
  const screenIds = [
    'start-screen',
    'upgrade-screen', 
    'inventory-screen',
    'ship-screen',
    'gacha-screen',
    'story-screen'
  ];
  
  screenIds.forEach(id => {
    if (document.getElementById(id)) {
      registerUI(id, {
        onBack: () => uiStack.length > 1 ? uiStack[uiStack.length - 2]?.id : 'start-screen'
      });
    }
  });
  
  // 主菜单作为初始界面
  if (!uiStack.includes('start-screen')) {
    uiStack.push({ id: 'start-screen', params: {} });
  }
}
