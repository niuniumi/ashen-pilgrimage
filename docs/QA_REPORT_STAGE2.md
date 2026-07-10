# QA Report Stage 2

## Scope

本轮只做 Phaser Canvas 视觉、布局、交互和 QA 打磨，不新增大量卡牌、敌人、地图或 DOM UI。

## Problems Recorded

1. 第一阶段后局部场景仍有“程序员原型”感，主菜单以外的场景缺少统一美术语言。
2. 地图、图鉴、奖励、商店、事件、休息、宝箱、结算页仍偏普通面板堆叠。
3. 全场景暂停入口不完整，战斗暂停时需要阻断卡牌、敌人和结束回合输入。
4. 战斗选中攻击牌后，目标可点区域缺少足够明确的视觉提示。
5. 多窗口截图和点击回归需要使用 1536x864 游戏坐标换算，避免浏览器缩放下点击错位。
6. Stage 2 要求的截图资产尚未集中生成。

## Fixes Applied

1. 新增统一视觉基础：`Theme`、`UIFrame`、`UIOrnament`、`UIIcon`、`AmbientParticles`、`UICharacterArt`、`PauseMenu`。
2. 重构主菜单和角色选择页为中世纪暮色营地与角色卡展示。
3. 重构地图为羊皮纸路线图，节点使用稳定投影坐标并记录 `nodeViews` 供 QA 使用。
4. 战斗场景接入暂停菜单、设置入口、暂停输入阻断、攻击目标描边与更细音效接口。
5. 图鉴改成分类、列表、详情三栏结构，卡牌、遗物、敌人均使用程序化预览。
6. 奖励、商店、事件、休息、宝箱、结算页统一为黑铁/羊皮纸/烛火视觉框架。
7. 新增 `qa/capture-stage2-screenshots.mjs`，覆盖 Stage 2 所需主流程、暂停菜单、图鉴、节点场景、结算和响应式截图。

## Screenshots To Verify

- `qa/screenshots/menu_polished.png`
- `qa/screenshots/character_select_polished.png`
- `qa/screenshots/map_polished.png`
- `qa/screenshots/battle_polished.png`
- `qa/screenshots/battle_card_selected.png`
- `qa/screenshots/battle_attack_animation.png`
- `qa/screenshots/battle_pause_menu.png`
- `qa/screenshots/pause_battle.png`
- `qa/screenshots/pause_settings.png`
- `qa/screenshots/pause_confirm_return_menu.png`
- `qa/screenshots/codex_polished_cards.png`
- `qa/screenshots/codex_polished_relics.png`
- `qa/screenshots/codex_polished_enemies.png`
- `qa/screenshots/reward_polished.png`
- `qa/screenshots/shop_polished.png`
- `qa/screenshots/event_polished.png`
- `qa/screenshots/rest_polished.png`
- `qa/screenshots/chest_polished.png`
- `qa/screenshots/result_victory.png`
- `qa/screenshots/result_defeat.png`
- `qa/screenshots/stage2_1536x864.png`
- `qa/screenshots/stage2_1366x768.png`
- `qa/screenshots/stage2_1280x720.png`

## Verification Log

- Passed: `pnpm run build`
  - Result: success
  - Note: Vite reports the expected Phaser bundle-size warning only.
- Passed: `node qa/capture-stage2-screenshots.mjs`
  - Report: `qa/stage2-visual-report.json`
  - Errors: `[]`
- Passed: `node qa/capture-battle-screenshots.mjs`
  - Report: `qa/battle-visual-report.json`
  - Errors: `[]`
- Passed: `node qa/click-regression.mjs`
  - Report: `qa/click-regression-report.json`
  - Viewports: `1567x1207`, `1920x1080`, `1366x768`, `1280x720`
  - Result: all `ok: true`
- Manual visual inspection:
  - Fixed map first-node label being too close to the parchment bottom edge.
  - Fixed long card description wrapping so text no longer runs into the card type strip.
  - Fixed result screen final deck text overflow with manual line breaks.
- Passed: Netlify deploy
  - Site: `https://ashen-pilgrimage-stage2.netlify.app/`
  - Deploy ID: `6a4256c404e12f29a637b98e`
  - Netlify state: `ready`
  - Live browser smoke test: canvas found, `MainMenuScene` active, console errors `[]`
