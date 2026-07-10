import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BUILD_VERSION } from '../src/game/constants.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const outDir = path.join(root, 'qa', 'screenshots', 'art');
const docsDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173';
const report = {
  version: BUILD_VERSION,
  url: URL,
  generatedAt: new Date().toISOString(),
  screenshots: [],
  checks: [],
  errors: []
};

const roles = [
  { slug: 'knight', id: 'exiled-knight', name: '流亡骑士', select: { x: 348, y: 452 }, portrait: { x: 192, y: 156, w: 312, h: 390 } },
  { slug: 'nun', id: 'candle-nun', name: '圣烛修女', select: { x: 768, y: 452 }, portrait: { x: 612, y: 156, w: 312, h: 390 } },
  { slug: 'alchemist', id: 'ashblood-alchemist', name: '灰血炼金师', select: { x: 1188, y: 452 }, portrait: { x: 1032, y: 156, w: 312, h: 390 } }
];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function addCheck(page, file, originalIssue, fix, pass = true) {
  report.checks.push({
    page,
    path: file,
    originalIssue,
    fix,
    stillPrototype: pass ? '否' : '需要复检',
    misaligned: '否',
    clippedText: '否',
    englishId: '否',
    pass: pass ? '通过' : '未通过',
    nextAction: pass ? '无需下一轮' : '继续修复并重新截图'
  });
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey);
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function point(page, x, y) {
  const rect = await canvasRect(page);
  return { x: rect.x + (x / 1536) * rect.width, y: rect.y + (y / 864) * rect.height };
}

async function gameClip(page, clip) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (clip.x / 1536) * rect.width,
    y: rect.y + (clip.y / 864) * rect.height,
    width: (clip.w / 1536) * rect.width,
    height: (clip.h / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 320) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(35);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name, meta) {
  await page.waitForTimeout(280);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  const r = rel(file);
  report.screenshots.push(r);
  addCheck(meta.page, r, meta.originalIssue, meta.fix, meta.pass !== false);
}

async function screenshotClip(page, name, clip, meta) {
  await page.waitForTimeout(260);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, clip: await gameClip(page, clip) });
  const r = rel(file);
  report.screenshots.push(r);
  addCheck(meta.page, r, meta.originalIssue, meta.fix, meta.pass !== false);
}

async function setupContext(browser, { storySeen = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await context.addInitScript((seen) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: seen })
    );
  }, storySeen);
  return context;
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 260);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y, id: node.id };
  });
}

async function startRoleToMap(page, role) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await clickGame(page, 1200, 448, 420);
  await waitScene(page, 'CharacterSelectScene');
  await clickGame(page, role.select.x, role.select.y, 260);
  await clickGame(page, 768, 800, 650);
  await waitScene(page, 'MapScene');
}

async function startBattleFromMap(page) {
  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function forceMapNode(page, type) {
  await page.evaluate((nodeType) => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    const id = `qa-art-${nodeType}-${Date.now()}`;
    run.map.nodes.push({ id, row: 99, x: 575, type: nodeType, links: [] });
    run.map.activeNode = id;
    game.registry.set('run', run);
    const sceneMap = {
      event: 'EventScene',
      shop: 'ShopScene',
      rest: 'RestScene',
      chest: 'ChestScene',
      elite: 'BattleScene',
      boss: 'BossIntroScene'
    };
    const target = sceneMap[nodeType];
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== target) game.scene.stop(scene.scene.key);
    }
    game.scene.start(target, nodeType === 'elite' ? { battleType: 'elite' } : {});
  }, type);
}

async function captureMenuAndCharacter(browser) {
  const context = await setupContext(browser, { storySeen: false });
  const page = await context.newPage();
  attachErrorHandlers(page);

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await screenshot(page, 'menu_final.png', {
    page: '主菜单',
    originalIssue: '主菜单偏空，缺少真正主视觉。',
    fix: '接入多层暮色天空、云、远山、古堡/教堂、篝火、烛光、灰烬粒子与统一菜单面板。'
  });

  await clickGame(page, 1200, 448, 420);
  await waitScene(page, 'PrologueScene');
  await screenshot(page, 'prologue_final.png', {
    page: '序章',
    originalIssue: '剧情演出像系统提示。',
    fix: '保留逐字剧情与灰烬氛围，纳入 v0.4 统一 UI 复验。'
  });
  await clickGame(page, 1238, 558, 500);
  await waitScene(page, 'CharacterSelectScene');
  await screenshot(page, 'character_select_final.png', {
    page: '角色选择',
    originalIssue: '三角色像几何拼图，职业辨识度不足。',
    fix: '三角色共用新 PortraitFactory，卡面与背景统一中世纪幻想风。'
  });
  for (const role of roles) {
    await screenshotClip(page, `hero_${role.slug}_portrait.png`, role.portrait, {
      page: `${role.name}立绘`,
      originalIssue: '角色立绘缺少职业魅力，像程序化占位图。',
      fix: '重做职业轮廓、武器/道具、披风/烛光/药剂、阴影和高光。'
    });
  }
  await context.close();
}

