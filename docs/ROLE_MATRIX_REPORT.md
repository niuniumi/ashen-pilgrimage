# 角色状态一致性矩阵报告

测试地址：http://127.0.0.1:4176
生成时间：2026-07-10T13:06:57.194Z

## 结论

P0/P1 角色选择、存档、牌组、战斗绑定、奖励池矩阵通过。

## 数据与牌组

### 流亡骑士

- characterId：exiled-knight
- 生命/能量：82/3
- 初始牌组：knight-cleave x5，knight-block x4，knight-rend x1
- 奖励池：劈砍(knight-cleave)，格挡(knight-block)，撕裂斩(knight-rend)，双重斩(knight-double-slash)，刻痕(knight-score)，血线切(knight-bloodline-cut)，轻步斩(knight-quickstep)，盾墙(knight-shield-wall)，重剑压制(knight-heavy-pressure)，磨刃(knight-sharpen)，破甲切(knight-armor-break)，追猎(knight-pursuit)，血誓架势(knight-blood-oath-stance)，反击姿态(knight-counter-stance)，处决(knight-execution)，临时包扎(common-bandage)，短弩射击(common-crossbow)，旧盾(common-old-shield)，火把挥击(common-torch-swing)，灰步闪避(common-ash-dodge)，野外干粮(common-field-ration)，烟雾弹(common-smoke-bomb)，墓盐(common-grave-salt)，鸦群呼号(common-crow-call)，铁祷(common-iron-prayer)，圣火碎片(common-saint-fire-shard)，护盾突刺(knight-guarded-lunge)，红披风守势(knight-red-cape-stand)，破誓斩(knight-vowbreaker)，无圣决斗(knight-saintless-duel)

### 圣烛修女

- characterId：candle-nun
- 生命/能量：72/3
- 初始牌组：nun-flame x5，nun-prayer-shield x4，nun-confession-mark x1
- 奖励池：烛火(nun-flame)，祷盾(nun-prayer-shield)，忏悔印(nun-confession-mark)，蜡封(nun-wax-seal)，引燃烛印(nun-ignite)，圣火飞烛(nun-flying-candles)，护身祷词(nun-guardian-prayer)，缄默祷言(nun-silent-prayer)，烛阵展开(nun-candle-array)，微光(nun-glimmer)，替罪蜡像(nun-scapegoat-wax)，青白圣火(nun-pale-holy-fire)，静默礼拜(nun-quiet-mass)，烛网(nun-candle-net)，万烛归一(nun-thousand-candles)，临时包扎(common-bandage)，短弩射击(common-crossbow)，旧盾(common-old-shield)，火把挥击(common-torch-swing)，灰步闪避(common-ash-dodge)，野外干粮(common-field-ration)，烟雾弹(common-smoke-bomb)，墓盐(common-grave-salt)，鸦群呼号(common-crow-call)，铁祷(common-iron-prayer)，圣火碎片(common-saint-fire-shard)，行者小烛(nun-pilgrim-candle)，赦罪焰(nun-absolution)，黎明连祷(nun-litany-of-dawn)，最后一烛(nun-last-candle)

### 灰血炼金师

- characterId：ashblood-alchemist
- 生命/能量：76/3
- 初始牌组：alc-acid-vial x5，alc-leather-guard x4，alc-forbidden-test x1
- 奖励池：酸蚀瓶(alc-acid-vial)，皮革护具(alc-leather-guard)，禁药试验(alc-forbidden-test)，腐蚀烧瓶(alc-corrosive-flask)，苦味药剂(alc-bitter-draught)，灰血沸腾(alc-ashblood-boil)，硬化皮肤(alc-hardened-skin)，再生药膏(alc-regrowth-salve)，破颅锤(alc-skullbreaker)，狂化注射(alc-berserk-injection)，铅皮硬化(alc-leadskin)，烟雾步(alc-smoke-step)，血怒投掷(alc-bloodrage-throw)，白灰莲剂(alc-white-ash-lotus)，灰血新生(alc-ashblood-rebirth)，临时包扎(common-bandage)，短弩射击(common-crossbow)，旧盾(common-old-shield)，火把挥击(common-torch-swing)，灰步闪避(common-ash-dodge)，野外干粮(common-field-ration)，烟雾弹(common-smoke-bomb)，墓盐(common-grave-salt)，鸦群呼号(common-crow-call)，铁祷(common-iron-prayer)，圣火碎片(common-saint-fire-shard)，旅途补剂(alc-traveling-tonic)，水银小刀(alc-mercury-knife)，猩红触媒(alc-crimson-catalyst)，不死鸟试剂(alc-phoenix-reagent)

## 浏览器矩阵截图

- qa/screenshots/role_matrix_knight_select.png
- qa/screenshots/role_matrix_knight_battle.png
- qa/screenshots/role_matrix_knight_cards.png
- qa/screenshots/role_matrix_nun_select.png
- qa/screenshots/role_matrix_nun_battle.png
- qa/screenshots/role_matrix_nun_cards.png
- qa/screenshots/role_matrix_alchemist_select.png
- qa/screenshots/role_matrix_alchemist_battle.png
- qa/screenshots/role_matrix_alchemist_cards.png

## 浏览器绑定结果

### 流亡骑士

- run.characterId：exiled-knight
- playerName：流亡骑士
- playerArtKey：knight-battle
- battle hp：82/82
- 手牌：格挡，劈砍，劈砍，格挡，格挡

### 圣烛修女

- run.characterId：candle-nun
- playerName：圣烛修女
- playerArtKey：nun-battle
- battle hp：72/72
- 手牌：祷盾，烛火，烛火，祷盾，祷盾

### 灰血炼金师

- run.characterId：ashblood-alchemist
- playerName：灰血炼金师
- playerArtKey：alchemist-battle
- battle hp：76/76
- 手牌：皮革护具，酸蚀瓶，酸蚀瓶，皮革护具，皮革护具

