# 代码优化建议报告

## 项目概览
- 总代码量：~9,600 行
- JS 文件：16 个 (~4,800 行)
- CSS 文件：7 个 (~3,100 行)
- HTML：1 个 (111 行)

---

## 一、文件结构优化

### 1.1 拆分大文件

**当前问题：**
- `ships.js` (1056行) - 包含配置、数据、逻辑
- `hangar.js` (674行) - 渲染、事件、状态管理混杂
- `entities.js` (945行) - 所有实体类在一个文件

**建议拆分：**

```
js/
├── core/                    # 核心系统
│   ├── state.js            # 状态管理（保持不变）
│   ├── eventBus.js         # 新增：事件总线
│   └── storage.js          # 新增：统一存储管理
│
├── config/                  # 配置数据
│   ├── ships/
│   │   ├── index.js        # ships.js 的入口
│   │   ├── configs.js      # SHIP_CONFIGS 配置
│   │   ├── constellations.js  # CONSTELLATION_CONFIGS
│   │   ├── stories.js      # SHIP_STORIES
│   │   └── materials.js    # MATERIAL_CONFIGS
│   ├── ranks.js            # RANK_CONFIGS
│   └── gacha.js            # GACHA_CONFIG, GACHA_POOLS
│
├── entities/                # 实体类
│   ├── index.js            # 统一导出
│   ├── Player.js           # 玩家实体
│   ├── Enemy.js            # 基础敌人
│   ├── Bullet.js           # 子弹
│   ├── Item.js             # 道具
│   ├── Particle.js         # 粒子效果
│   └── bosses/
│       ├── index.js        # 统一导出
│       ├── Destroyer.js
│       ├── FrostGiant.js
│       └── ...
│
├── systems/                 # 游戏系统
│   ├── game/
│   │   ├── loop.js         # gameLoop
│   │   ├── collision.js    # 碰撞检测
│   │   └── spawner.js      # 敌人生成
│   ├── hangar/
│   │   ├── index.js        # 主入口
│   │   ├── render.js       # 渲染逻辑
│   │   ├── events.js       # 事件绑定
│   │   ├── tabs/
│   │   │   ├── enhance.js  # 强化标签
│   │   │   ├── constellation.js  # 命座标签
│   │   │   └── story.js    # 故事标签
│   │   └── tooltip.js      # 提示框
│   ├── inventory.js        # 背包系统
│   ├── gacha.js            # 抽卡系统
│   └── upgrades.js         # 升级系统
│
├── ui/                      # UI 组件
│   ├── components/
│   │   ├── Modal.js        # 弹窗组件
│   │   ├── Carousel.js     # 轮播组件
│   │   └── ShipCard.js     # 飞机卡片
│   └── screens/
│       ├── mainMenu.js     # 主菜单
│       ├── hangar.js       # 机库界面
│       └── shop.js         # 商店界面
│
├── utils/                   # 工具函数
│   ├── index.js            # 统一导出
│   ├── canvas.js           # Canvas 工具
│   ├── math.js             # 数学工具
│   └── dom.js              # DOM 工具
│
├── renderer/                # 渲染器
│   ├── ship.js             # ship-renderer.js
│   └── effects.js          # 特效渲染
│
└── main.js                  # 入口文件
```

---

## 二、代码逻辑优化

### 2.1 统一存储管理

**当前问题：**
localStorage 操作分散在各文件：
- `upgrades.js` - loadProgress, saveProgress
- `ships.js` - saveShipData
- `hangar.js` - saveShipUpgrades, saveFavoriteShips

**建议：** 统一存储系统

```javascript
// core/storage.js
const STORAGE_KEY = 'shooterProgress';

export const Storage = {
  get(key) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return key ? data[key] : data;
  },
  
  set(key, value) {
    const data = this.get();
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  update(updates) {
    const data = { ...this.get(), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

// 使用方式
Storage.set('coins', GameState.coins);
Storage.update({ shipUpgrades, favoriteShips });
```

### 2.2 事件系统解耦

**当前问题：**
各模块直接调用渲染函数，耦合严重：
```javascript
// gacha.js
import { renderHangarUpgrade } from './hangar.js';
// 直接调用其他模块的渲染函数
```

**建议：** 引入事件总线

```javascript
// core/eventBus.js
export const EventBus = {
  events: {},
  
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  
  emit(event, data) {
    (this.events[event] || []).forEach(cb => cb(data));
  }
};

// 使用方式
// gacha.js
EventBus.emit('coins:changed', { amount: 100 });

// hangar.js
EventBus.on('coins:changed', ({ amount }) => {
  updateHangarCoinDisplay();
});
```

