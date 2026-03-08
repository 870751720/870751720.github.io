# 架构文档 (ARCHITECTURE.md)

## 目录结构

```
shooter/
├── js/
│   ├── core/                    # 核心系统
│   │   ├── state.js            # 全局状态管理 (GameState, PlayerState)
│   │   └── storage.js          # localStorage 封装
│   │
│   ├── config/                  # 配置数据
│   │   └── ships.js            # 飞机/命座/材料配置
│   │
│   ├── entities/                # 游戏实体类
│   │   ├── index.js            # 统一导出
│   │   ├── Player.js           # 玩家实体
│   │   ├── Enemy.js            # 普通敌人
│   │   ├── Boss.js             # Boss 基类
│   │   ├── Bullet.js           # 子弹
│   │   ├── Item.js             # 掉落道具
│   │   ├── Particle.js         # 粒子效果
│   │   └── Wingman.js          # 僚机
│   │
│   ├── bosses.js                # Boss 逻辑和 AI
│   ├── game.js                  # 游戏主循环
│   ├── main.js                  # 入口文件
│   │
│   ├── ships.js                 # 飞机系统逻辑
│   ├── hangar.js                # 机库升级系统
│   ├── inventory.js             # 背包系统
│   ├── gacha.js                 # 扭蛋系统
│   ├── upgrades.js              # 通用升级系统
│   ├── story.js                 # 故事系统
│   │
│   ├── ui-manager.js            # UI 路由管理
│   ├── ui.js                    # UI 工具函数
│   ├── ui/index.js              # UI 组件导出
│   │
│   ├── ship-renderer.js         # 飞机渲染器
│   ├── items.js                 # 道具效果定义
│   └── utils.js                 # 工具函数
│
├── style.css                    # 主样式
├── style-carousel.css           # 轮播组件样式
├── style-inventory.css          # 背包样式
└── index.html                   # 入口 HTML
```

## 核心架构

### 1. 状态管理

**GameState** - 持久化状态（保存到 localStorage）
```javascript
{
  coins: number,           // 金币
  materials: object,       // 材料 {common, rare, epic, legendary, constellation_xxx}
  ownedShips: array,       // 拥有的飞机ID
  currentShip: string,     // 当前使用的飞机
  shipEnhancements: object, // 飞机强化等级
  constellations: object,  // 命座解锁等级
  upgrades: object         // 通用升级
}
```

**PlayerState** - 运行时状态（每局游戏重置）
```javascript
{
  hp: number,
  maxHp: number,
  stats: {
    damage: number,
    fireRate: number,
    multiShot: number,
    bulletSize: number,
    // ...
  }
}
```

### 2. 数据流

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI操作    │───▶│ 更新GameState│───▶│ saveStorage │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  重新渲染UI  │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  applyStats │
                    │ (应用到Player)
                    └─────────────┘
```

### 3. UI 路由系统 (UIManager)

使用栈结构管理界面导航：

```javascript
// 注册界面
registerUI('upgrade-screen', {
  onOpen: (params) => { /* 打开时执行 */ },
  onClose: () => { /* 关闭时执行 */ },
  onBack: () => 'start-screen'  // 指定返回目标
});

// 导航操作
pushUI('ship-screen')           // 打开新界面（压栈）
popUI()                         // 返回上级（弹栈）
gotoUI('start-screen')          // 跳转（清空栈）
backToMain()                    // 返回主菜单
```

**当前界面栈：**
- start-screen（主菜单）
- upgrade-screen（机库升级）
- ship-screen（飞机商店）
- gacha-screen（扭蛋）
- inventory-screen（背包）
- story-screen（故事）

### 4. 模块依赖关系

```
main.js
├── game.js (游戏主循环)
├── ships.js (飞机系统)
│   └── config/ships.js
├── hangar.js (机库)
├── inventory.js (背包)
├── gacha.js (扭蛋)
├── ui-manager.js (UI路由)
└── core/storage.js (存储)
```

### 5. 实体系统

所有游戏实体继承基类：

```javascript
class Entity {
  constructor(x, y)
  update(dt)      // 每帧更新
  draw(ctx)       // 渲染
  destroy()       // 标记销毁
}
```

**实体生命周期：**
1. 创建 → 加入 GameObjects 数组
2. 每帧 update() → 更新位置和状态
3. 超出屏幕/死亡 → destroy() 标记
4. 游戏循环清理 inactive 实体

### 6. 存储系统

统一使用 storage.js 封装 localStorage：

```javascript
import { getStorage, setStorage, updateStorage } from './core/storage.js';

// 读取
const data = getStorage('key');

// 写入
setStorage('key', value);

// 批量更新
updateStorage({ coins: 100, materials: {...} });
```

**存储键名：**
- `shooterProgress` - 游戏进度（金币、升级等）
- `shooterShipData` - 飞机数据（拥有、强化、命座）
- `favoriteShips` - 收藏列表

### 7. 配置文件

**ships.js 配置结构：**
```javascript
SHIP_CONFIGS[]      // 飞机基础配置
CONSTELLATION_CONFIGS  // 命座配置
SHIP_STORIES        // 飞机故事
MATERIAL_CONFIGS    // 材料配置
RANK_CONFIGS        // 等级配置
```

### 8. 渲染系统

**Canvas 分层：**
- 背景层（网格/星空）
- 游戏实体层（玩家、敌人、子弹）
- 粒子效果层
- UI 层（分数、血条）

**渲染优化：**
- 对象池复用（子弹、粒子）
- 超出屏幕标记 inactive
- 碰撞检测使用 AABB

## 性能考虑

1. **避免内存泄漏**
   - 及时清理 inactive 对象
   - 游戏结束重置所有状态

2. **减少重渲染**
   - UI 使用 hidden 控制显示/隐藏
   - 避免频繁操作 DOM

3. **存储优化**
   - 游戏结束时统一保存
   - 避免每帧读写 localStorage
