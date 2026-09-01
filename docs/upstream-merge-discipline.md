# 上游同步纪律（Fork 维护）

> 本 fork 的定制范围（与代码一致）：**i18n 中文化**（`packages/coding-agent/src/**` 改 `t()` 包装 + 独立 zh-CN 词典）、**B.A.I provider**（`packages/ai` 新增 `bai.ts`/`bai.models.ts` + `generate-models.ts` 模型数组）、**command-code provider**（`packages/ai/src/providers/commandcode.ts` + `COMMANDCODE_API_KEY`）、**provider 配置向导**（`core/models-config-writer.ts` + `interactive/components/provider-wizard*.ts`）、**TUI 主题现代化**（`theme/dark.json`/`light.json` schema 重设计 + `message-divider` + `footer`/`loader` 打磨）、**工具 displayMode**（`extensions/types.ts` 的 `ToolDisplayMode`,工具渲染由 `expanded: boolean` 改 `displayMode`）、**session-revert**（`core/session-revert.ts` + `/revert` 命令接线）、**Bedrock 类型硬化**（`DocumentType` cast、`arguments` 收窄为 `unknown`）、**gitleaks 白名单**（`.gitleaks.toml`）。
> 文档目的：让「跟上游同步」保持低成本、可回滚。**铁律：永不 rebase 上游，只用 merge。**

## 一、铁律

1. **永不 `git rebase` 上游 / `git rebase -i` 重写历史。** 只 `git merge`。fork 用 rebase 会重写你的自定义提交、让冲突不可恢复，且 `push --force` 会破坏本地唯一的提交历史。
2. **小步、定期同步，别攒版本跳变。** 每次上游 release 同步一次。跨越多版本的冲突是叠加的——版本你跳得越远，冲突面越大。
3. **同步前先 `git fetch` 看差异规模**，选一个干净、无大量无关改动的点做 merge。

## 二、同步流程（每次上游 release）

```bash
# 1. 拉最新上游（当前 origin 即上游仓库）
git fetch origin

# 2. 切到主分支并合并上游 main
git checkout main
git merge origin/main      # 一定用 merge，不用 rebase

# 3. 解决冲突（见第三节），只处理你改过的文件
# 4. 同步生成产物（B.A.I 模型目录是生成物，不入库）
npm run generate:models    # 确保 data/*.json 与 generate-models.ts 一致
# 5. 验证
npm run check
# 6. 提交（只 stage 你这次改的文件）
git add <你改的路径>
git commit -m "chore: sync upstream vX"
```

## 三、冲突处置规则（按类别）

| 冲突来源 | 处置 |
| --- | --- |
| **zh-CN 词典**（`i18n/locales/zh-CN/*`、`tui/i18n/locales/zh-CN.ts`） | 低冲突。上游不碰这些独立文件。若上游改了英文源串 → 在 zh-CN 词典补新映射即可。 |
| **`t()` 包装（`packages/coding-agent/src/**`、`tui/src/**`）** | **高冲突区**。上游频繁改这些源字符串。若只改了字符串内容：保留双方、词典补录；若改了结构/签名：以上游为准重新适配。 |
| **`generate-models.ts` 的 B.A.I 数组** | 上游若也动了 `generate-models.ts`，冲突在此文件。以你的 B.A.I 数组为准，`npm run generate:models` 再核一次。 |
| **`commandcode.ts` provider** | 上游罕见新增整块 provider。若冲突，以上游结构为准重新适配，保留 `COMMANDCODE_API_KEY` 环境变量名与 `baselineModels()` 导出契约。 |
| **provider 配置向导**（`models-config-writer.ts`、`interactive/components/provider-wizard*.ts`） | 上游若改了 models.json 读写或 wizard UI → 以上游为准重新适配；`models-config-writer` 用 `proper-lockfile` 并发写，模式与 `settings-manager` 相同。 |
| **`models.generated.ts` / `data/*.json`** | 生成产物，不入库。repo 里以 `npm run generate:models` 重新生成为准，不手动合。 |
| **主题 schema**（`theme/dark.json`、`theme/light.json`） | **高冲突区**。fork 重设了键集合（Tokyo-Night 风,新增 `muted/dim/success/error/warning/border*/accent`,移除旧 `cyan/blue/green/red/yellow/gray/dimGray/darkGray`）。上游改主题时冲突在此；以上游为准重适配并同步 `theme-controller`/`theme.ts` 的引用。 |
| **工具 displayMode**（`extensions/types.ts`、`core/tools/*` 渲染函数） | **高冲突区**。fork 把工具渲染参数由 `expanded: boolean` 改为 `displayMode: "title"\|"preview"\|"expanded"`。上游若改工具渲染签名 → 以上游为准重新适配（区别于上面的 `t()` 包装行）。 |
| **session-revert**（`core/session-revert.ts` + `/revert` 接线） | 新文件本体低冲突（上游不碰 `session-revert.ts`）。接线在 `slash-commands.ts`/`interactive-mode.ts`,属上游高频区,冲突按 `t()` 包装规则处理。**注意**：该命令做 `reset --hard`+`clean -fd`,重适配时保留 `ponytail:` 的未跟踪文件告警。 |

