# UI/UX 全量一致性审计清单

> 来源：`/goal`「美化UI优化UX,并审查一致性」全量审计
> 方法：静态源码审计（组件结构/样式 token）+ WCAG 对比度实算（脚本 `node /tmp/contrast.mjs`）
> 范围：pi 交互界面（TUI）——`packages/coding-agent/src/modes/interactive`（components 层 + theme 层）+ `packages/tui`（select-list / markdown）
> 前置：上一轮 `docs/ui-consistency-audit.md` 已修复「theme/show-images/thinking 选择器」并统一值列表约定；本轮为**全量复审**，聚焦仍存在的跨模块不一致。

## 结论摘要

四大块整体规范：无硬编码颜色、边框统一 light 风格、消息走 `LeftBarBox` 左状态条、diff 用 success/error/muted、spinner 按状态着色。**剩余不一致集中在两类**：

1. **面板标题样式分裂**（accent+bold vs 仅 bold vs 无标题）与**光标符号分裂**（`→ ` 值列表 vs `› ` 自定义列表）——历史遗留的模块各自实现。
2. **个别主题 token 对比度不达标**（`syntaxComment`、`thinkingMinimal`、`dim`），直接影响代码注释、thinking 最低档、footer/底部操作提示的可读性。

---

## A. 面板/选择器一致性（范围：全部顶层对话框）

### A1. 统一约定回顾（上一轮产物，基准）

```
DynamicBorder(theme.fg("border"))        ← 顶/底边框必填
Spacer(1)
 标题  theme.bold(theme.fg("accent", title))   ← 必填
[可选] 描述  theme.fg("muted", desc)
[可选] 键位/范围提示
[可选] 搜索输入框
Spacer(1)
 列表
Spacer(1)
[可选] 底部提示  theme.fg("dim", "  Enter to select · Esc to cancel")
DynamicBorder
```

### A2. 符合约定的面板 ✅

`theme`、`show-images`、`thinking`、`settings-selector`、`settings-submenu`、`oauth`、`scoped-models`、`trust`、`login-dialog`、`extension-selector`、`provider-wizard`、`first-time-setup` —— 均满足 accent+bold 标题 + 顶/底 DynamicBorder + 底部提示。

### A3. 标题样式分裂 ❌

同为「顶层选择」面板，标题着色不统一：

| 面板 | 现状 | 问题 |
|---|---|---|
| `session-selector.ts` | `theme.bold(title)` | 仅加粗，未用 accent |
| `user-message-selector.ts` | `theme.bold(t("Fork from Message"))` | 仅加粗，未用 accent |
| `tree-selector.ts` | `theme.bold(t("  Session Tree"))` | 仅加粗，未用 accent；且标题带前导双空格 |
| `config-selector.ts` | `theme.bold(project/global 标题)` | 头部行仅加粗，未用 accent |
| `model-selector.ts` | 无标题（仅有过滤/范围提示） | 完全无 accent+bold 标题 |

**引用：** 约定明确「默认色/不加粗不得用于面板标题」，统一 `theme.bold(theme.fg("accent", title))`。上述面板应补 accent 或加标题。

### A4. 光标符号分裂 ❌

- `→ `（值列表，`SelectList` / `SettingsList`）：theme、show-images、settings、trust、oauth、scoped-models、config、extension-selector、first-time-setup、model
- `› `（自定义列表）：`session-selector`、`tree-selector`、`user-message-selector`

**分析：** `→ ` 与 `› ` 两套并发。树形/会话/消息列表是分层或多行结构，用 `› ` 或为刻意区分；但 `user-message-selector` 是简单单选列表，与值列表同质却不一致。**建议**：非分层列表统一 `→ `；树形（tree）保留 `› `（配合 `│ └ ├` 连接符，功能需要）。

### A5. 其余确认项

- `SelectList.selectedPrefix` 恒被 `selectedText` 整行包裹覆盖，改动无效（上一轮已撤销，本轮不重改）。
- 值列表当前值标记统一 `✓ `；theme/show-images 因 `SelectList` 整行 accent 包裹，`✓` 为纯文本、随选中状态变色（已知取舍，不重改）。
- 底部提示存在于 theme/show-images/thinking/settings-submenu/model/extension 等；`config-selector`/`tree-selector`/`session-selector`/`user-message-selector` 有各自状态化提示，措辞与 `Enter to select · Esc to cancel` 不完全一致但为功能需要。

---

## B. 主题配色与对比度（实算 WCAG）

> 基准背景：暗色 `#16181e`（export.pageBg）与 `#1a1a1a`/`#0d1117` 典型暗底；亮色 `#ffffff` 与 `#f8f9fb`。终端 TUI 背景由用户决定，此处取代表值估算。

### B1. 达标（无需改动）✅

| token | 暗色底 | 亮色底 |
|---|---|---|
| text | 12.1–13.7 | 13.9–14.7 |
| muted | 5.4–6.1 | 4.4–4.6 |
| accent | 6.6–7.5 | 4.9–5.1 |
| success / error / warning | 6.3–10.4 | 4.6–5.4 |
| 各类 syntax（除 comment） | 7.2–12.5 | 4.8–14.7 |

### B2. 不达标（建议修复）❌

