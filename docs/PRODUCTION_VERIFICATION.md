# v2.3.0 生产验证手册

本文固定《灰烬圣途》v2.3.0 的本地、CI 与 GitHub Pages 验证边界。命令默认从仓库根目录执行，环境为 Node.js 24、pnpm 11.7；浏览器 QA 还需要 Playwright Chromium。

## 非浏览器门禁

```bash
pnpm install --frozen-lockfile
pnpm run assets:verify
pnpm test
pnpm run qa:design-tokens
pnpm run qa:content-schema
pnpm run qa:asset-manifest
pnpm run qa:visual-bindings
pnpm run qa:battle-mechanics
pnpm run qa:battle-layout
pnpm run qa:simulation
pnpm build
pnpm exec vite build --base=/ashen-pilgrimage/
```

## 浏览器门禁

先构建并启动同一份 `dist`：

```bash
pnpm build
pnpm exec playwright install chromium
pnpm run preview -- --port=4173
```

等待 `http://127.0.0.1:4173/` 返回成功状态后，在另一个终端执行：

```bash
pnpm run qa:map-migration -- --url=http://127.0.0.1:4173/
pnpm run qa:progression -- --url=http://127.0.0.1:4173/
pnpm run qa:chapter-transition -- --url=http://127.0.0.1:4173/
pnpm run qa:resume-stages -- --url=http://127.0.0.1:4173/
pnpm run qa:role-matrix -- --url=http://127.0.0.1:4173/
pnpm run qa:full-flow -- --url=http://127.0.0.1:4173/
pnpm run qa:release-flow -- --url=http://127.0.0.1:4173/
pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4173/
pnpm run qa:pixel-scenes -- --url=http://127.0.0.1:4173/
QA_URL=http://127.0.0.1:4173/ pnpm run qa:responsive-facing
pnpm exec node scripts/qa-resource-budget.mjs --url=http://127.0.0.1:4173/
```

Windows PowerShell 下，`responsive-facing` 使用：

```powershell
$env:QA_URL='http://127.0.0.1:4173/'
pnpm run qa:responsive-facing
```

## 验收阈值

| 验证项 | 通过阈值 |
| --- | --- |
| 素材、单元与合同测试 | 命令退出码为 0；0 个失败；素材清单无缺失或漂移 |
| 静态内容与战斗模拟 | 所有脚本退出码为 0；无 schema、绑定、机制或确定性错误 |
| Vite 构建 | 两种 base 构建均退出码为 0 且输出 0 warning；继续显示原始与 gzip 体积 |
| 启动 bundle | `chunkSizeWarningLimit` 固定为 1600 KB，不再扩大；超过即重新评估资源或架构 |
| 首屏资源 | 最多 24 个请求，编码体积不超过 6 MiB；不得预载三章战斗/地图资源或后期首领资源 |
| 浏览器 QA | 每个脚本退出码为 0；脚本收集的 page error、console error 与状态断言全部为空或通过 |
| Pages 字体 | `dist/index.html` 的 preload 与 font-face 均包含 `/ashen-pilgrimage/assets/fonts/` |

## CI 与 Pages 职责

- `CI` 对 `main` push 和 pull request 执行完整素材、单元、静态、模拟、构建及本地 preview 浏览器门禁；preview 进程必须由 shell `trap` 清理。CI 不部署站点。
- `Deploy GitHub Pages` 通过 `workflow_run` 等待 `CI` 完成；自动路径只接受同仓库 `main` 的成功 push，并 checkout `github.event.workflow_run.head_sha`。Pages/OIDC 写权限只授予 deploy job；`workflow_dispatch` 作为人工恢复入口保留。
- Pages 使用 `--base=/ashen-pilgrimage/` 构建 `dist`，上传 Pages artifact，完成部署后再对实际 `page_url` 执行线上 smoke，避免失败 CI 与部署竞速。
- action major 保持当前边界：`checkout@v6`、`pnpm/action-setup@v6`、`setup-node@v6`、`configure-pages@v5`、`upload-pages-artifact@v4`、`deploy-pages@v4`。

## 线上验证

Pages workflow 使用 `DEPLOY_URL=${{ steps.deployment.outputs.page_url }}` 运行 `pnpm run qa:deploy-smoke`。本地复验必须使用环境变量或 `--url=`，不能使用位置参数：

```bash
pnpm run qa:deploy-smoke -- --url=https://niuniumi.github.io/ashen-pilgrimage/
```

部署后人工复核在线地址、版本文本、字体请求和三名角色的启动战斗流程。不要提交 `qa/` 生成的报告或截图。

## 最终运行记录

本地记录时间：`2026-07-16 20:15:11 +08:00`。GitHub 项目仅在实际 workflow 与线上 smoke 完成后填写，不预先伪造发布结果。

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 合同测试 | 通过 | 发布合同 10/10；选择、续玩和视觉 QA 合同全部纳入完整测试 |
| 完整测试与素材校验 | 通过 | 147/147；38/38 无损运行时图像；70 卡、24 正式遗物、28 敌人、21 事件、3 章 |
| 根路径与 Pages base 构建 | 通过 | 两种构建均 0 warning；主 JS 1524.05 kB / gzip 434.29 kB；Pages 字体 URL 2/2 正确 |
| 本地 Chromium 矩阵 | 通过 | 三章/断点/迁移/单次结算、三角色、28 敌人、9 像素场景、40 产品截图、响应式与暂停菜单全部通过；首屏 16 请求 / 3.14 MiB |
| CI | 待主会话填写 | GitHub Actions run URL |
| Pages 部署与线上 smoke | 待主会话填写 | deployment URL 和 Actions step |

## 官方依据

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Actions workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)
- [Vite 静态部署与 GitHub Pages base](https://vite.dev/guide/static-deploy.html)
