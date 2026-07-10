# v0.5 Final Art Rescue Asset Manifest

版本：`v0.5.0-final-art-rescue`

## 结论

本轮已经从 Phaser Graphics 默认角色绘制，切换为本地 SVG 静态素材包。所有核心角色、敌人、Boss、主背景、UI frame 均位于 `public/assets/art/`，由 Phaser PreloadScene 加载为 texture 后使用。

## 资产清单

| 路径 | 用途 | 使用位置 | 状态 |
| --- | --- | --- | --- |
| `public/assets/art/heroes/exiled-knight-portrait.svg` | 流亡骑士选择页立绘 | CharacterSelect | final-svg |
| `public/assets/art/heroes/candle-nun-portrait.svg` | 圣烛修女选择页立绘 | CharacterSelect | final-svg |
| `public/assets/art/heroes/ashblood-alchemist-portrait.svg` | 灰血炼金师选择页立绘 | CharacterSelect | final-svg |
| `public/assets/art/heroes/exiled-knight-battle.svg` | 流亡骑士战斗 sprite | Battle | final-svg |
| `public/assets/art/heroes/candle-nun-battle.svg` | 圣烛修女战斗 sprite | Battle | final-svg |
| `public/assets/art/heroes/ashblood-alchemist-battle.svg` | 灰血炼金师战斗 sprite | Battle | final-svg |
| `public/assets/art/enemies/rotten-villager.svg` | 腐烂村民 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/grave-skeleton.svg` | 墓园骷髅 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/black-hound.svg` | 黑犬 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/plague-rats.svg` | 瘟疫鼠群 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/raven-messenger.svg` | 乌鸦信使 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/broken-militia.svg` | 破甲民兵 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/candle-monk.svg` | 灰烛修士 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/witch.svg` | 尖帽女巫 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/plague-doctor.svg` | 瘟疫医生 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/iron-maiden-nun.svg` | 铁誓修女 | Battle, QA sheet | final-svg |
| `public/assets/art/enemies/fallen-paladin.svg` | 堕落圣骑士 | Battle, QA sheet | final-svg |
| `public/assets/art/bosses/headless-grave-knight.svg` | 无首守墓骑士 | Battle, QA sheet | final-svg |
| `public/assets/art/backgrounds/main-menu-final.svg` | 主菜单背景 | MainMenu | final-svg |
| `public/assets/art/backgrounds/character-select-bg.svg` | 角色选择背景 | CharacterSelect | final-svg |
| `public/assets/art/backgrounds/battle-village-final.svg` | 战斗背景 | Battle | final-svg |
| `public/assets/art/backgrounds/map-parchment-final.svg` | 地图背景 | Map | final-svg |
| `public/assets/art/ui/panel-frame.svg` | 面板 frame | UI reference | final-svg |
| `public/assets/art/ui/button-frame.svg` | 按钮 frame | UI reference | final-svg |
| `public/assets/art/ui/card-frame-attack.svg` | 攻击卡 frame | UI reference | final-svg |
| `public/assets/art/ui/card-frame-defense.svg` | 防御卡 frame | UI reference | final-svg |
| `public/assets/art/ui/card-frame-skill.svg` | 技能卡 frame | UI reference | final-svg |
| `public/assets/art/ui/card-frame-spell.svg` | 法术卡 frame | UI reference | final-svg |
| `public/assets/art/ui/card-frame-curse.svg` | 诅咒卡 frame | UI reference | final-svg |

## 技术接入

1. `scripts/generate-final-art-assets.mjs` 生成 SVG 文件。
2. `src/art/FinalArtAssets.js` 统一登记 key、url、尺寸。
3. `src/scenes/PreloadScene.js` 使用 `this.load.svg` 加载。
4. `PortraitFactory / EnemySpriteFactory / BossSpriteFactory / BackgroundFactory` 优先使用 SVG texture，旧 Graphics 仅作为加载失败兜底。

## 诚实边界

这些 SVG 是代码生成的本地矢量资产，已经明显强于圆形/矩形/三角形几何占位。但它们仍不是独立画师手绘或 AI 精绘 PNG/SVG。若目标是商业宣传级角色魅力，需要外部独立美术素材替换当前 SVG。
