# QA Report

## Release D 本地视觉与内容升级 QA - 2026-07-01

### 本轮目标

- 本地制作，不部署。
- 首页主菜单重构为“中世纪幻想 + 温暖旅途感 + 清透但有质感 + 轻度冒险氛围”的手绘动态菜单。
- 扩展为三章地图结构，每章 14 行节点，并接入章节 Boss、章节剧情过渡和章节专属遭遇池。
- 扩展主角卡牌与稀有度表现：普通白、稀有蓝、史诗紫、传奇金、绝世红。
- 为主菜单、地图、战斗、Boss、剧情、休息等场景接入程序化中世纪奇幻 BGM。
- 修复新版首页坐标后 QA 脚本的点击错位风险。

### 已完成修改

- `public/assets/handpainted/menu-background-journey.png`：新增手绘旅行主菜单背景，画面包含炼金旅人、篝火、旅途宠物、道路、远方修道院和右侧菜单空间。
- `src/scenes/MainMenuScene.js`：主菜单改用新旅行背景；移除旧骑士叠层；重排标题、叙事文案和按钮；无存档时不再显示空白“继续”按钮。
- `src/data/acts.js` / `src/data/encounters.js` / `src/systems/MapSystem.js`：加入三章结构、章节 Boss、章节文案、14 行地图和章节遭遇池。
- `src/data/enemies.js`：新增第二章、第三章普通敌人、精英和 Boss 数据。
- `src/data/cards.js` / `src/game/constants.js` / `src/art/CardArtFactory.js` / `src/ui/UICard.js`：扩展卡牌和“绝世”稀有度，并把卡牌边框颜色绑定到新稀有度体系。
- `src/game/AudioManager.js`：加入分场景程序化 BGM profile 和竖琴/拨弦式节奏层。
- `src/scenes/MapScene.js` / `src/scenes/BossIntroScene.js` / `src/scenes/ActClearScene.js` / `src/scenes/RewardScene.js` / `src/scenes/EventScene.js` / `src/scenes/ShopScene.js` / `src/scenes/RestScene.js` / `src/scenes/CodexScene.js`：接入章节标题、章节过渡和场景音乐。
- `src/scenes/BattleScene.js`：隐藏底部牌堆后方重复“手牌/提示”静态文字，修复战斗底部 UI 拥挤和视觉错位。
- `src/ui/SceneTransition.js` / `src/scenes/ActClearScene.js`：修复 Phaser Scene 复用时 `transitioning` 未复位导致第二次章节通关无法跳转的问题。
- `scripts/qa-*.mjs` / `qa/*.mjs`：更新新版主菜单坐标；`qa-release-flow` 改为三章制验收；`qa-full-flow` 跳过序章专项，专注基础交互回归。

### 新截图

- 主菜单：`qa/screenshots/product_upgrade/01_menu.png`
- 角色选择：`qa/screenshots/product_upgrade/02_character_select.png`
- 第一章地图：`qa/screenshots/product_upgrade/03_map.png`
- 战斗：`qa/screenshots/product_upgrade/04_battle.png`
- 第二章地图：`qa/screenshots/release/act2_map.png`
- 第三章地图：`qa/screenshots/release/act3_map.png`
- 最终手稿过渡：`qa/screenshots/release/act3_clear.png`
- 胜利结算：`qa/screenshots/release/result_victory.png`

### 已通过验证

- `node --check`：覆盖本轮改动的场景、UI、QA 脚本。
- `pnpm run build`：通过，仅保留 Vite chunk size warning。
- `pnpm run qa:content-schema`：通过，统计为 70 cards / 33 relics / 28 enemies / 15 events / 3 acts，issues 为空。
- `pnpm run qa:asset-manifest`：通过，29 个资源项，issues 为空。
- `pnpm run qa:design-tokens`：通过。
- `pnpm run qa:battle-mechanics`：通过。
- `node qa/click-regression.mjs --url=http://127.0.0.1:4176/`：通过，覆盖 1567x1207、1920x1080、1366x768、1280x720。
- `pnpm run qa:role-matrix -- --url=http://127.0.0.1:4176/`：通过，覆盖骑士、修女、炼金师选择、战斗和卡牌截图。
- `pnpm run qa:release-flow -- --url=http://127.0.0.1:4176/`：通过，31 张截图、30 个步骤，覆盖三章迁移和最终结算。
- `pnpm run qa:full-flow -- --url=http://127.0.0.1:4176/`：通过，31 个步骤。
- `pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/`：通过，13 张产品升级截图。

### 当前自检结论

- 首页已从旧原型菜单转为完整手绘旅行主菜单，视觉方向与“温暖旅途感”一致。
- 三章地图、章节 Boss、章节剧情过渡、章节遭遇池已进入本地可运行路径。
- 战斗底部牌堆区不再出现重复提示文字叠压。
- 发现并修复了一个真实的场景转场复用 bug。
- 当前仍可继续深挖的方向：为第二、第三章敌人/Boss 生成专属透明战斗素材，进一步减少复用敌人帧；继续为事件和剧情页绘制更强手稿演绎插画。

