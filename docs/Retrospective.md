# Pi 复刻 Retrospective

### 1. 遗漏提交导致 clone 失败与信任损耗：AGENTS.md 与 README 仓库地址必须原子提交

- **教训**：`2026-08-31` 会话回退功能交付时，为“求快”以“仅提交本会话文件”为由搁置已脏的 `AGENTS.md` 中文化（3 行），且仅在 `README.md` 新增回退小节时未全局 `grep` 旧克隆地址 `Dazzle-sys/pi`。结果：新远端 `Personalized-Pi` 已推送，但 README 仍指向旧库，新人按文档 `git clone` 直接 404；规则文件与文档不一致迫使老大二次指正、额外两次 `fix/docs` 提交与推送，浪费时间并削弱对交付的信任。
- **修复**：`67f0406` 补缴 `AGENTS.md` 并将 README 中 `git clone`、`cd pi`、两处 wrapper（`$HOME/pi` / `$HOME\pi\pi-test.ps1`）及提示文案全量改为 `Personalized-Pi`，并重新 `git push`。后续凡涉远端/文档改动的任务，收尾前必 `grep -R "github.com"` + `git status --porcelain` 全量核对，遵循 `verification-before-completion` 先证据后断言。

### 2. 动态导入违规：禁止 `await import()` 破坏可静态分析性

- **教训**：`interactive-mode.ts:6662` 为图省事在方法内 `await import("../../core/session-revert.ts")`，违反 `AGENTS.md` “No inline imports — Top-level imports only” 与 erasable TS 约束，`npm run check` 虽过但 `tsgo` 静态性受损。
- **修复**：改为顶层 `import { describeSnapshot, executeRevert, type RevertSnapshot } from "../../core/session-revert.ts"`，并 `npm run check` 复验。

### 3. 克制的美化优于强改：别把视觉改动塞进刻意编码且已被测试的行为

- **教训**：2026-09-01 TUI/UX 现代化，原计划把 H1 标题去除下划线、给 keybinding 提示加 `[ ]` chip。但 `markdown.test.ts` 有两处用例明确断言 H1 带下划线（`\x1b[4m`）并在行内 code 后恢复（这是刻意行为），`keyHint/rawKeyHint` 被 40+ 处调用且样式已一致。改成 "现代" 反而要改一堆既有测试/波及面，违背「全面但克制」。
- **修复**：回退 H1 改动（markdown.ts 不动，`git checkout`），keybinding-hints 保持现状；可读性改由**配色 token**（Task 1/2 把 `mdHeading` 提亮为 `#c0caf5`）达成，而非改渲染结构。原则：能靠数据（主题 JSON）解决的视觉，不碰组件渲染；确要改渲染，先 `grep` 全部调用点与既有用例，冲突则征询后再动。

### 4. `npm run check` 在 base main 即失败：先确认预存错误归属再谈提交门槛

- **教训**：UI 改动完成后跑 `npm run check` 报 804 个 `TS2345 ... not assignable to type 'never'`（722 在 `test/*`，82 在 `packages/ai/src/providers/*.models.ts`），无一在我的改动文件。
- **误诊**：最初归因于「`models.generated.ts` 生成漂移」——错。
- **真根因**：`packages/ai/src/providers/data/*.json`（`data/*.json` 是 **gitignore 的生成产物**）在新建的 git worktree 里**缺失**。`.models.ts` 用 `import values from "./data/*.json" with { type: "json" }` 读取它：文件不存在时 `tsgo` 把它推断为 `unknown`，传给 `flattenModelCatalog<..., TGroups extends ModelGroups>` 满足不了约束→泛型塌缩成 `never`→模型 ID 联合变 `never`→800+ 处 `not assignable to never`。主工作树因之前已 `npm run generate:models` 生成过 `data/`，所以正常；worktree 不带 gitignore 文件、又没有 `prepare`/`postinstall` 钩子自动生成，才失败。
- **修复**：`npm run generate:models`（root，内含 `node scripts/generate-models.ts --strict`）重新生成 `data/*.json`（gitignore，不提交；`models.generated.ts`/`.models.ts` 未变，`image-models.generated.ts` 也回干净），`npm run check` 即绿。
- **教训沉淀**：① 新建 worktree/克隆后若 `check` 报大量模型类型 `never` 错，先确认 `data/*.json` 是否存在，跑 `npm run generate:models` 即可，别误判为生成漂移；② 遇到 base 就挂的检查，先 `git status`/落盘日志区分「本任务引入」vs「环境缺生成产物」，再如实上报，绝不含糊宣称全绿；③ 本机 `tmux` 不可用，交互目检改用测试断言替代。