### 2.3 组件化 UI

**当前问题：**
HTML 字符串拼接分散在各处，难以维护。

**建议：** 基础组件封装

```javascript
// ui/components/Modal.js
export class Modal {
  constructor(options) {
    this.title = options.title;
    this.content = options.content;
    this.onClose = options.onClose;
    this.element = null;
  }
  
  show() {
    this.element = document.createElement('div');
    this.element.className = 'modal';
    this.element.innerHTML = `
      <div class="modal-content">
        <h3>${this.title}</h3>
        <div class="modal-body">${this.content}</div>
        <button class="modal-close">关闭</button>
      </div>
    `;
    
    this.element.querySelector('.modal-close').onclick = () => this.close();
    document.body.appendChild(this.element);
  }
  
  close() {
    this.element?.remove();
    this.onClose?.();
  }
}

// 使用
const modal = new Modal({
  title: '抽卡结果',
  content: createResultHtml(results),
  onClose: () => updateUI()
});
modal.show();
```

---

## 三、CSS 优化

### 3.1 合并样式文件

**当前：** 7 个 CSS 文件，存在重复定义

**建议：** 合并为 3 个

```
styles/
├── base.css          # 基础样式 + 变量
├── components.css    # 组件样式（按钮、卡片、弹窗）
└── screens.css       # 页面级样式（机库、商店等）
```

### 3.2 CSS 变量统一管理

```css
/* styles/variables.css */
:root {
  /* 颜色 */
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-accent: #9d8df7;
  --color-gold: #ffd700;
  
  /* 品级颜色 */
  --rank-ssr: #fbbf24;
  --rank-a: #60a5fa;
  --rank-b: #4ade80;
  --rank-c: #888888;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.3);
}
```

---

## 四、具体文件优化建议

### 4.1 main.js (216行)

**问题：** 事件绑定过于冗长

**优化：**
```javascript
// 使用配置驱动
const SCREEN_ROUTES = {
  'upgrade-btn': { screen: 'upgrade-screen', init: renderHangarUpgrade },
  'ship-btn': { screen: 'ship-screen', init: renderShipShop },
  'gacha-btn': { screen: 'gacha-screen', init: renderGachaShop },
  // ...
};

Object.entries(SCREEN_ROUTES).forEach(([btnId, route]) => {
  document.getElementById(btnId)?.addEventListener('click', () => {
    switchScreen(route.screen);
    route.init?.();
  });
});
```

### 4.2 hangar.js (674行)

**问题：**
1. 渲染逻辑和事件处理混在一起
2. 三个标签页代码重复
3. 工具提示逻辑内嵌

**优化：**
- 按标签页拆分为独立模块
- 提取通用列表渲染逻辑
- 工具提示提取为独立组件

### 4.3 ships.js (1056行)

**问题：**
1. 配置数据过大，占用文件前 200+ 行
2. 数据、配置、逻辑混杂

**优化：**
- 配置数据移至 JSON 文件或独立 config 目录
- 纯数据（SHIP_CONFIGS）可改为异步加载
- 保留操作函数（getOwnedShips, setCurrentShip 等）

### 4.4 entities.js (945行)

**问题：** 所有实体类在一个文件

**优化：**
- 每个类独立文件
- 提取基类 Entity
- 统一更新和绘制接口

```javascript
// entities/base/Entity.js
export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }
  
  update(dt) { /* 子类重写 */ }
  draw(ctx) { /* 子类重写 */ }
  destroy() { this.active = false; }
}

// entities/Player.js
export class Player extends Entity {
  // 只包含 Player 特有逻辑
}
```

---

## 五、优先级建议

### 高优先级（立即收益）
1. ✅ 统一 storage 管理 - 消除重复代码
2. ✅ main.js 路由优化 - 减少样板代码
3. ✅ 拆分 entities.js - 改善维护性

### 中优先级（中期收益）
1. 拆分 ships.js 配置数据
2. 组件化 Modal、Tooltip 等通用 UI
3. 合并 CSS 文件

### 低优先级（长期收益）
1. 引入事件总线完全解耦
2. 完整的组件化架构
3. 单元测试覆盖

---

## 六、重构步骤建议

**第一阶段（保守）：**
1. 提取 storage.js，替换现有 localStorage 操作
2. 优化 main.js 的事件绑定
3. 提取重复的工具函数

**第二阶段（模块化）：**
1. 拆分 entities.js
2. 拆分 ships.js 的配置数据
3. 创建 ui/components 目录

**第三阶段（架构优化）：**
1. 引入事件总线
2. 完全组件化
3. CSS 重构

---

*报告生成时间：2026-03-08*
