# 像素视觉资产清单

更新日期：2026-07-14（v2.2 左向战斗资产重建）

`v2.0.0-pixel-rebuild` 使用单一像素视觉管线。生产构建只发布 `public/assets/pixel/`、`public/assets/fonts/` 与 `public/assets/audio/`，不再包含旧版手绘、SVG、占位图或生成图集。

## 生产背景

| 文件 | 用途 |
| --- | --- |
| `pixel/backgrounds/menu.webp` | 主菜单营火、骑士与远方修道院 |
| `pixel/backgrounds/map.webp` | 三章路线地图与桌面陈设 |
| `pixel/backgrounds/folio.webp` | 选角、剧情、商店、休息、奖励和结算 |
| `pixel/backgrounds/battle-act-1.webp` | 暮鸦村与墓园战斗 |
| `pixel/backgrounds/battle-act-2.webp` | 蜡烛修道院战斗 |
| `pixel/backgrounds/battle-act-3.webp` | 日蚀王城战斗 |

背景由 OpenAI 图像生成工具按项目美术指导生成，并经过项目内裁切、最近邻过滤和场景适配。

## 角色资产

- 生产目录：`public/assets/pixel/actors/sprites/`，运行时绑定 3 名主角与 28 种敌人的语义化无损 WebP。
- PNG master 目录：`qa/source-art/runtime-masters/assets/pixel/`，不参与 Vite 发布。
- 独立绑定：除 `graveyard-skeleton` 为兼容旧存档而指向 `grave-skeleton` 外，每个生产敌人 ID 都指向独立 WebP，不再共用程序化图集帧。
- 主角统一：三名主角来自同一张 v3 生成设定板，使用一致的像素密度、轮廓、光源、站高与右向战斗姿态。圣烛修女只持单支烛杖，不使用头顶烛冠。
- 敌我分离：`ash-veiled-prioress-v3.png` 保留四烛冠与圣匣，是独立敌方造型，不再与圣烛修女共用视觉语言。
- 朝向约束：所有主角生产源 PNG 朝右，所有 28 种敌人生产源 PNG 朝左。`PixelActorFactory.js` 不需要在正常生产路径临时翻转角色来修补朝向。
- 敌人重建：24 种敌人（23 种人形与乌鸦信使）使用明确左向的 v3 生成资产；黑犬、无冠猎犬、经文蛾群保持已验证的左向或无方向资产；瘟疫鼠群使用重新生成的三鼠左向组合。
- 运行时：`PixelArtSystem.js` 统一预加载并设置最近邻过滤；资产缺失时才会进入程序化降级造型。

角色主体来自项目生成设定图，经色键去底、连通域清理、独立裁切和透明边界修整。v3 生产乌鸦与瘟疫鼠群均为项目生成资产；旧 CC0 源图只保留作来源追溯，不再进入生产绑定。可复现源图与说明位于 `qa/source-art/curated-actors/` 和 `qa/source-art/generated-enemies-v3/`。

卡牌、遗物、节点图标、状态条与特效由相关 UI 组件按 4 px 网格实时绘制。
失败结算的 `pixel/ui/defeat-tombstone.webp` 由项目墓碑设定图经绿幕透明化、调色板量化、无损 WebP 转换和最近邻显示后生成，失败页不再使用绿幕原图或简化几何墓碑。
其可复现 master 固定保存在 `qa/source-art/runtime-masters/assets/pixel/ui/defeat-tombstone.png`，不复制到 `public/` 运行时目录。

## Master 重建工作流

以下生成器只把当前 catalog 对应 PNG 写入 `qa/source-art/runtime-masters/`；混合脚本仍将非 catalog 历史文件保留在原 public 路径。每次生成后必须立即刷新并验证提交的运行时 WebP：

```bash
python scripts/build-left-facing-enemy-v3.py
pnpm assets:runtime

python scripts/build-curated-actor-assets.py
pnpm assets:runtime

python scripts/normalize-enemy-facing.py
pnpm assets:runtime

python scripts/build-defeat-tombstone.py
pnpm assets:runtime
```

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
- 所有生产背景和角色位图都由资产审计检查 VP8L 容器、master 尺寸、alpha、可见 RGBA 像素和纹理键唯一性。
- `scripts/qa-asset-manifest.mjs` 检查生产文件；`scripts/qa-actor-roster.mjs` 在真实战斗场景逐个检查 28 种敌人的资产 ID、朝向、非空尺寸和截图。
- `scripts/qa-responsive-facing.mjs` 在 1150×768 与 1171×731 两种问题视口检查选角默认状态、画布边界、主角右向、鼠群左向与教程面板边界。
- `scripts/qa-visual-bindings.mjs` 阻止旧素材重新进入预加载或延迟加载路径。
