# Pi 复刻 经验教训

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

- **教训**：UI 改动完成后跑 `npm run check` 报 804 个 `TS2345 ... not assignable to type 'never'`（722 在 `test/*`，82 在 `packages/ai/src/providers/*.models.ts`），无一在我的改动文件。这是 `packages/ai` 模型目录生成（`models.generated.ts` 与 provider models）在 base main 已漂移导致的预存问题，与本任务无关。
- **修复**：用 `npm run check > /tmp/check.log` 落盘后 `grep` 我改动的具体文件，确认零新增；不擅自去修 804 个模型类型错（AGENTS 规定 `models.generated.ts` 只能走 `generate-models.ts` 重生成，且属独立维护事项）。遇到 base 就挂的检查，先 `git status`/落盘日志区分「本任务引入」vs「base 预存」，再如实上报，绝不含糊宣称全绿。本机 `tmux` 不可用，交互目检改用测试断言替代。
