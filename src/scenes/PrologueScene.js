import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { UIButton } from '../ui/UIButton.js';
import { SceneTransition } from '../ui/SceneTransition.js';
import { drawBackArrowButton } from '../ui/UIOrnament.js';
import { attachSceneServices, preloadSceneAssets } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { drawPixelPanel, PIXEL_PALETTE } from '../art/PixelArtSystem.js';
import { FONT } from '../design/textStyles.js';
import { motionDuration } from '../game/MotionPolicy.js';
import { cjkWordWrap } from '../ui/CjkTextLayout.js';

const PROLOGUE_PAGES = [
  {
    mark: 'I',
    title: '灰白圣火',
    body: '暮鸦村的钟已经七年没有响过。\n\n今夜，墓园深处却传来第十三声钟鸣。灰白的火焰沿墓碑蔓延，不燃草木，只把死者遗忘的名字照回人间。'
  },
  {
    mark: 'II',
    title: '三名行者',
    body: '被放逐的骑士追寻失落的誓言；守烛修女背负一盏不肯熄灭的灯；灰血炼金师则相信圣火是一味尚未命名的药。\n\n三条道路，指向同一座修道院。'
  },
  {
    mark: 'III',
    title: '旅途法则',
    body: '每一次战斗都会留下伤痕，也会留下新的技艺。你必须在力量、信念与代价之间取舍。\n\n地图不会等待犹豫者，但每一条岔路都记得你的选择。'
  },
  {
    mark: 'IV',
    title: '余烬启程',
    body: '远处的王城被日蚀吞没，空王冠在高塔上等待新的主人。\n\n握紧手中的牌。真正的朝圣并非走向圣火，而是决定火焰最后照亮谁。'
  }
];

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Prologue);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Prologue, { title: '展开序章' });
  }

  create() {
    attachSceneServices(this);
    this.settings = SaveManager.readSettings();
    this.audio?.startAmbience?.('story');
    this.pageIndex = 0;
    this.pageImage = null;
    this.isTurning = false;
    this.drawBackdrop();
    this.createPage();
    this.createControls();
    const fadeDuration = motionDuration(this.settings, 360);
    if (fadeDuration) this.cameras.main.fadeIn(fadeDuration, 0, 0, 0);
  }

  drawBackdrop() {
    addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 });
  }

  createPage() {
    const page = PROLOGUE_PAGES[this.pageIndex];
    const image = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(10).setAlpha(0);
    const panel = this.add.graphics();
    drawPixelPanel(panel, 0, 0, 960, 610, {
      fill: PIXEL_PALETTE.coal,
      inner: PIXEL_PALETTE.black,
      stroke: PIXEL_PALETTE.goldDark,
      seed: this.pageIndex + 40
    });
    const mark = this.add.text(0, -214, page.mark, { fontFamily: FONT, fontSize: 54, color: '#d0a24f', stroke: '#08090d', strokeThickness: 6 }).setOrigin(0.5);
    const title = this.add.text(0, -138, page.title, { fontFamily: FONT, fontSize: 38, color: '#f4e7c5', stroke: '#08090d', strokeThickness: 5 }).setOrigin(0.5);
    const divider = this.add.graphics();
    divider.fillStyle(PIXEL_PALETTE.goldDark, 1);
    divider.fillRect(-260, -92, 520, 4);
    divider.fillStyle(PIXEL_PALETTE.gold, 1);
    divider.fillRect(-8, -98, 16, 16);
    const body = this.add.text(0, 54, page.body, {
      fontFamily: FONT,
      fontSize: 24,
      color: '#d6c7a5',
      align: 'center',
      lineSpacing: 14,
      wordWrap: cjkWordWrap(730)
    }).setOrigin(0.5);
    const index = this.add.text(0, 254, `${this.pageIndex + 1} / ${PROLOGUE_PAGES.length}`, { fontFamily: FONT, fontSize: 15, color: '#85745c' }).setOrigin(0.5);
    image.add([panel, mark, title, divider, body, index]);
    this.pageImage = image;
    this.pageBody = body;
    this.pageIndexText = index;
    const entranceDuration = motionDuration(this.settings, 460);
    if (entranceDuration) {
      this.tweens.add({
        targets: this.pageImage,
        alpha: 1,
        duration: entranceDuration,
        ease: 'Sine.Out'
      });
    } else {
      this.pageImage.setAlpha(1);
    }
  }

  fitPageImage(image) {
    const texture = this.textures.get(image.texture.key);
    const source = texture.getSourceImage();
    const sourceWidth = source?.width ?? 1536;
    const sourceHeight = source?.height ?? 864;
    const maxWidth = 1488;
    const maxHeight = 824;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    image.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  }

  createControls() {
    this.prevButton = drawBackArrowButton(this, 82, GAME_HEIGHT / 2, '', () => this.turnPage(-1), {
      width: 142,
      height: 40,
      depth: 30
    });
    this.nextButton = drawBackArrowButton(this, GAME_WIDTH - 82, GAME_HEIGHT / 2, '', () => this.turnPage(1), {
      direction: 'right',
      width: 142,
      height: 40,
      depth: 30
    });
    new UIButton(this, GAME_WIDTH - 146, 58, 180, 46, '跳过剧情', () => this.finish(), {
      fontSize: 20,
      hitDepth: 30000
    }).setDepth(31);
    this.updateControls();
  }

  updateControls() {
    this.prevButton?.setVisible(this.pageIndex > 0);
  }

  turnPage(direction) {
    if (this.isTurning) return;
    const nextIndex = this.pageIndex + direction;
    if (nextIndex >= PROLOGUE_PAGES.length) {
      this.finish();
      return;
    }
    if (nextIndex < 0) return;
    this.isTurning = true;
    this.audio?.play?.('pageTurn');
    const current = this.pageImage;
    const exitDuration = motionDuration(this.settings, 260);
    const completeTurn = () => {
      current?.destroy();
      this.pageIndex = nextIndex;
      this.createPage();
      this.updateControls();
      const settleDuration = motionDuration(this.settings, 460);
      if (settleDuration) this.time.delayedCall(settleDuration, () => { this.isTurning = false; });
      else this.isTurning = false;
    };
    if (!exitDuration) {
      completeTurn();
      return;
    }
    this.tweens.add({
      targets: current,
      alpha: 0,
      duration: exitDuration,
      ease: 'Sine.In',
      onComplete: completeTurn
    });
  }

  finish() {
    const settings = SaveManager.readSettings();
    settings.storySeen = true;
    SaveManager.saveSettings(settings);
    this.audio?.play('dialogClose');
    SceneTransition.fadeTo(this, SCENES.CharacterSelect, {}, 420);
  }
}