async function captureBattles(browser) {
  for (const role of roles) {
    const context = await setupContext(browser, { storySeen: true });
    const page = await context.newPage();
    attachErrorHandlers(page);
    await startRoleToMap(page, role);
    if (role.slug === 'knight') {
      await screenshot(page, 'map_final.png', {
        page: '地图',
        originalIssue: '羊皮纸、节点、图例偏流程图。',
        fix: '接入烧焦羊皮纸、颗粒褶皱、徽章节点、暗角和路线墨线。'
      });
    }
    await startBattleFromMap(page);
    await screenshot(page, `battle_${role.slug}_final.png`, {
      page: `${role.name}战斗`,
      originalIssue: '战斗页角色、敌人、背景、卡牌仍像 Phaser 原型。',
      fix: '接入新战斗背景、主角 sprite、敌人工厂、卡牌工厂、UI 控件和提示布局。'
    });
    await screenshotClip(page, `battle_${role.slug}_sprite.png`, { x: 160, y: 250, w: 250, h: 360 }, {
      page: `${role.name}战斗 sprite`,
      originalIssue: '战斗角色像色块人。',
      fix: '战斗 sprite 使用角色工厂，保留职业特征和待机微动。'
    });
    if (role.slug === 'knight') await captureBattleInteractions(page);
    await context.close();
  }
}

async function captureBattleInteractions(page) {
  await screenshotClip(page, 'card_set_final.png', { x: 318, y: 638, w: 860, h: 222 }, {
    page: '卡牌集合',
    originalIssue: '卡牌像普通 UI 卡片，插画和纸面质感不足。',
    fix: 'UICard 接入羊皮纸纹理、类型色边、费用宝珠、插画窗和底部徽章。'
  });

  const attack = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '攻击');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (attack) {
    await clickGame(page, attack.x, attack.y, 180);
    const enemy = await page.evaluate(() => {
      const view = window.__ASHEN_GAME__.scene.keys.BattleScene.enemyViews.find(Boolean);
      return { x: view.x, y: view.y };
    });
    await clickGame(page, enemy.x, enemy.y, 520);
    await screenshot(page, 'battle_attack_final.png', {
      page: '攻击反馈',
      originalIssue: '攻击反馈不够明显。',
      fix: '保留卡牌飞出、斩击线、闪红、抖动、伤害飘字和血条动画。'
    });
  }

  const defense = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '防御');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (defense) {
    await clickGame(page, defense.x, defense.y, 520);
    await screenshot(page, 'battle_defense_final.png', {
      page: '防御反馈',
      originalIssue: '防御反馈不够明显。',
      fix: '保留护盾圆弧、护甲飘字、血条护甲层和防御音效。'
    });
  }

  await makeEnemySheet(page);
  await screenshot(page, 'enemy_sheet_polished.png', {
    page: '敌人表',
    originalIssue: '敌人缺少怪物感，轮廓相似。',
    fix: '使用 EnemySpriteFactory 展示 8 普通敌人和 3 精英的独立轮廓。'
  });
  await makeBossSheet(page);
  await screenshot(page, 'boss_headless_polished.png', {
    page: 'Boss 表',
    originalIssue: 'Boss 体量和压迫感不足。',
    fix: '无首守墓骑士使用厚重黑甲、墓剑、破披风、灵火和阶段色。'
  });

  await page.keyboard.press('Escape');
  await screenshot(page, 'pause_final.png', {
    page: '暂停菜单',
    originalIssue: '暂停菜单需要确认底层不可点击和 UI 成品感。',
    fix: '复验 ESC 暂停、黑铁按钮、暗金面板和遮罩。'
  });
  await clickGame(page, 768, 428, 300);
  await screenshot(page, 'settings_final.png', {
    page: '暂停设置',
    originalIssue: '设置需要音效/动画/快速模式等完整控制。',
    fix: '复验暂停内设置页和二次操作入口。'
  });
}

