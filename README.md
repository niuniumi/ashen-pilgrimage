# 灰烬圣途 Ashen Pilgrimage

[在线试玩](https://niuniumi.github.io/ashen-pilgrimage/) | 当前版本 `v2.0.0-pixel-rebuild`

《灰烬圣途》是一款使用 Phaser 3 制作的单机网页 Roguelike 牌组构筑游戏。玩家从三名行者中选择一人，穿过三章共 36 层路线，构筑牌组、承担誓约、处理角色事件，并挑战拥有独立阶段规则的首领。

## 产品特性

- 3 名可玩角色，各自拥有独立资源循环：战势、祷火、灰血。
- 70 张卡牌、24 件正式遗物、28 种敌人、21 个事件和 9 条角色结局。
- 每章 12 层确定性路线；地图、遭遇、洗牌、奖励、宝箱、事件和誓约都可由种子复现。
- 三阶段首领、敌人职能编队、近期遭遇去重和章节难度节奏。
- v4 存档、旧版地图无损迁移、损坏路线自修复、九类场景断点续局和单次结算保护。
- 统一像素美术管线、本地中文像素字体、三章独立战斗场景，以及覆盖 3 名角色、28 种敌人的高精度像素角色图集。
- 8 条专业 CC0 场景 BGM、50 个多样本效果音、统一响度与淡入淡出混音。
- 像素打击停顿、受击爆点、卡牌飞行、首领转阶段和深灰墓园失败结算动效。
- 鼠标与键盘完整操作，并支持关闭动画和独立调节音乐、音效音量。

## AI 辅助开发项目

这是一个明确标注的 AI 辅助开发项目。项目作者负责产品方向、玩法取舍、审美判断、反馈验收和发布决策；OpenAI Codex 用于辅助代码架构、功能实现、内容扩充、测试自动化、素材治理和部署。所有关键改动均通过本地测试、确定性战斗模拟和生产构建验证，而不是以一次性生成结果作为完成标准。

更完整的协作方法、技术难点和质量指标见 [AI 辅助开发案例说明](docs/AI_ASSISTED_CASE_STUDY.md)。

## 操作

- 鼠标：选择路线、卡牌、敌人和按钮。
- `1`-`9`：选择对应手牌。
- `←` / `→`：切换存活目标。
- `Enter` / `Space`：确认目标。
- `E`：结束回合。
- `Esc`：取消当前选牌；未选牌时打开暂停菜单。

## 本地运行

```bash
pnpm install
pnpm run dev
```

生产构建：

```bash
pnpm test
pnpm run build
pnpm run preview
```

## 质量验证

```bash
pnpm test
pnpm run qa:content-schema
pnpm run qa:battle-mechanics
pnpm run qa:simulation
pnpm run qa:asset-manifest
pnpm run qa:visual-bindings
pnpm run qa:resume-stages -- --url=http://127.0.0.1:4173
pnpm run qa:pixel-scenes -- --url=http://127.0.0.1:4173
pnpm run qa:role-matrix -- --url=http://127.0.0.1:4173
pnpm run qa:release-flow -- --url=http://127.0.0.1:4173
pnpm run qa:progression -- --url=http://127.0.0.1:4173
```

主要报告位于 `qa/`。素材与许可证见 [像素资产清单](docs/PIXEL_ASSET_MANIFEST.md) 和 [音频素材清单](docs/AUDIO_ASSET_MANIFEST.md)，版本变更见 [v2.0 发布说明](docs/RELEASE_NOTES_2.0.md)。

## 技术栈

- Phaser 3.90
- Vite 7
- JavaScript ES Modules
- Node Test Runner
- Playwright QA
- GitHub Pages / GitHub Actions
