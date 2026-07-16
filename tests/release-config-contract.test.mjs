import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function assertOrdered(source, fragments, label) {
  let cursor = -1;
  for (const fragment of fragments) {
    const next = source.indexOf(fragment, cursor + 1);
    assert.ok(next > cursor, `${label} is missing or out of order: ${fragment}`);
    cursor = next;
  }
}

test('v2.3.0 identity is consistent across package, runtime, README, and release notes', () => {
  const packageJson = JSON.parse(read('package.json'));
  const versionSource = read('src/game/Version.js');
  const readme = read('README.md');
  const releaseNotes = read('docs/RELEASE_NOTES_2.3.md');

  assert.equal(packageJson.version, '2.3.0');
  assert.equal(packageJson.packageManager, 'pnpm@11.7.0');
  assert.match(versionSource, /version:\s*'v2\.3\.0'/);
  assert.match(versionSource, /buildTime:\s*'2026-07-16 \d{2}:\d{2}:\d{2} \+08:00'/);
  assert.match(readme, /当前版本 `v2\.3\.0`/);
  assert.match(readme, /AI 辅助开发项目/);
  assert.match(readme, /docs\/RELEASE_NOTES_2\.3\.md/);
  assert.match(releaseNotes, /^# v2\.3\.0\b/m);
  assert.match(releaseNotes, /AI 辅助开发/);
});

test('font references and Vite bundle warning policy support root and Pages builds', () => {
  const html = read('index.html');
  const viteConfig = read('vite.config.js');

  assert.match(html, /href="\/assets\/fonts\/fusion-pixel-10px-zh-hans\.woff2"/);
  assert.match(html, /url\("\/assets\/fonts\/fusion-pixel-10px-zh-hans\.woff2"\)/);
  assert.match(viteConfig, /chunkSizeWarningLimit:\s*1600\b/);
  assert.match(viteConfig, /reportCompressedSize:\s*true\b/);
  assert.match(viteConfig, /Phaser/);
});

test('CI runs the complete release gate on Node 24 and tears down preview', () => {
  const ci = read('.github/workflows/ci.yml');

  assert.match(ci, /pnpm\/action-setup@v6/);
  assert.match(ci, /version:\s*11\.7\.0/);
  assert.match(ci, /actions\/setup-node@v6/);
  assert.match(ci, /node-version:\s*24\b/);
  assertOrdered(ci, [
    'pnpm run assets:verify',
    'pnpm test',
    'pnpm run qa:design-tokens',
    'pnpm run qa:content-schema',
    'pnpm run qa:asset-manifest',
    'pnpm run qa:visual-bindings',
    'pnpm run qa:battle-mechanics',
    'pnpm run qa:battle-layout',
    'pnpm run qa:simulation',
    'pnpm build',
    'pnpm exec playwright install --with-deps chromium',
    'pnpm exec vite preview'
  ], 'CI release gate');
  assert.match(ci, /trap\s+['"]cleanup['"]\s+EXIT/);
  assert.match(ci, /curl\s+--fail\s+--silent\s+--show-error/);
  assert.match(ci, /QA_URL=['"]?http:\/\/127\.0\.0\.1:4173\/?['"]?/);
  assertOrdered(ci, [
    'pnpm run qa:map-migration',
    'pnpm run qa:progression -- --url="$QA_URL"',
    'pnpm run qa:chapter-transition -- --url="$QA_URL"',
    'pnpm run qa:resume-stages -- --url="$QA_URL"',
    'pnpm run qa:role-matrix',
    'pnpm run qa:full-flow',
    'pnpm run qa:release-flow',
    'pnpm run qa:product-upgrade-scenes',
    'pnpm run qa:pixel-scenes -- --url="$QA_URL"',
    'pnpm run qa:responsive-facing',
    'pnpm run qa:actor-roster',
    'pnpm run qa:pause-menu',
    'pnpm exec node scripts/qa-resource-budget.mjs --url="$QA_URL"'
  ], 'CI browser QA');
});

test('Pages deploys the successful CI head with repository base and runs online smoke', () => {
  const pages = read('.github/workflows/pages.yml');

  assert.doesNotMatch(pages, /^\s{2}push:/m);
  assert.match(pages, /workflow_run:[\s\S]*workflows:\s*\[CI\][\s\S]*types:\s*\[completed\][\s\S]*branches:\s*\[main\]/);
  assert.doesNotMatch(pages, /^\s{2}workflow_dispatch:/m);
  assert.match(pages, /github\.event\.workflow_run\.conclusion\s*==\s*'success'/);
  assert.ok((pages.match(/github\.event\.workflow_run\.head_sha/g) ?? []).length >= 2, 'both Pages jobs must checkout the CI head SHA');
  assert.match(pages, /pnpm exec vite build --base=\/ashen-pilgrimage\//);
  assert.match(pages, /actions\/checkout@v6/);
  assert.match(pages, /pnpm\/action-setup@v6/);
  assert.match(pages, /actions\/setup-node@v6/);
  assert.match(pages, /actions\/configure-pages@v5/);
  assert.match(pages, /actions\/upload-pages-artifact@v4/);
  assert.match(pages, /actions\/deploy-pages@v4/);
  assertOrdered(pages, ['actions/deploy-pages@v4', 'DEPLOY_URL: ${{ steps.deployment.outputs.page_url }}', 'pnpm run qa:deploy-smoke'], 'Pages deploy smoke');
  assert.doesNotMatch(pages, /qa:deploy-smoke\s+https?:\/\//);
});

test('Pages automatic deployment accepts only same-repository main push CI runs', () => {
  const pages = read('.github/workflows/pages.yml');

  assert.match(pages, /github\.event\.workflow_run\.conclusion\s*==\s*'success'/);
  assert.match(pages, /github\.event\.workflow_run\.event\s*==\s*'push'/);
  assert.match(pages, /github\.event\.workflow_run\.head_branch\s*==\s*'main'/);
  assert.match(pages, /github\.event\.workflow_run\.head_repository\.full_name\s*==\s*github\.repository/);
});

test('Pages rejects stale CI heads before both build and deployment', () => {
  const pages = read('.github/workflows/pages.yml');

  assert.match(pages, /concurrency:\s*\r?\n\s+group:\s*github-pages\s*\r?\n\s+queue:\s*max/);
  assert.doesNotMatch(pages, /cancel-in-progress:\s*true/);
  assert.equal((pages.match(/name:\s*Reject stale CI head/g) ?? []).length, 2);
  assert.equal((pages.match(/gh api "repos\/\$\{GITHUB_REPOSITORY\}\/commits\/main" --jq '\.sha'/g) ?? []).length, 2);
  assert.equal((pages.match(/test "\$CI_HEAD_SHA" = "\$latest_main_sha"/g) ?? []).length, 2);
});

test('Pages grants write and OIDC permissions only to the deploy job', () => {
  const pages = read('.github/workflows/pages.yml');

  assert.match(pages, /^permissions:\r?\n  contents: read\r?\n\r?\n/m);
  assert.equal((pages.match(/^\s+pages: write$/gm) ?? []).length, 1);
  assert.equal((pages.match(/^\s+id-token: write$/gm) ?? []).length, 1);
  assert.match(
    pages,
    /^  deploy:[\s\S]*?^    permissions:\r?\n      contents: read\r?\n      pages: write\r?\n      id-token: write$/m
  );
});

test('CI preview fails closed when the strict-port server exits before readiness', () => {
  const ci = read('.github/workflows/ci.yml');

  assert.match(ci, /pnpm exec vite preview[^\r\n]*--strictPort\b/);
  assert.match(
    ci,
    /for attempt in \{1\.\.60\}; do[\s\S]*?kill -0 "\$preview_pid"[\s\S]*?curl --fail --silent --show-error[\s\S]*?done/
  );
});

test('CI and Pages install the pinned runtime-image verifier before tests', () => {
  const ci = read('.github/workflows/ci.yml');
  const pages = read('.github/workflows/pages.yml');

  for (const [label, workflow, firstGate] of [
    ['CI', ci, 'pnpm run assets:verify'],
    ['Pages', pages, 'pnpm test']
  ]) {
    assertOrdered(workflow, [
      'actions/setup-python@v6',
      'python-version: 3.13',
      'python -m pip install Pillow==12.2.0',
      firstGate
    ], `${label} runtime image verifier`);
  }
});

test('README classifies resource-budget as browser QA', () => {
  const readme = read('README.md');
  const nonBrowserStart = readme.indexOf('完整的非浏览器发布门禁：');
  const browserStart = readme.indexOf('## 浏览器 QA');
  const browserEnd = readme.indexOf('## 资源与发布');
  const nonBrowser = readme.slice(nonBrowserStart, browserStart);
  const browser = readme.slice(browserStart, browserEnd);

  assert.doesNotMatch(nonBrowser, /resource-budget/);
  assert.match(browser, /qa-resource-budget\.mjs/);
});

test('README installs Chromium before starting browser QA preview', () => {
  const readme = read('README.md');
  const browserStart = readme.indexOf('## 浏览器 QA');
  const browserEnd = readme.indexOf('## 资源与发布');
  const browser = readme.slice(browserStart, browserEnd);

  assertOrdered(browser, [
    'pnpm exec playwright install chromium',
    'pnpm run preview -- --port=4173',
    'pnpm run qa:map-migration'
  ], 'README browser QA setup');
});

test('release documentation contains reproducible commands, thresholds, ownership, and pending evidence', () => {
  const readme = read('README.md');
  const verification = read('docs/PRODUCTION_VERIFICATION.md');
  const docs = `${readme}\n${verification}`;

  for (const fragment of ['70 张卡牌', '24 件正式遗物', '28 种敌人', '21 个事件', '9 条角色结局']) {
    assert.match(readme, new RegExp(fragment));
  }
  assert.match(readme, /https:\/\/niuniumi\.github\.io\/ashen-pilgrimage\//);
  assert.match(readme, /docs\/PRODUCTION_VERIFICATION\.md/);
  for (const command of [
    'pnpm run assets:verify',
    'pnpm test',
    'pnpm build',
    'pnpm exec vite build --base=/ashen-pilgrimage/',
    'pnpm run qa:map-migration',
    'pnpm run qa:progression',
    'pnpm run qa:chapter-transition',
    'pnpm run qa:resume-stages',
    'pnpm run qa:role-matrix',
    'pnpm run qa:full-flow',
    'pnpm run qa:release-flow',
    'pnpm run qa:product-upgrade-scenes',
    'pnpm run qa:pixel-scenes',
    'pnpm run qa:responsive-facing',
    'qa-resource-budget.mjs',
    'pnpm run qa:deploy-smoke -- --url='
  ]) {
    assert.match(docs, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(verification, /1600\s*KB/i);
  assert.match(verification, /24\s*个请求/);
  assert.match(verification, /6\s*MiB/i);
  assert.match(verification, /CI.*Pages|Pages.*CI/s);
  assert.match(verification, /待主会话填写/);
  assert.match(verification, /https:\/\/docs\.github\.com\/en\/pages\/getting-started-with-github-pages\/using-custom-workflows-with-github-pages/);
  assert.match(verification, /https:\/\/vite\.dev\/guide\/static-deploy\.html/);
});
