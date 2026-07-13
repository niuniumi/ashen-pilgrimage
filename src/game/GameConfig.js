import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from './constants.js';
import BootScene from '../scenes/BootScene.js';
import PreloadScene from '../scenes/PreloadScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import GuideScene from '../scenes/GuideScene.js';
import CharacterSelectScene from '../scenes/CharacterSelectScene.js';
import VowScene from '../scenes/VowScene.js';
import PrologueScene from '../scenes/PrologueScene.js';
import BossIntroScene from '../scenes/BossIntroScene.js';
import ActClearScene from '../scenes/ActClearScene.js';
import MapScene from '../scenes/MapScene.js';
import BattleScene from '../scenes/BattleScene.js';
import RewardScene from '../scenes/RewardScene.js';
import ShopScene from '../scenes/ShopScene.js';
import EventScene from '../scenes/EventScene.js';
import RestScene from '../scenes/RestScene.js';
import ChestScene from '../scenes/ChestScene.js';
import CodexScene from '../scenes/CodexScene.js';
import SettingsScene from '../scenes/SettingsScene.js';
import ResultScene from '../scenes/ResultScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#070604',
  pixelArt: true,
  roundPixels: true,
  loader: {
    maxParallelDownloads: 4,
    maxRetries: 4,
    timeout: 60000
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  render: {
    antialias: false
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    GuideScene,
    CharacterSelectScene,
    VowScene,
    PrologueScene,
    BossIntroScene,
    ActClearScene,
    MapScene,
    BattleScene,
    RewardScene,
    ShopScene,
    EventScene,
    RestScene,
    ChestScene,
    CodexScene,
    SettingsScene,
    ResultScene
  ],
  title: SCENES.MainMenu
};
