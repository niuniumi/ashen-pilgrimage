# v0.5 Final Art Rescue Report

版本：`v0.5.0-final-art-rescue`

## 目标

本轮只做最后一次美术救援：停止扩内容，把 v0.4 中仍像“程序员原型”的角色选择、主场景背景、战斗单位、敌人与核心 UI 改为本地可控 SVG texture 资产。目标是让当前版本达到可分享试玩链接的展示水准，同时诚实记录代码生成美术的上限。

## 已完成

1. 新增 `scripts/generate-final-art-assets.mjs`，生成本地 SVG 资产包。
2. 新增 `public/assets/art/`，包含三名主角 portrait/battle、普通敌人、精英敌人、Boss、主菜单背景、选角背景、战斗背景、地图背景和 UI frame。
3. 新增 `src/art/FinalArtAssets.js`，集中登记 SVG texture key/path/尺寸。
4. `PreloadScene` 统一预加载本地 SVG，不依赖外部服务。
5. `PortraitFactory`、`EnemySpriteFactory`、`BossSpriteFactory`、`BackgroundFactory` 优先使用 SVG texture，旧 Graphics 只作为加载失败兜底。
6. `CharacterSelectScene` 重排三角色卡片，移除英文副标题和英文机制词。
7. 移除 SVG 贴图内的文字，避免敌人名字和 UI 名字重复。
8. 地图、图鉴、首领登场等 UI 文案从 `Boss` 改为“首领”。
9. 版本号升级为 `v0.5.0-final-art-rescue`。

## 资产清单

- `public/assets/art/heroes/*-portrait.svg`
- `public/assets/art/heroes/*-battle.svg`
- `public/assets/art/enemies/*.svg`
- `public/assets/art/bosses/headless-grave-knight.svg`
- `public/assets/art/backgrounds/*-final.svg`
- `public/assets/art/ui/*.svg`

完整说明见 `docs/ART_ASSET_MANIFEST_FINAL.md`。

## QA 结果

本地：

- `pnpm run build`：通过。
- `scripts/qa-final-art-rescue.mjs --url=http://127.0.0.1:4175/`：通过，生成 17 张截图。
- `scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4175/`：通过，三角色矩阵 9 张截图。
- `scripts/qa-release-flow.mjs --url=http://127.0.0.1:4175/`：通过，26 个流程步骤、27 张截图。

线上：

- Netlify deploy：通过。
- `scripts/qa-final-art-rescue.mjs --url=https://ashen-pilgrimage-stage2.netlify.app/ --deploy`：通过，生成 4 张线上复验截图。
- `scripts/qa-deploy-smoke.mjs --url=https://ashen-pilgrimage-stage2.netlify.app/`：通过，确认主菜单、序章、选角、地图、战斗、暂停、修女战斗、炼金师战斗可打开。

关键截图：

- `qa/screenshots/final_art_rescue/menu_after.png`
- `qa/screenshots/final_art_rescue/character_select_after.png`
- `qa/screenshots/final_art_rescue/battle_knight_after.png`
- `qa/screenshots/final_art_rescue/battle_nun_after.png`
- `qa/screenshots/final_art_rescue/battle_alchemist_after.png`
- `qa/screenshots/final_art_rescue/map_after.png`
- `qa/screenshots/final_art_rescue/deploy_menu.png`
- `qa/screenshots/final_art_rescue/deploy_character_select.png`
- `qa/screenshots/final_art_rescue/deploy_battle.png`
- `qa/screenshots/final_art_rescue/deploy_map.png`

## 质量判断

当前版本已经不再使用最初的 Phaser Graphics 几何角色作为主视觉，角色选择、战斗单位和主要背景均改为本地 SVG texture。画面质量明显高于 v0.4，可作为试玩链接展示。

但当前资产仍是代码生成的矢量图，不是专业画师手绘立绘、Aseprite 序列帧或 AI 精修素材。若目标是商业宣传图级别或成熟独立游戏最终美术，仍需要外部美术素材替换：

1. 三名主角正式立绘。
2. 三名主角 idle/attack/defense/hit 序列帧。
3. 敌人和 Boss 序列帧。
4. 手绘卡牌插画。
5. 更完整的场景光影和角色表情细节。

## 部署

- Site：`ashen-pilgrimage-stage2`
- URL：`https://ashen-pilgrimage-stage2.netlify.app/`
- Deploy id：`6a435324415b73a0ca63421e`
- Build id：`6a435323415b73a0ca63421c`
- 状态：ready