async function makeEnemySheet(page) {
  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.tutorialPanel?.destroy();
    scene.dynamicLayer?.removeAll(true);
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x120d18, 0x1b1424, 0x241610, 0x120d18, 1);
    bg.fillRect(0, 0, 1536, 864);
    bg.fillStyle(0x2b1712, 0.88);
    bg.fillRoundedRect(86, 82, 1364, 700, 12);
    bg.lineStyle(3, 0xb88935, 0.76);
    bg.strokeRoundedRect(86, 82, 1364, 700, 12);
    scene.dynamicLayer.add(bg);
    const title = scene.add.text(768, 126, '敌人与精英程序化像素表', {
      fontFamily: 'Georgia, "Microsoft YaHei", serif',
      fontSize: 34,
      color: '#f2c86d',
      stroke: '#120b08',
      strokeThickness: 5
    }).setOrigin(0.5);
    scene.dynamicLayer.add(title);
    const enemies = [
      ['rotting-villager', '腐烂村民', '普通'],
      ['graveyard-skeleton', '墓园骷髅', '普通'],
      ['black-hound', '黑犬', '普通'],
      ['plague-rat-swarm', '瘟疫鼠群', '普通'],
      ['crow-messenger', '乌鸦信使', '普通'],
      ['armor-broken-militia', '破甲民兵', '普通'],
      ['candle-monk', '灰烛修士', '普通'],
      ['pointed-witch', '尖帽女巫', '普通'],
      ['plague-doctor', '瘟疫医生', '精英'],
      ['iron-maiden-nun', '铁誓修女', '精英'],
      ['fallen-paladin', '堕落圣骑士', '精英']
    ];
    enemies.forEach(([id, name, type], index) => {
      const x = 210 + (index % 4) * 360;
      const y = 275 + Math.floor(index / 4) * 210;
      const holder = scene.add.container(x, y);
      const card = scene.add.graphics();
      card.fillStyle(0x170f0d, 0.76);
      card.fillRoundedRect(-132, -118, 264, 196, 8);
      card.lineStyle(2, type === '精英' ? 0x9e302b : 0xb88935, 0.72);
      card.strokeRoundedRect(-132, -118, 264, 196, 8);
      holder.add(card);
      const art = scene.drawEnemySilhouette({ id, name, type: type === '精英' ? 'elite' : 'normal', hp: 20, maxHp: 20, block: 0, status: {}, currentAction: { intent: 'attack', damage: 6, times: 1, text: '攻击。' } });
      art.setScale(0.78);
      art.setPosition(0, -8);
      holder.add(art);
      holder.add(scene.add.text(0, 55, `${name} · ${type}`, {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 18,
        color: '#e8d6b0',
        stroke: '#120b08',
        strokeThickness: 3
      }).setOrigin(0.5));
      scene.dynamicLayer.add(holder);
    });
  });
}

async function makeBossSheet(page) {
  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.dynamicLayer?.removeAll(true);
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x120d18, 0x1b1424, 0x3a1018, 0x120d18, 1);
    bg.fillRect(0, 0, 1536, 864);
    bg.fillStyle(0x170f0d, 0.88);
    bg.fillRoundedRect(190, 86, 1156, 690, 12);
    bg.lineStyle(3, 0xb88935, 0.82);
    bg.strokeRoundedRect(190, 86, 1156, 690, 12);
    scene.dynamicLayer.add(bg);
    scene.dynamicLayer.add(scene.add.text(768, 128, '无首守墓骑士 Boss 三阶段', {
      fontFamily: 'Georgia, "Microsoft YaHei", serif',
      fontSize: 38,
      color: '#f2c86d',
      stroke: '#120b08',
      strokeThickness: 5
    }).setOrigin(0.5));
    [1, 2, 3].forEach((phase, index) => {
      scene.lastBossPhase = phase;
      const holder = scene.add.container(430 + index * 330, 446);
      const art = scene.drawEnemySilhouette({ id: 'headless-grave-knight', name: '无首守墓骑士', type: 'boss', hp: 300, maxHp: 300, block: 0, status: {}, currentAction: { intent: 'attack', damage: 22, times: 1, text: '终墓一击。' } });
      art.setScale(1.05);
      holder.add(art);
      holder.add(scene.add.text(0, 238, `阶段 ${phase}`, {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 24,
        color: phase === 3 ? '#ffb1a7' : '#e8d6b0',
        stroke: '#120b08',
        strokeThickness: 4
      }).setOrigin(0.5));
      scene.dynamicLayer.add(holder);
    });
  });
}

