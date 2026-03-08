/**
 * 统一存储管理模块
 * 替代分散在各处的 localStorage 操作
 */

const STORAGE_KEY = 'shooterProgress';

/**
 * 获取完整存储数据或指定键值
 */
export function getStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return key ? data[key] : data;
  } catch (e) {
    console.error('Storage get error:', e);
    return key ? undefined : {};
  }
}

/**
 * 设置单个键值
 */
export function setStorage(key, value) {
  try {
    const data = getStorage();
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Storage set error:', e);
    return false;
  }
}

/**
 * 批量更新多个键值
 */
export function updateStorage(updates) {
  try {
    const data = { ...getStorage(), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Storage update error:', e);
    return false;
  }
}

/**
 * 删除指定键
 */
export function removeStorage(key) {
  try {
    const data = getStorage();
    delete data[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Storage remove error:', e);
    return false;
  }
}

/**
 * 清空所有数据
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Storage clear error:', e);
    return false;
  }
}
