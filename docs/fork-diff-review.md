# Fork 与上游差异审查报告

> 本文面向 fork 维护者,用于掌握本 fork 相对上游的定制范围与持续维护成本。
> 配套文档:`docs/upstream-merge-discipline.md`(同步纪律,权威的定制范围 + 冲突处置清单)。
> 审查基准:上游 `earendil-works/pi`,fork 为 `Dazzle-sys/Personalized-Pi`。

## 结论摘要

| 项 | 值 |
| --- | --- |
| 项 | 值 |
| --- | --- |
| 上游基线 | `earendil-works/pi` @ `853a80d26`(原始分叉点) |
| 上游当前 HEAD | `b8b873b98`(已全部并入) |
| 当前 merge-base | `b8b873b98` == `upstream/main`(完全同步) |
| 本地 HEAD | `0a501fdfb`(merge: integrate upstream/main) |
| 是否落后 | 否。已 `git merge upstream/main` 并入上游 3 个提交,merge-base == upstream/main |
| 净差异 | 173 文件,+7728 / −1828(相对 `upstream/main`,已排除上游新提交) |
| fork 自研提交 | 35 个(含 3 个 merge: f3e432dc3 / 19c07717c / 0a501fdfb,无 rebase) |

> 2026-09-02 同步:并入上游 3 个提交(`b8b873b98` suppportMaxOutputTokens、`605a1b038` SIGWINCH seccomp、`3205678b3` approve contributors),`packages/ai/src/types.ts` 自动合并(fork 改 `KnownProvider`/`ToolCall.arguments`,上游改 `OpenAIResponsesCompat`,区域不同无冲突)。**当前工作树另有未提交改动**:CI 合规门禁与 `docs/license-compliance.md` 声明、`.gitleaks.toml` 已移除;单行 footer 与扩展 i18n(tps.ts)在途——这些尚未计入上表净差异。

> 2026-09-01 深度核验:`npm run check` 工具链(tsgo、biome、ts-relative-imports、pinned-deps)全部通过;fork 新增测试(session-revert、models-config-writer、i18n-coverage、provider-wizard、language-setting、footer、message-divider、theme-*、tui 侧)全绿。核验中发现并修复一处 i18n 回归:主题选择器 `t("  Automatic")` 键值带前导空格,与 zh-CN 词典 `Automatic` 不匹配导致回退英文,已改为 `\`  ${t("Automatic")}\``(保持缩进对齐、键不掺杂空格),并由新增的`i18n-coverage.test.ts` 兜底防回归。

合并纪律与 `docs/upstream-merge-discipline.md` 一致:**只 merge、不 rebase**。工作树干净,无冲突标记残留。

上游基线 `853a80d26` 为原始分叉点;local HEAD 累计通过 3 个 merge 提交(`f3e432dc3` 并入上游 7 个、`19c07717c` 并入 tui-ux-refresh、`0a501fdfb` 并入最新 3 个)承接上游全部内容,因此本地严格超前、无缺口。

## 差异分类索引

> 每类的合并冲突处置详见 `docs/upstream-merge-discipline.md`「冲突处置规则」。此处仅作快照索引。

| # | 类别 | 涉及文件(要点) |
| --- | --- | --- |
| 1 | i18n 中文化(核心,量最大) | `coding-agent/src/i18n/*`、`locales/zh-CN/*`、`tui/src/i18n/*` |
| 2 | B.AI + command-code provider | `ai/src/providers/{bai,bai.models,commandcode}.ts`、`generate-models.ts`、`env-api-keys.ts` |
| 3 | Provider 配置向导 | `core/models-config-writer.ts`、`interactive/components/provider-wizard*.ts` |
| 4 | session-revert `/revert` | `core/session-revert.ts`、`slash-commands.ts` |
| 5 | TUI 主题现代化 | `theme/{dark,light}.json`、`components/message-divider.ts`、`footer.ts`、`loader.ts` |
| 6 | 工具 displayMode | `extensions/types.ts` 的 `ToolDisplayMode`、`core/tools/*` 渲染函数 |
| 7 | 类型硬化 | `bedrock-converse-stream.ts`、`agent-loop.ts` |
| 8 | 构建/模型数据自生成 | 根 `package.json` 的 `prepare` 钩子、`.gitignore` |
| 9 | 默认值调整 | 列表密度、agent retry、TUI alt-screen 等 |
| 10 | 文档 | `README.md`、`AGENTS.md`、`docs/{lessons,upstream-merge-discipline}.md` |