## BattleScene 视觉专项 QA - 2026-06-29

### 旧截图

- 指定路径：`qa/problem_screenshots/battle_scene_current.png`
- 说明：仓库中原本没有 `qa/problem_screenshots/`，已用当前战斗截图 `qa/screenshots/06_battle_start.png` 复制为指定路径，作为本轮修复基准。

### 当前截图问题清单

1. 整体画面仍然像程序员原型，不像成品游戏。
2. 角色和敌人是几何图形拼出来的占位符，太粗糙。
3. 流亡骑士的长枪、盾、身体比例不合理，造型不像骑士战斗立绘。
4. 敌人只是圆形和矩形组合，没有怪物感。
5. 背景过于空、平、暗，像临时色块，不像战斗场景。
6. 远山和树的剪影太粗糙，缺少中世纪场景层次。
7. 顶部状态栏太细、太空，金币文字贴到左边界，布局不稳。
8. 顶部状态栏中金币、回合、遗物信息分布不自然。
9. 玩家区位置太靠左，角色、血条、名字没有形成完整角色面板。
10. 敌人区位置过于居中，敌人与玩家距离和战斗舞台纵深不合理。
11. 敌人意图图标悬浮位置突兀，文字太拥挤。
12. 右侧战斗日志面板过大、过空，像普通文本框，不像游戏 UI。
13. 战斗日志文字缺少层级，重要信息不突出。
14. 结束回合按钮位置孤立，离手牌区和日志区关系不清楚。
15. 手牌区底部面板过大，实际卡牌只占中间一小块，空间浪费。
16. 左下角巨大圆形占位图标意义不明，必须删除或改成明确牌堆 UI。
17. 卡牌整体样式太像临时按钮，不像中世纪羊皮纸卡牌。
18. 卡牌插画区是简单图形，缺少类型区分和质感。
19. 卡牌底部文字被压得太低，部分内容接近卡牌边缘。
20. 手牌排列缺少弧线或层次，像网页卡片横排。
21. 战斗界面缺少明确教程提示，例如点击卡牌使用、请选择目标。
22. 攻击、防御、受击的动画反馈不够明显。
23. UI 金边过亮、背景过暗，前景和背景融合不好。
24. 整体缺少像素游戏的材质感、颗粒感、烛火光效和舞台层次。
25. 窗口缩放后绝对位置可能继续错位，必须用固定 1536x864 坐标体系整理。

### 本轮修复目标

- 只重构 BattleScene、UICard、UIButton、UIPanel、UIHealthBar、战斗特效、canvas 外壳和 QA 截图脚本。
- 不新增玩法内容，不新增大量卡牌、敌人、事件或地图。
- 使用 1536x864 固定游戏坐标和 Phaser Canvas 绘制，不改成 DOM UI，不使用参考图整张做背景。
- 目标新截图：
  - `qa/screenshots/battle_scene_fixed_round_1.png`
  - `qa/screenshots/battle_1536x864.png`
  - `qa/screenshots/battle_1366x768.png`
  - `qa/screenshots/battle_1280x720.png`

### 修复记录

- `BattleScene.js`：按 1536x864 坐标重排顶部状态栏、战斗舞台、右侧日志/提示、结束回合按钮和底部手牌区。
- `BattleScene.js`：用 Phaser Graphics 程序化绘制暮色天空、多层山体、城堡/教堂尖顶剪影、石路泥地、草屑、碎石、暗角和站立基准线。
- `BattleScene.js`：重做流亡骑士、腐烛苦修者、墓园骸髅、黑犬、瘟疫医生和 Boss 的战斗剪影，补充阴影、待机动画、意图图标和对齐的名字/血条。
- `UICard.js`：卡牌改为 132x184，重做暗金边框、羊皮纸底、费用宝珠、类型插画、三行描述和底部类型/稀有度。
- `UIButton.js` / `UIPanel.js` / `UIHealthBar.js` / `UIToast.js` / `UITooltip.js`：统一暗金黑铁 UI 风格，补充 hover/click 声音反馈、disabled 表现、血条平滑刷新和文本边界保护。
- `effects/`：补强斩击、护盾、受击红闪、飘字和回合横幅。
- `SceneHelpers.js`：把通用动态灰烬粒子替换成静态灰烬点，修复 Phaser Canvas 自动化切场景时的 `drawImage` 空纹理错误。
- `qa/capture-battle-screenshots.mjs`：新增 BattleScene 专项截图脚本，支持 round 文件名和 1536/1366/1280 三尺寸截图。
- `qa/capture-screenshots.mjs`：更新结束回合坐标和场景启动等待逻辑，适配新战斗布局。

### 新截图

