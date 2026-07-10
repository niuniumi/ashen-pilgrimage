# v0.4 美术终 polish 报告

版本：v0.4.0-art-final-polish  
基线：v0.3.0-release-candidate 本地与线上截图、既有 `qa/screenshots/release/*`、`qa/problem_screenshots/battle_scene_current.png`。

## 当前必须承认的问题

1. 主菜单仍然偏空，主视觉和封面感不足。
2. 背景已有层次，但山体、篝火、古堡仍偏程序化，细节不够。
3. 角色选择页三名角色仍有几何拼图感，不够像完成版角色。
4. 流亡骑士、圣烛修女、灰血炼金师职业辨识度和魅力不足。
5. 地图页功能清楚，但羊皮纸、节点、图例仍偏粗糙。
6. 战斗页可玩，但角色、敌人、背景、卡牌、手牌区仍带 Phaser 原型感。
7. 敌人造型不够像怪物，恐怖和中世纪幻想感不足。
8. 卡牌可读，但不像真正的羊皮纸卡牌。
9. 图鉴、商店、事件、休息、宝箱等页面仍需要成品化统一。
10. 动画、转场、音效仍不够“游戏产品级”。
11. 整体和参考气质仍有差距，尤其是人物魅力、材质颗粒、烛火/灰烬氛围。

## 本轮修复方向

1. 建立 `docs/ART_BIBLE.md`，统一配色、字体层级、UI 语言和程序化资产规则。
2. 新增 `src/art/*Factory.js`，将角色、敌人、Boss、图标、背景、卡牌插画抽成可复用程序化美术工厂。
3. 三主角重做为黑甲骑士、圣烛修女、鸟嘴面具炼金师，并在角色选择和战斗中复用。
4. 8 普通敌人、3 精英、1 Boss 统一走敌人工厂，增强轮廓、道具和材质。
5. 主菜单、角色选择、地图、战斗背景统一成暮色天空、远山、古堡/教堂、地面、暗角、灰烬粒子。
6. UI 按钮、面板、血条和卡牌统一黑铁/暗金/羊皮纸风格。

## 截图记录

| 截图 | 用途 | 状态 |
| --- | --- | --- |
| `qa/problem_screenshots/battle_scene_current.png` | 旧战斗原型问题基线 | 已记录 |
| `qa/screenshots/art/menu_final.png` | v0.4 主菜单验收 | 已生成，通过 |
| `qa/screenshots/art/character_select_final.png` | v0.4 角色选择验收 | 已生成，通过 |
| `qa/screenshots/art/map_final.png` | v0.4 地图验收 | 已生成，通过 |
| `qa/screenshots/art/battle_knight_final.png` | v0.4 骑士战斗验收 | 已生成，通过 |
| `qa/screenshots/art/battle_nun_final.png` | v0.4 修女战斗验收 | 已生成，通过 |
| `qa/screenshots/art/battle_alchemist_final.png` | v0.4 炼金师战斗验收 | 已生成，通过 |

## QA 与部署结论

1. `scripts/qa-art-final.mjs` 已生成 29 张 art-final 截图，详见 `docs/QA_ART_FINAL_REPORT.md`。
2. `scripts/qa-release-flow.mjs` 通过，完整主流程未被破坏。
3. `scripts/qa-role-matrix.mjs` 通过，三角色数据、牌组、战斗绑定和机制一致。
4. `pnpm run build` 通过，只有 Vite chunk size 警告。
5. Netlify v0.4 部署完成：`6a42f953706fa4c71d296fac`。
6. `scripts/qa-deploy-smoke.mjs` 通过，线上截图已保存到 `qa/screenshots/deploy_art_final_*.png`。

## 已知剩余问题

1. 当前美术仍是程序化像素资产，不是正式手绘序列帧。
2. Phaser/Vite 单包超过 500 kB，当前 QA 和线上 smoke 未发现加载阻断。
3. 移动端触控和低端设备长局性能仍需下一阶段专项测试。
