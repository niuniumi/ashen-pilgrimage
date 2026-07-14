# 像素视觉资产清单

更新日期：2026-07-14

`v2.0.0-pixel-rebuild` 使用单一像素视觉管线。生产构建只发布 `public/assets/pixel/`、`public/assets/fonts/` 与 `public/assets/audio/`，不再包含旧版手绘、SVG、占位图或生成图集。

## 生产背景

| 文件 | 用途 |
| --- | --- |
| `pixel/backgrounds/menu.png` | 主菜单营火、骑士与远方修道院 |
| `pixel/backgrounds/map.png` | 三章路线地图与桌面陈设 |
| `pixel/backgrounds/folio.png` | 选角、剧情、商店、休息、奖励和结算 |
| `pixel/backgrounds/battle-act-1.png` | 暮鸦村与墓园战斗 |
| `pixel/backgrounds/battle-act-2.png` | 蜡烛修道院战斗 |
| `pixel/backgrounds/battle-act-3.png` | 日蚀王城战斗 |

背景由 OpenAI 图像生成工具按项目美术指导生成，并经过项目内裁切、最近邻过滤和场景适配。

## 角色资产

- 生产目录：`public/assets/pixel/actors/sprites/`，共 32 个直接透明 PNG，包含 3 名主角与覆盖 28 种敌人的语义化资产。
- 独立绑定：除 `graveyard-skeleton` 为兼容旧存档而指向 `grave-skeleton` 外，每个生产敌人 ID 都指向同名 PNG，不再共用程序化图集帧。
- 主角分离：`candle-nun-v2.png` 是手持烛杖的圣烛修女；`ash-veiled-prioress.png` 是四烛冠与圣匣造型，两者使用不同源图。
- 朝向约束：`PixelAssetCatalog.js` 记录每张源图的实际朝向，`PixelActorFactory.js` 仅在敌人需要面向左侧玩家时做水平翻转。
- 运行时：`PixelArtSystem.js` 统一预加载并设置最近邻过滤；资产缺失时才会进入程序化降级造型。

角色主体来自项目生成设定图，经绿幕去底、连通域清理、独立裁切和透明边界修整。乌鸦信使使用 Smithy Games 的 [Crow Sprite](https://smithygames.itch.io/crow-sprite)（CC0 1.0）；瘟疫鼠群使用 OpenGameArt 的 [Forest Animals Sprite Sheet](https://opengameart.org/content/forest-animals-sprite-sheet)（CC0）。仓库内可复现源图和说明位于 `qa/source-art/curated-actors/`。

卡牌、遗物、节点图标、状态条与特效由相关 UI 组件按 4 px 网格实时绘制。
失败结算的 `pixel/ui/defeat-tombstone.png` 由项目墓碑设定图经绿幕透明化、调色板量化和最近邻显示后生成，失败页不再使用绿幕原图或简化几何墓碑。

## 字体

- 字体：Fusion Pixel 10px Monospaced，简体中文子集。
- 文件：`public/assets/fonts/fusion-pixel-10px-zh-hans.woff2`。
- 许可：SIL Open Font License 1.1。
- 完整许可：`public/assets/fonts/FUSION_PIXEL_OFL.txt`。
- 项目主页：https://fusion-pixel-font.takwolf.com/

## 运行时约束

- Phaser `pixelArt` 与 `roundPixels` 保持启用。
- 生产位图统一使用 `FilterMode.NEAREST`。
- 固定格式 UI 使用 4 px 网格、直角双边框和有限色板。
- 所有生产背景和角色位图都由资产审计检查存在性、PNG 尺寸和纹理键唯一性。
- `scripts/qa-asset-manifest.mjs` 检查生产文件；`scripts/qa-actor-roster.mjs` 在真实战斗场景逐个检查 28 种敌人的资产 ID、朝向、非空尺寸和截图。
- `scripts/qa-visual-bindings.mjs` 阻止旧素材重新进入预加载或延迟加载路径。