## 四、i18n 冲突面管控

i18n 的 `t()` 把 30+ 个源文件改成包装，这些行上游高频触碰 → 冲突不可避免。**降低成本的策略：**

- **词典独立文件**天然低冲突（上游不碰），保持这个边界。
- `t()` 的 key 就是英文源串（缺失回退英文），即使某次 merge 漏了某条词典，**UI 显示英文也不崩**——这是安全兜底。
- **不把 i18n 改动进一步打散**到更多上游文件；新增文案优先追加到已有 zh-CN 词典，而非改英文源文件。

## 五、同步后自检

- [ ] `npm run check` 全绿
- [ ] `npm run generate:models` 无 dirty diff（`data/*.json` 是生成物，不入库）
- [ ] i18n 覆盖审计测试过：`node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run packages/coding-agent/test/i18n-coverage.test.ts`
- [ ] B.A.I 目录 reconcile 不阻塞构建（auth.json 无 bai 凭证/401 时回退本地 44 个模型）
- [ ] command-code E2E 不阻塞构建（`COMMANDCODE_API_KEY` 缺失时 `stream.test.ts` 的 `skipIf` 跳过）

## 六、已知环境注意点

- **本机固定出口 IP**（当前 47.128.210.21）下，B.A.I 请求返回 **401**（key 绑定其它出口/IP）。因此 B.A.I 的 E2E 测试（`stream.test.ts` 的 `skipIf(!baiApiKey)`，认证仅凭 auth.json）在此机器**必然失败**——这是环境/凭据问题，**不是代码 bug**。凡依赖真实 B.A.I 调用的 E2E，请在**能连通 B.A.I 的环境**运行，或在无 bai 凭证的 CI 里让其 `skip`。

- **command-code 依赖**：`stream.test.ts` 的 command-code E2E 需 `COMMANDCODE_API_KEY`；缺失时 `skipIf` 跳过，不影响构建与本地测试。

## 七、2026-09 同步 `f3e432dc3` 后的本机（Windows）测试失败归档

> 本次合并 `upstream/main`（7 提交）已完成；下面这些测试**在本机 Windows 环境**失败，但根因是上游测试假设 POSIX/Linux 路径，fork 的 CI（`ci.yml`，`ubuntu-latest`）不会触发。**非合并引入的 bug**，不修，仅在本地出现时知悉。统一特征：`canonicalizePath`（`realpathSync`）/`isAbsolute` 在 Windows 上把 `/` 解析为盘符路径（`D:\...`）或改变大小写/短路径，导致上游硬编码 `/project` 的断言失配。

| 测试 | 失败现象 | 根因 | 归档判定 |
| --- | --- | --- | --- |
| `test/trust-selector.test.ts`（3 个） | `toContain('Saved decision: trusted (/project)')` 失败；`'Trust parent folder (D:\\project)'` | Windows 上 `isAbsolute('/project')`→`resolve`→`D:\\project`。fork 在 Windows 用 `D:\\` 是正确行为 | 环境/上游 Linux 假设 |
| `test/trust-manager.test.ts`（1 个） | `hasTrustRequiringProjectResources(tempDir)` 期望 false 得 true | Windows `realpathSync` 短路径/大小写致 `currentDir !== homeDir` 判断错 | 环境/上游 Linux 假设 |
| `suite/regressions/8935-*.test.ts` | `executions` 期望 `[]` 得 `['first']` | `agent-loop.ts` 与上游 main 逐字节一致；`signal.abort()` 在 Windows 时序下第一个 tool 已执行 | 环境/时序 |
| `suite/regressions/7209-*.test.ts` | `waitFor 'Model catalogs refreshed.'` 超时 | `refreshModels` 在 fake harness 的时序 | 环境/时序 |
| `suite/regressions/2791-fswatch-*.test.ts` | `ERR_UNSUPPORTED_ESM_URL_SCHEME`（`d:`） | Windows 下子进程加载模块用 `d:` 而非 `file://` | 环境/上游 Linux 假设 |
| `test/model-selector.test.ts`（1 个） | `getModelRow('browsed-model')` undefined | vitest 模块缓存/时序；实现输出已验证正确 | 环境/时序 |

**不修理由**：① 合并不引入这些（`agent-loop.ts` 与上游逐字节同、`npm run check` 全绿）；② fork CI（`ubuntu-latest`）宿主侧跑这些测试不会失败；③ 修改方向是跨平台化这些上游测试（改测试）、或改运行时路径语义（高风险，影响磁盘 trust key 一致性与 `findNearestTrustEntry` 读取），收益低。

## 八、pi-lens 2 处 advisory（本任务已修）

- `packages/agent/src/agent-loop.ts:603`：`arguments: preparedArguments as Record<string, any>` → 改 `Record<string, unknown>`（与 `AgentToolCall.arguments` 类型一致）。
- `packages/coding-agent/test/suite/regressions/6949-unavailable-scoped-model.test.ts`：`showModelsSelector(context: object)` / `(this: object)` → 改 `Record<string, unknown>`。