## 风险与告诫

### 1. session-revert 是破坏性 git 操作(已修复)

- **已修复**：`executeRevert` 不再用 `git clean -fd` 全量删除未跟踪文件。会话创建时在 `RevertSnapshot` 中记录**会话开始时已存在的未跟踪文件集**（`untrackedFiles`），回退时按该集精准删除**会话期间新增**的未跟踪文件，保留既有文件。新增回归测试 `test/session-revert.test.ts`「回退后保留既有未跟踪文件」覆盖。
- `stash create` 产生的是孤儿 stash 提交；回退用 `git stash apply --index <sha>` 恢复已跟踪改动（裸 commit 经 `stash apply` 会报 invalid reference，因此实际上过去 stash 恢复路径并不可靠——现仍保留该行为，但因 `reset --hard` 已把跟踪文件还原到 HEAD，stash 应用仅补充 index+工作区脏改动，作用有限）。
- `snapshot.cwd` 校验段是死代码:check 存在但 return 已注释,仅作记录,逻辑上未生效(代码里有 `ponytail:` 注释自承)。

### 2. i18n 高冲突面(持续维护成本)

- `t()` 包裹触及 30+ 上游高频改动文件,`docs/upstream-merge-discipline.md` 已标为"高冲突区"。合并上游每次大概率要处理这些文件(结构/签名冲突需以上游为准重适配)

### 3. 主题 schema 与上游分叉

- `dark.json/light.json` 键集合与上游不同;上游未来若改主题,这里必然冲突。fork 内部已自洽(无旧键残留),但同 upstream 合并时是固定冲突点

### 4. command-code provider 启发式脆弱

- 靠 model id 前缀(`claude`/`deepseek`/`gpt-5`)推断 reasoning,若上游/云端模型命名变化会误判;无 reasoning 元数据兜底

### 5. models-config-writer 忙等(已修复)

- `acquireLockSyncWithRetry` 原用空 `while(Date.now()-start<delayMs){}` 忙等 20ms×10 次(为对齐 settings-manager 的同步语义)。**已修复**为 `Atomics.wait` 阻塞同步睡眠,消除 CPU 空转,保持同步语义不变。

### 6. fork 默认值偏离上游

- agent 重试次数、列表密度、默认 alt-screen 等默认参数被改,若用户期望上游行为需注意

## 待办(已完成)

1. ~~session-revert 取消 `clean -fd` 全量删除,改为按快照未跟踪文件集精准删除,避免误删用户既有未跟踪文件~~
   - 做法：`RevertSnapshot.untrackedFiles` 记录会话开始时的未跟踪文件集;回退时用 `git ls-files --others --exclude-standard -z` 取当前集,`comm` 差集删除会话期间新增文件。
2. ~~`models-config-writer.ts` 忙等改为 `Atomics.wait` 同步阻塞睡眠~~

## 核对方法

在仓库根目录执行,可复现本报告数据:

```bash
# 上游拓扑与差异规模
git merge-base upstream/main origin/main        # 上游基线
git log --oneline upstream/main..HEAD           # fork 自研提交
git diff upstream/main HEAD --stat              # 净差异规模
git diff upstream/main HEAD --name-status       # 变更文件清单

# 分叉点
git merge-base upstream/main HEAD
```
