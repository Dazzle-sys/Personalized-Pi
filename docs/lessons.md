# Pi 复刻 经验教训

### 1. 遗漏提交导致 clone 失败与信任损耗：AGENTS.md 与 README 仓库地址必须原子提交

- **教训**：`2026-08-31` 会话回退功能交付时，为“求快”以“仅提交本会话文件”为由搁置已脏的 `AGENTS.md` 中文化（3 行），且仅在 `README.md` 新增回退小节时未全局 `grep` 旧克隆地址 `Dazzle-sys/pi`。结果：新远端 `Personalized-Pi` 已推送，但 README 仍指向旧库，新人按文档 `git clone` 直接 404；规则文件与文档不一致迫使老大二次指正、额外两次 `fix/docs` 提交与推送，浪费时间并削弱对交付的信任。
- **修复**：`67f0406` 补缴 `AGENTS.md` 并将 README 中 `git clone`、`cd pi`、两处 wrapper（`$HOME/pi` / `$HOME\pi\pi-test.ps1`）及提示文案全量改为 `Personalized-Pi`，并重新 `git push`。后续凡涉远端/文档改动的任务，收尾前必 `grep -R "github.com"` + `git status --porcelain` 全量核对，遵循 `verification-before-completion` 先证据后断言。

### 2. 动态导入违规：禁止 `await import()` 破坏可静态分析性

- **教训**：`interactive-mode.ts:6662` 为图省事在方法内 `await import("../../core/session-revert.ts")`，违反 `AGENTS.md` “No inline imports — Top-level imports only” 与 erasable TS 约束，`npm run check` 虽过但 `tsgo` 静态性受损。
- **修复**：改为顶层 `import { describeSnapshot, executeRevert, type RevertSnapshot } from "../../core/session-revert.ts"`，并 `npm run check` 复验。
