# 像素视觉资产清单

更新日期：2026-07-12

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

## 角色图集

- 源图：`pixel/actors/gothic-actors-atlas-v1.png`，4 x 4 哥特像素角色图集。
- 切分结果：`pixel/actors/sprites/` 下 16 个透明 PNG，包含三名主角、十种敌人原型和三名首领。
- 映射策略：`PixelActorFactory.js` 将 28 个敌人 ID 映射到相符的生产原型，并以武器、轮廓、色调、缩放和状态动效保持战场辨识度。
- 运行时：`PixelArtSystem.js` 统一预加载并设置最近邻过滤；仅在资产不可用时才启用程序化降级造型。

角色图集同样由 OpenAI 图像生成工具按项目美术指导生成，经过品红幕去底、单元格裁切、透明边界修整和逐场景构图校正。卡牌、遗物、节点图标、状态条与特效由相关 UI 组件按 4 px 网格实时绘制。

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
- 所有生产背景和角色位图都由资产审计检查存在性、最小体积和纹理键唯一性。
- `scripts/qa-asset-manifest.mjs` 检查生产文件；`scripts/qa-visual-bindings.mjs` 阻止旧素材重新进入预加载或延迟加载路径。