### 5. git worktree 别放进仓库根内：会让主库 `npm run check` 报 biome 嵌套配置错

- **教训**：按 `using-git-worktrees` 默认把 worktree 建在 `pi/.worktrees/<branch>`（仓库内部）。完成后在主库跑 `npm run check`，biome 报「Found a nested root configuration, but there's already a root configuration」——它在遍历时把 worktree 里的 `biome.json` 当成了嵌套根配置，主库 check 直接失败。这是我在主库引入的回归（worktree 存在期间）。
- **修复**：合并完移除 worktree（`git worktree remove .worktrees/<b>` + `git worktree prune` + `git branch -d <b>`）后，主库 `npm run check` 即恢复。worktree 移除会连带清掉 **gitignore 的生成产物**（如 `data/*.json`），但主库自身的这些产物不受影响。
- **教训沉淀**：① 在仓库根内建 worktree 会影响主库的 biome/其它按目录发现配置的工具——要么放仓库外、要么完成后及时移除；② 移 worktree 前先确认分支已并入目标分支（`git branch --contains`）且 worktree 无未提交改动再删。

### 6. vitest 批量跑多文件会因全局状态污染产生假失败；区分「环境预存」与「本任务引入」

- **教训**：2026-09-02 UI 一致性执行，一次跑 `args.test.ts` + `resource-loader.test.ts` 报 4 个失败，单独跑 `args.test.ts` 却 81/81 全绿——是测试间共享的 `initTheme`/locale 全局状态互相污染，非我的改动。`session-selector-path-delete.test.ts` 报 `EPERM symlink`（Windows 无符号链接权限）、`package-command-paths.test.ts` 报「期待英文，实际中文」（本 fork 默认 zh-CN locale）——均为**预先存在的环境/语言失败**，与本次改动无关。
- **沉淀**：① 批量跑 vitest 多文件若出失败，先**单文件复跑**排除全局状态污染；② 环境类失败（`EPERM`/`symlink`、i18n 语言不匹配）要 `git status` 或落盘日志确认归属，再如实上报，别把环境失败记到任务头上；③ 受影响模块的验证以「单文件跑 + `npm run check`」为准，不被无关文件的预存失败干扰。

### 7. Windows 跨平台测试/路径三坑：junction、path.sep、locale 固定

- **教训**：2026-09-02 处理预存测试失败，三个坑都源于 Windows 与 CI（Linux/en）差异。
  - `symlinkSync` 在 Windows 需管理员/开发者模式，`EPERM`；目录别名改用**junction**（`process.platform === "win32" ? "junction" : undefined`）免权限，realpath 解析一致，测试通过。
  - `path.relative` 在 Windows 产出**反斜杠**；config-selector 资源 pattern 直接存进 settings，导致 `\` 不可移植。修复：复用 `package-manager.toPosixPath`（`.split(sep).join("/")`）归一化为 `/`（package-manager 早已用此约定，config-selector 未跟进）。
  - 断言英文串的 CLI 测试在 zh locale 机器失败（`main()` 每次 `applyLocaleSetting()` 从环境解析）；修复：测试 `beforeEach` 里 `vi.stubEnv("PI_LOCALE", "en")` + `setLocale("en")`（`main()` 仅 print/json 才强制 en，故需同时改环境）让断言确定性复现。
- **沉淀**：① Windows 上目录 symlink 用 junction 免提权；② 任何写入 settings/跨平台格式的 `path.relative` 输出应过 `toPosixPath`；③ 断言英文的 CLI/自更新测试须固定 locale（环境变量 + setLocale 双保险），避免被机器 `LANG`/`LC_ALL` 影响。