- 第一轮：`qa/screenshots/battle_scene_fixed_round_1.png`
- 第二轮：`qa/screenshots/battle_scene_fixed_round_2.png`
- 最终轮：`qa/screenshots/battle_scene_fixed_round_3.png`
- 响应式：`qa/screenshots/battle_1536x864.png`
- 响应式：`qa/screenshots/battle_1366x768.png`
- 响应式：`qa/screenshots/battle_1280x720.png`

### 最终验证

- BattleScene 专项截图脚本：通过，报告 `qa/battle-visual-report.json`。
- 多视口点击回归：通过，`qa/click-regression-report.json` 中所有 viewport `ok: true` 且 `errors: []`。
- 全流程 Playwright 截图 QA：通过，`qa/qa-runtime-report.json` 中 `errors: []`。
- `node --check`：已覆盖 `src/**/*.js` 和 `qa/*.mjs`。
- `pnpm run build`：通过，仅保留 Vite chunk size warning。

## 当前验证状态

- `pnpm install`：完成。当前 Windows 环境的 PATH 没有 `npm`，使用 Codex bundled `pnpm` 安装；esbuild 已在 bundled Node PATH 下重建成功。
- `pnpm run dev`：通过，Vite dev server HTTP `200`。
- `pnpm run build`：通过，产物输出到 `dist/`。
- `pnpm run preview`：通过，Vite preview HTTP `200`。
- Playwright Canvas 截图 QA：通过，运行报告 `qa/qa-runtime-report.json` 中 `errors: []`。
- 多视口点击回归：通过，运行报告 `qa/click-regression-report.json` 中所有 viewport `ok: true`。

## 截图位置

截图输出目录：`qa/screenshots/`

## 截图清单

1. `01_main_menu.png`：主菜单
2. `02_guide.png`：旅途指南
3. `03_character_select.png`：角色选择
4. `04_exiled_knight_selected.png`：流亡骑士选中
5. `05_map_initial.png`：地图初始
6. `06_battle_start.png`：普通战斗开始
7. `07_first_battle_tutorial.png`：首次战斗教学
8. `08_card_hover.png`：卡牌 hover
9. `09_card_selected.png`：卡牌选中
10. `10_attack_hit.png`：攻击命中
11. `11_block_effect.png`：防御生效
12. `12_hand_after_card_used.png`：卡牌用掉后手牌区
13. `13_enemy_turn.png`：敌人回合
14. `14_reward.png`：胜利奖励
15. `15_shop.png`：商店
16. `16_event.png`：事件
17. `17_rest.png`：休息
18. `18_chest.png`：宝箱
19. `19_boss_start.png`：Boss 战开始
20. `20_boss_phase_switch.png`：Boss 阶段切换
21. `21_victory_result.png`：胜利结算
22. `22_failure_result.png`：失败结算

## QA 发现并修复的问题

- 依赖安装：esbuild postinstall 子进程找不到 `node`，已通过 bundled Node PATH 重建修复。
- 地图交互：节点 Container 命中不稳定，已增加透明圆形 Phaser 命中层。
- 战斗布局：玩家/敌人血条与手牌区有重叠风险，已整体上移战斗单位。
- 点击错位：按钮、卡牌和敌人目标曾依赖 Phaser Container 自定义 hitArea，在带黑边缩放窗口和 hover 后可能出现命中不稳定；已改为场景顶层透明 Zone 同步世界坐标，按钮改为 pointerdown 触发，敌人目标也使用独立 Zone。
- 奖励与商店卡牌：长描述溢出，已在 `UICard` 中加入动态字号和行距。
- 商店布局：第三张卡与右侧遗物面板重叠，已调整商店列距与右侧商品位置。
- Boss 阶段：阶段切换视觉反馈不够明确，已加入阶段横幅、震屏和低血量光效。
- 结算页：统计文字与最终卡组区域重叠，已调整字号、行距和卡组位置。
- 奖励逻辑：候选遗物不再在奖励页打开前写入存档，避免跳过或刷新造成状态错误。
- 战斗逻辑：战斗开始遗物护甲不再被回合初始化清空。

## 视觉自检结论

- 主菜单、角色选择、地图、战斗和战后页面均为 Phaser Canvas 游戏对象，不是 DOM 卡片页面。
- 截图未发现参考图假 UI、旧按钮、旧卡牌、旧血条或不可交互文字残留。
- 固定 1536 x 864 游戏坐标下截图未发现拉伸和关键 UI 错位。
- 截图未发现内部英文 id 外露。

## 多视口点击回归覆盖

- `1567x1207`：覆盖用户截图中的上下黑边场景，canvas rect 为 `x=0, y=243.78125, width=1567, height=881.4375`。
- `1920x1080`：桌面全屏 16:9。
- `1366x768`：笔记本宽屏。
- `1280x720`：HD 16:9。

每个视口均验证：主菜单开始新旅程、角色选择、地图节点、战斗教程下一步/关闭、攻击牌选中、点击敌人造成伤害。