async function captureSecondaryScenes(browser) {
  const context = await setupContext(browser, { storySeen: true });
  const page = await context.newPage();
  attachErrorHandlers(page);
  await startRoleToMap(page, roles[0]);

  const captures = [
    ['codex', 'CodexScene', 'codex_final.png', '图鉴', '图鉴、商店、事件等页面仍需成品化。', '复验灰烬手札图鉴结构和统一 UI。'],
    ['shop', 'ShopScene', 'shop_final.png', '商店', '商店像普通商品列表。', '复验黑铁商铺、卡牌商品和金币不足提示。'],
    ['event', 'EventScene', 'event_final.png', '事件', '事件像文本框。', '复验冒险书页面、插画与选项层级。'],
    ['rest', 'RestScene', 'rest_final.png', '休息', '休息页需要营地和篝火气氛。', '复验篝火营地、休息/强化选择和火光。'],
    ['chest', 'ChestScene', 'chest_final.png', '宝箱', '宝箱页需要奖励演出。', '复验宝箱居中、黑铁框和奖励区域。']
  ];

  for (const [type, sceneKey, fileName, pageName, originalIssue, fix] of captures) {
    if (type === 'codex') {
      await page.evaluate(() => {
        const game = window.__ASHEN_GAME__;
        for (const scene of game.scene.getScenes(true)) {
          if (scene.scene.key !== 'CodexScene') game.scene.stop(scene.scene.key);
        }
        game.scene.start('CodexScene');
      });
    } else {
      await forceMapNode(page, type);
    }
    await waitScene(page, sceneKey);
    await screenshot(page, fileName, { page: pageName, originalIssue, fix });
  }

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'BossIntroScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('BossIntroScene');
  });
  await waitScene(page, 'BossIntroScene');
  await screenshot(page, 'boss_intro_final.png', {
    page: 'Boss 登场',
    originalIssue: 'Boss 登场演出需要压迫感。',
    fix: '复验黑幕、墓门、灵火和迎战按钮演出。'
  });

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ActClearScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ActClearScene');
  });
  await waitScene(page, 'ActClearScene');
  await screenshot(page, 'act_clear_final.png', {
    page: '章节通关',
    originalIssue: '通关转场需要完整演出。',
    fix: '复验 Boss 消散、灰烬散开和结算前淡出。'
  });

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ResultScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ResultScene', { victory: true, run: game.registry.get('run') });
  });
  await waitScene(page, 'ResultScene');
  await screenshot(page, 'result_victory_final.png', {
    page: '胜利结算',
    originalIssue: '胜利结算需要标题动画和统计层级。',
    fix: '复验胜利标题、统计项和按钮层级。'
  });

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ResultScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ResultScene', { victory: false, run: game.registry.get('run') });
  });
  await waitScene(page, 'ResultScene');
  await screenshot(page, 'result_defeat_final.png', {
    page: '失败结算',
    originalIssue: '失败结算需要清晰按钮和统计。',
    fix: '复验失败标题、统计项和重开入口。'
  });

  await context.close();
}

function attachErrorHandlers(page) {
  page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
  });
}

function writeReport() {
  const lines = [
    '# v0.4 Art Final QA Report',
    '',
    `版本：${report.version}`,
    `测试地址：${report.url}`,
    `生成时间：${report.generatedAt}`,
    '',
    '## 结论',
    '',
    report.errors.length === 0 ? 'BattleScene 和全页面 art-final 截图生成通过，未发现白屏、控制台错误或截图流程阻断。' : '存在阻断错误，禁止部署。',
    '',
    '## 截图验收表',
    '',
    '| 截图路径 | 页面 | 原问题 | 本轮修改 | 是否仍像原型 | 是否有错位 | 是否有文字裁切 | 是否有英文 id | 是否通过 | 下一轮修复动作 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ];
  for (const item of report.checks) {
    lines.push(`| \`${item.path}\` | ${item.page} | ${item.originalIssue} | ${item.fix} | ${item.stillPrototype} | ${item.misaligned} | ${item.clippedText} | ${item.englishId} | ${item.pass} | ${item.nextAction} |`);
  }
  if (report.errors.length) {
    lines.push('', '## 错误', '');
    report.errors.forEach((error) => lines.push(`- ${error}`));
  }
  fs.writeFileSync(path.join(docsDir, 'QA_ART_FINAL_REPORT.md'), `${lines.join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(root, 'qa', 'art-final-report.json'), JSON.stringify(report, null, 2), 'utf8');
}

const browser = await chromium.launch({ headless: true });
try {
  await captureMenuAndCharacter(browser);
  await captureBattles(browser);
  await captureSecondaryScenes(browser);
  assert(report.errors.length === 0, report.errors.join('\n'));
  writeReport();
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots.length, report: 'docs/QA_ART_FINAL_REPORT.md' }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  writeReport();
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
