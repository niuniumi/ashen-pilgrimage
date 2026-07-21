import Phaser from 'phaser';
import { gameConfig } from './game/GameConfig.js';
import { installQABridge } from './game/QABridge.js';
import { waitForBootFonts } from './game/BootReadiness.js';
import { AccessibilityBridge } from './game/AccessibilityBridge.js';

window.addEventListener('load', async () => {
  await waitForBootFonts(document.fonts);
  window.__ASHEN_GAME__ = new Phaser.Game(gameConfig);
  window.__ASHEN_ACCESSIBILITY__ = new AccessibilityBridge(document);
  window.__ASHEN_GAME__.registry.set('accessibility', window.__ASHEN_ACCESSIBILITY__);
  window.__ASHEN_QA__ = installQABridge(window.__ASHEN_GAME__);
  window.setTimeout(() => {
    const canvas = window.__ASHEN_GAME__?.canvas;
    if (!canvas) return;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', '灰烬圣途卡牌游戏。数字键选择卡牌，方向键切换目标，回车确认，E 键结束回合。');
    canvas.addEventListener('pointerdown', () => canvas.focus());
  }, 0);
});
