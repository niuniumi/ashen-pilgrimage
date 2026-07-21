import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { AccessibilityBridge } from '../src/game/AccessibilityBridge.js';

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = '';
    this.disabled = false;
    this.id = '';
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  remove() { this.removed = true; }
  click() { this.listeners.get('click')?.(); }
}

function fakeDocument() {
  const body = new FakeElement('body');
  return {
    body,
    createElement: (tagName) => new FakeElement(tagName)
  };
}

test('creates one polite live region and announces the current game state', () => {
  const document = fakeDocument();
  const bridge = new AccessibilityBridge(document);

  bridge.announce('路线节点：普通战斗');

  assert.equal(document.body.children.length, 1);
  assert.equal(bridge.liveRegion.attributes.get('aria-live'), 'polite');
  assert.equal(bridge.liveRegion.textContent, '路线节点：普通战斗');
});

test('scene actions are semantic buttons and stale cleanup cannot erase newer actions', () => {
  const document = fakeDocument();
  const bridge = new AccessibilityBridge(document);
  const calls = [];
  const clearMap = bridge.setActions('MapScene', [
    { label: '进入普通战斗', onActivate: () => calls.push('map') }
  ]);
  const clearPrologue = bridge.setActions('PrologueScene', [
    { label: '下一页', onActivate: () => calls.push('next') },
    { label: '跳过剧情', onActivate: () => calls.push('skip'), disabled: true }
  ]);

  clearMap();
  assert.equal(bridge.actions.children.length, 2);
  assert.equal(bridge.actions.children[0].tagName, 'BUTTON');
  bridge.actions.children[0].click();
  assert.deepEqual(calls, ['next']);
  assert.equal(bridge.actions.children[1].disabled, true);

  clearPrologue();
  assert.equal(bridge.actions.children.length, 0);
});

test('main menu, prologue and map register keyboard and accessibility actions', async () => {
  const [mainMenu, menuInput, prologue, map, helpers, main] = await Promise.all([
    readFile(new URL('../src/scenes/MainMenuScene.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/input/MenuInputController.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/scenes/PrologueScene.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/scenes/MapScene.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/scenes/SceneHelpers.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/main.js', import.meta.url), 'utf8')
  ]);

  assert.match(helpers, /scene\.accessibility = scene\.registry\.get\('accessibility'\)/);
  assert.match(main, /new AccessibilityBridge\(document\)/);
  assert.match(menuInput, /ArrowDown/);
  assert.match(mainMenu, /setActions\?\.\(SCENES\.MainMenu/);
  assert.match(prologue, /ArrowRight/);
  assert.match(prologue, /setActions\?\.\(SCENES\.Prologue/);
  assert.match(map, /setActions\?\.\(SCENES\.Map/);
});

test('release QA covers keyboard, semantic actions, and both mobile orientations', async () => {
  const [qa, pkg] = await Promise.all([
    readFile(new URL('../scripts/qa-accessibility-responsive.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8')
  ]);

  assert.match(qa, /keyboard\.press\('Enter'\)/);
  assert.match(qa, /waitForMenuSelection/);
  assert.match(qa, /canvas\.focus\(\)/);
  assert.match(qa, /keyboard\.down\(key\)/);
  assert.match(qa, /keyboard\.up\(key\)/);
  assert.doesNotMatch(qa, /registry\?\.get\('audio'\)\?\.unlocked === true/);
  assert.match(qa, /paused-map-action-recovery/);
  assert.match(qa, /ashen-live-region/);
  assert.match(qa, /ashen-scene-actions/);
  assert.match(qa, /width: 390, height: 844/);
  assert.match(qa, /width: 844, height: 390/);
  assert.match(qa, /canvasPointer/);
  assert.match(pkg, /"qa:accessibility-responsive"/);
});