| token | 暗色底实测 | 亮色底实测 | 影响 |
|---|---|---|---|
| `syntaxComment` `#5b6b8c` | **3.12–3.54** | — | 代码注释可读性差（正文需 ≥4.5） |
| `syntaxComment` `#6e7781`（light） | — | 4.32–4.55 | 亮色边缘，接近但不稳 |
| `thinkingMinimal` dark `#4a5568` | **2.21–2.51** | — | thinking 最低档文案几乎不可读 |
| `thinkingMinimal` light `#b0b8c0` | — | **1.91–2.01** | 同上，且与边框色接近 |
| `dim` dark `#5c6673` | 2.86–3.25 | — | 底部操作提示 / footer / 快捷键键名（次级文案，3.0 偏弱） |
| `dim` light `#8b949e` | — | 2.92–3.08 | 同上 |

**修复建议：**
- `syntaxComment`（dark）提亮至 `#7d8bb3`（实测 5.25，目标 ≥4.5）。
- `thinkingMinimal`（dark）提亮至 `#6b7a99`（实测 4.11）、（light）**加深**至 `#828c9c`（实测 3.40；亮色主题需加深而非提亮）。目标 ≥3.0，它是最低档，允许偏弱但需可辨。
- `dim` 若大量承载 footer / 操作提示，可微调至暗色 `#6b7480`（3.75）/ 亮色 `#7d8794`（3.64），或对关键提示改用 `muted`。
- 备注：`border`/`borderMuted` 对比 1.3–2.0 属装饰性，刻意低调，不修。

### B3. 256 色模式

`theme.fg` 走向 `hexTo256` 时部分近似色可能失真（`syntaxComment`/`thinkingMinimal` 本就低对比，降维后更差）。建议在 B2 提亮后于 256 色模式复核。

---

## C. 消息与 diff 渲染（一致性）✅ 基本合规

- **消息左状态条** `LeftBarBox`：user→`accent`，custom→`customMessageLabel`，assistant 无左条（主输出，合理）。**一致**。
- **diff** `renderDiff`：`toolDiffAdded`=success、`toolDiffRemoved`=error、`toolDiffContext`=muted，行内变化用 `inverse`。**干净、对比良好**。
- **spinner/状态指示**：working/compaction/branch=accent，retry=warning，消息 muted。**一致**。
- **markdown**：走 `getMarkdownTheme`；代码块换行对齐已在上一轮修复。
- 无硬编码颜色，边框统一 light 风格。

**可优化点：**
- `MessageDivider` 用 `borderMuted`（暗色对比 ≈1.4）分隔消息轮次。多消息密集时分隔线可见性偏弱，可考虑 `borderAccent` 或加粗分隔；属锦上添花。
- `custom-message` 左条用 `customMessageLabel`（dark `#bb9af7`/light `#7e57c2`），与 user 的 accent 色不同——区分消息类型是刻意的，保留。

---

## D. footer / 快捷键提示

- **footer** `FooterComponent`：整行用 `theme.fg("dim", ...)`。pwd/分支/token/context%/模型 等实用状态全用最暗的 `dim`（约 3.0），**整体偏弱**。context% 已按阈值用 error(>90)/warning(>70)，良好。**建议**：核心状态用 `muted`、次要分隔用 `dim`，或整体提亮。
- **keybinding-hints**：`keyHint` = 键名 `dim` + 描述 `muted`。键名用最暗档、描述反更亮——通常键名应突出（accent/bold）以便扫读。但**回溯 #3 已明确「keyHint/rawKeyHint 被 40+ 处调用且样式一致，保持现状」**。改动会波及大量既有测试，属高成本低收益，**默认不动**，仅记录观察。

---

## 问题分级（供后续任务排期）

| 优先级 | 问题 | 涉及文件 | 建议动作 |
|---|---|---|---|
| **P1** | `syntaxComment`（dark）对比 3.2 | `theme/dark.json` | 提亮至 ≥4.5 |
| **P1** | `thinkingMinimal` 两套对比 2.0–2.5 | `theme/{dark,light}.json` | 提亮至 ≥3.0 |
| **P2** | 面板标题 accent+bold 不统一 | `session/user-message/tree/config-selector.ts`、`model-selector.ts` | 统一 `theme.bold(theme.fg("accent", ...))`（model-selector 需补标题） |
| **P2** | 光标 `→ ` vs `› ` 分裂 | `session/user-message-selector.ts` | 非分层列表统一 `→ ` |
| **P3** | `dim` 在 footer/提示偏弱 | `theme/{dark,light}.json` + `footer.ts` | 微提亮或关键提示改用 muted |
| **P3** | `MessageDivider` 边框偏淡 | `message-divider.ts` | 可换 borderAccent（可选） |
| P4 | `dim` 用于快捷键键名 | `keybinding-hints.ts` | **回溯 #3 保持现状，不改** |

> 注：本轮为**审计结论**，未改任何代码。后续如需落地，按 P1→P4 排期，P1/P2 优先，P4 明确跳过。

## 验证方法

- 对比度：`node /tmp/contrast.mjs`（复现 B 节矩阵）。
- 渲染：`cd packages/tui && node --test test/select-list.test.ts` 等组件测试；`npm run check`。
- 改动只读 JSON/单组件时不影响既有测试，可最小 diff 落地。
