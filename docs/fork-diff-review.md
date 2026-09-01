# Fork 与上游差异审查报告

> 本文面向 fork 维护者,用于掌握本 fork 相对上游的定制范围与持续维护成本。
> 配套文档:`docs/upstream-merge-discipline.md`(同步纪律,权威的定制范围 + 冲突处置清单)。
> 审查基准:上游 `earendil-works/pi`,fork 为 `Dazzle-sys/Personalized-Pi`。

## 结论摘要

| 项 | 值 |
| --- | --- |
| 上游基线 | `earendil-works/pi` @ `853a80d26`(分叉点) |
| 上游当前 HEAD | `3fc3ef532`(与本地 `upstream/main` 一致) |
| 本地 HEAD | `ccc16fd08` |
| 是否落后 | 否。`upstream/main` 是本地 HEAD 的祖先,上游全部提交已并入 |
| 净差异 | 172 文件,+7552 / −1828(相对 `upstream/main`) |
| fork 自研提交 | 32 个(含 2 个 merge 提交,无 rebase) |

合并纪律与 `docs/upstream-merge-discipline.md` 一致:**只 merge、不 rebase**。工作树干净,无冲突标记残留。

上游基线 `853a80d26` 为分叉点;local HEAD 通过一个 merge 提交(`f3e432dc3`,并入上游 7 个提交)承接了上游全部内容,因此本地严格超前、无缺口。

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
| 8 | 构建/模型数据自生成 | 根 `package.json` 的 `prepare` 钩子、`.gitleaks.toml`、`.gitignore` |
| 9 | 默认值调整 | 列表密度、agent retry、TUI alt-screen 等 |
| 10 | 文档 | `README.md`、`AGENTS.md`、`docs/{lessons,upstream-merge-discipline}.md` |

## 风险与告诫

### 1. session-revert 是破坏性 git 操作(高优先)

- `executeRevert` 会 `git reset --hard` + `git clean -fd`:未跟踪文件(用户新建、未 add 的文件)会被 `clean -fd` 直接删除。`stash create` 只覆盖已跟踪文件,快照不含未跟踪内容 → revert 后这些文件不可恢复
- `stash create` 产生的是孤儿 stash 提交(不入 stash reflog),后续 `stash apply --index <sha>` 较脆弱
- `snapshot.cwd` 校验段是死代码:check 存在但 return 已注释,仅作记录,逻辑上未生效(代码里有 `ponytail:` 注释自承)

### 2. i18n 高冲突面(持续维护成本)

- `t()` 包裹触及 30+ 上游高频改动文件,`docs/upstream-merge-discipline.md` 已标为"高冲突区"。合并上游每次大概率要处理这些文件(结构/签名冲突需以上游为准重适配)

### 3. 主题 schema 与上游分叉

- `dark.json/light.json` 键集合与上游不同;上游未来若改主题,这里必然冲突。fork 内部已自洽(无旧键残留),但同 upstream 合并时是固定冲突点

### 4. command-code provider 启发式脆弱

- 靠 model id 前缀(`claude`/`deepseek`/`gpt-5`)推断 reasoning,若上游/云端模型命名变化会误判;无 reasoning 元数据兜底

### 5. models-config-writer 忙等

- `acquireLockSyncWithRetry` 用空 `while(Date.now()-start<delayMs){}` 忙等 20ms×10 次(为对齐 settings-manager 的同步语义)。并发小,可接受,但纯 CPU 空转

### 6. fork 默认值偏离上游

- agent 重试次数、列表密度、默认 alt-screen 等默认参数被改,若用户期望上游行为需注意

## 待办(尚未实施)

1. session-revert 上线前给 `clean -fd` 加显式确认,或改用 `stash push --include-untracked` + `checkout` 方式,避免误删用户未跟踪文件
2. `models-config-writer.ts` 的忙等可换成 `Atomics.wait` 或 `proper-lockfile` 异步重试,消除空转

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
