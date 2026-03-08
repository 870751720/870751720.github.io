# API 文档 (API.md)

## UIManager (ui-manager.js)

UI 路由管理，使用栈结构管理界面导航。

### registerUI(id, config)

注册一个 UI 界面。

```javascript
registerUI('upgrade-screen', {
  onOpen: (params) => { /* 打开时执行 */ },
  onClose: () => { /* 关闭时执行 */ },
  onResume: () => { /* 返回时执行 */ },
  onBack: () => 'start-screen'  // 返回目标
});
```

### pushUI(id, params)

打开新界面（压栈）。

```javascript
pushUI('ship-screen');
pushUI('upgrade-screen', { shipId: 'ghost', tab: 'constellation' });
```

### popUI(params)

返回上级界面（弹栈）。

```javascript
popUI();
```

### gotoUI(id, params)

跳转到指定界面（清空栈）。

```javascript
gotoUI('start-screen');
gotoUI('upgrade-screen', { shipId: 'phoenix' });
```

### backToMain()

返回主菜单。

```javascript
backToMain();
```

---

## ships.js (飞机系统)

### 数据查询

#### getCurrentShip()

获取当前使用的飞机 ID。

```javascript
const shipId = getCurrentShip(); // 'basic'
```

#### getOwnedShips()

获取拥有的飞机列表。

```javascript
const ships = getOwnedShips(); // ['basic', 'speed', 'ghost']
```

#### hasShip(shipId)

检查是否拥有指定飞机。

```javascript
const owned = hasShip('ghost'); // true/false
```

#### getShipEnhanceLevel(shipId)

获取飞机强化等级。

```javascript
const level = getShipEnhanceLevel('ghost'); // 0-15
```

#### getConstellationLevel(shipId)

获取命座解锁等级。

```javascript
const level = getConstellationLevel('ghost'); // 0-6
```

### 数据修改

#### setCurrentShip(shipId)

设置当前使用的飞机。

```javascript
await setCurrentShip('ghost');
```

**返回：** `{ success: boolean, message: string }`

#### buyShip(shipId)

购买飞机。

```javascript
const result = await buyShip('ghost');
// { success: true, message: '购买成功', ship: {...} }
```

#### enhanceShip(shipId)

强化飞机。

```javascript
const result = enhanceShip('ghost');
// { success: true, message: '强化成功', newLevel: 3 }
```

### 属性应用

#### applyShipStats(shipId)

将飞机属性应用到 PlayerState（游戏开始时调用）。

```javascript
applyShipStats('ghost');
```

#### getEnhancedStats(config)

获取强化后的属性（包含强化加成）。

```javascript
const stats = getEnhancedStats(SHIP_CONFIGS[0]);
// { maxHp, damage, fireRate, ... }
```

### 材料相关

#### getConstellationMaterialId(shipId)

获取命星材料 ID。

```javascript
const id = getConstellationMaterialId('ghost'); // 'constellation_ghost'
```

#### getConstellationMaterialConfig(shipId, name, color)

获取命星材料配置。

```javascript
const config = getConstellationMaterialConfig('ghost', '幽灵战机', '#00ff88');
// { id, name, icon, color, desc, tier, stack }
```

#### addMaterial(type, amount)

添加材料。

```javascript
addMaterial('common', 5);
addMaterial('constellation_ghost', 1);
```

### UI 渲染

#### renderShipShop()

渲染飞机商店。

```javascript
renderShipShop();
```

#### updateShipCoinDisplay()

更新商店金币显示。

```javascript
updateShipCoinDisplay();
```

---

## hangar.js (机库系统)

#### renderHangarUpgrade()

渲染机库升级界面。

```javascript
renderHangarUpgrade();
```

#### setSelectedUpgradeShip(shipId)

设置当前选中的飞机。

```javascript
setSelectedUpgradeShip('ghost');
```

#### setCurrentHangarTab(tab)

设置当前标签页。

```javascript
setCurrentHangarTab('enhance');      // 强化
setCurrentHangarTab('constellation'); // 命座
setCurrentHangarTab('story');         // 故事
```

#### updateHangarCoinDisplay()

更新机库金币显示。

```javascript
updateHangarCoinDisplay();
```

#### toggleFavoriteShip(shipId)

切换收藏状态。

```javascript
const isFav = toggleFavoriteShip('ghost'); // true/false
```

#### isFavoriteShip(shipId)

检查是否收藏。

```javascript
const isFav = isFavoriteShip('ghost');
```

---

## inventory.js (背包系统)

#### renderInventory()

渲染背包界面。

```javascript
renderInventory();
```

---

## gacha.js (扭蛋系统)

#### doGacha(isTen)

执行抽卡。

```javascript
const result = doGacha(false); // 单抽
const result = doGacha(true);  // 十连

// {
//   success: true,
//   results: [
//     { type: 'ship', rank: 'SSR', name: '幽灵战机', ... },
//     { type: 'material', materialType: 'epic', amount: 3 }
//   ]
// }
```

#### renderGachaShop()

渲染扭蛋商店界面。

```javascript
renderGachaShop();
```

---

## upgrades.js (升级系统)

#### loadProgress()

加载游戏进度。

```javascript
loadProgress();
```

#### saveProgress()

保存游戏进度。

```javascript
saveProgress();
```

#### applyUpgrades()

应用升级效果到 PlayerState。

```javascript
applyUpgrades();
```

#### updateCoinDisplays()

更新所有界面金币显示。

```javascript
updateCoinDisplays();
```

---

## core/storage.js (存储系统)

#### getStorage(key)

读取存储。

```javascript
const coins = getStorage('coins');
const allData = getStorage(); // 读取全部
```

#### setStorage(key, value)

写入存储。

```javascript
setStorage('coins', 1000);
```

#### updateStorage(updates)

批量更新。

```javascript
updateStorage({
  coins: 1000,
  materials: { common: 10 }
});
```

---

## 常量配置

### RANK_CONFIGS

等级配置。

```javascript
RANK_CONFIGS['SSR']
// { name, color, glow, priceMultiplier, maxEnhance }
```

### SHIP_CONFIGS

飞机配置数组。

```javascript
SHIP_CONFIGS.find(s => s.id === 'ghost')
// { id, name, rank, desc, price, color, stats: {...} }
```

### MATERIAL_CONFIGS

材料配置。

```javascript
MATERIAL_CONFIGS['epic']
// { name, icon, color, desc, tier, stack }
```

### CONSTELLATION_CONFIGS

命座配置。

```javascript
CONSTELLATION_CONFIGS['ghost']
// { name, constellations: [{level, name, desc}, ...] }
```
