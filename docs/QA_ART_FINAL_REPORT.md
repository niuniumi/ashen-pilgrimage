# v0.4 Art Final QA Report

版本：v0.4.0-art-final-polish
测试地址：http://127.0.0.1:4173
生成时间：2026-06-29T22:56:35.913Z

## 结论

BattleScene 和全页面 art-final 截图生成通过，未发现白屏、控制台错误或截图流程阻断。

## 截图验收表

| 截图路径 | 页面 | 原问题 | 本轮修改 | 是否仍像原型 | 是否有错位 | 是否有文字裁切 | 是否有英文 id | 是否通过 | 下一轮修复动作 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `qa/screenshots/art/menu_final.png` | 主菜单 | 主菜单偏空，缺少真正主视觉。 | 接入多层暮色天空、云、远山、古堡/教堂、篝火、烛光、灰烬粒子与统一菜单面板。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/prologue_final.png` | 序章 | 剧情演出像系统提示。 | 保留逐字剧情与灰烬氛围，纳入 v0.4 统一 UI 复验。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/character_select_final.png` | 角色选择 | 三角色像几何拼图，职业辨识度不足。 | 三角色共用新 PortraitFactory，卡面与背景统一中世纪幻想风。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/hero_knight_portrait.png` | 流亡骑士立绘 | 角色立绘缺少职业魅力，像程序化占位图。 | 重做职业轮廓、武器/道具、披风/烛光/药剂、阴影和高光。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/hero_nun_portrait.png` | 圣烛修女立绘 | 角色立绘缺少职业魅力，像程序化占位图。 | 重做职业轮廓、武器/道具、披风/烛光/药剂、阴影和高光。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/hero_alchemist_portrait.png` | 灰血炼金师立绘 | 角色立绘缺少职业魅力，像程序化占位图。 | 重做职业轮廓、武器/道具、披风/烛光/药剂、阴影和高光。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/map_final.png` | 地图 | 羊皮纸、节点、图例偏流程图。 | 接入烧焦羊皮纸、颗粒褶皱、徽章节点、暗角和路线墨线。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_knight_final.png` | 流亡骑士战斗 | 战斗页角色、敌人、背景、卡牌仍像 Phaser 原型。 | 接入新战斗背景、主角 sprite、敌人工厂、卡牌工厂、UI 控件和提示布局。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_knight_sprite.png` | 流亡骑士战斗 sprite | 战斗角色像色块人。 | 战斗 sprite 使用角色工厂，保留职业特征和待机微动。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/card_set_final.png` | 卡牌集合 | 卡牌像普通 UI 卡片，插画和纸面质感不足。 | UICard 接入羊皮纸纹理、类型色边、费用宝珠、插画窗和底部徽章。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_attack_final.png` | 攻击反馈 | 攻击反馈不够明显。 | 保留卡牌飞出、斩击线、闪红、抖动、伤害飘字和血条动画。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_defense_final.png` | 防御反馈 | 防御反馈不够明显。 | 保留护盾圆弧、护甲飘字、血条护甲层和防御音效。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/enemy_sheet_polished.png` | 敌人表 | 敌人缺少怪物感，轮廓相似。 | 使用 EnemySpriteFactory 展示 8 普通敌人和 3 精英的独立轮廓。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/boss_headless_polished.png` | Boss 表 | Boss 体量和压迫感不足。 | 无首守墓骑士使用厚重黑甲、墓剑、破披风、灵火和阶段色。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/pause_final.png` | 暂停菜单 | 暂停菜单需要确认底层不可点击和 UI 成品感。 | 复验 ESC 暂停、黑铁按钮、暗金面板和遮罩。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/settings_final.png` | 暂停设置 | 设置需要音效/动画/快速模式等完整控制。 | 复验暂停内设置页和二次操作入口。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_nun_final.png` | 圣烛修女战斗 | 战斗页角色、敌人、背景、卡牌仍像 Phaser 原型。 | 接入新战斗背景、主角 sprite、敌人工厂、卡牌工厂、UI 控件和提示布局。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_nun_sprite.png` | 圣烛修女战斗 sprite | 战斗角色像色块人。 | 战斗 sprite 使用角色工厂，保留职业特征和待机微动。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_alchemist_final.png` | 灰血炼金师战斗 | 战斗页角色、敌人、背景、卡牌仍像 Phaser 原型。 | 接入新战斗背景、主角 sprite、敌人工厂、卡牌工厂、UI 控件和提示布局。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/battle_alchemist_sprite.png` | 灰血炼金师战斗 sprite | 战斗角色像色块人。 | 战斗 sprite 使用角色工厂，保留职业特征和待机微动。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/codex_final.png` | 图鉴 | 图鉴、商店、事件等页面仍需成品化。 | 复验灰烬手札图鉴结构和统一 UI。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/shop_final.png` | 商店 | 商店像普通商品列表。 | 复验黑铁商铺、卡牌商品和金币不足提示。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/event_final.png` | 事件 | 事件像文本框。 | 复验冒险书页面、插画与选项层级。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/rest_final.png` | 休息 | 休息页需要营地和篝火气氛。 | 复验篝火营地、休息/强化选择和火光。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/chest_final.png` | 宝箱 | 宝箱页需要奖励演出。 | 复验宝箱居中、黑铁框和奖励区域。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/boss_intro_final.png` | Boss 登场 | Boss 登场演出需要压迫感。 | 复验黑幕、墓门、灵火和迎战按钮演出。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/act_clear_final.png` | 章节通关 | 通关转场需要完整演出。 | 复验 Boss 消散、灰烬散开和结算前淡出。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/result_victory_final.png` | 胜利结算 | 胜利结算需要标题动画和统计层级。 | 复验胜利标题、统计项和按钮层级。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
| `qa/screenshots/art/result_defeat_final.png` | 失败结算 | 失败结算需要清晰按钮和统计。 | 复验失败标题、统计项和重开入口。 | 否 | 否 | 否 | 否 | 通过 | 无需下一轮 |
