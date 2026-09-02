# UI 风格一致性审计清单

> 来源:`/goal`「美化UI优化UX,解决风格不一致」任务 1
> 方法:静态源码审计(颜色/边框/token 使用)+ VirtualTerminal 实机渲染对比
> 范围:pi 交互界面(TUI)——`packages/coding-agent/src/modes/interactive` 组件层

## 结论摘要

代码层整体规范:主题 token 完整(36+ 颜色)、无硬编码 ANSI/hex/chalk 颜色、边框字符统一为 light 风格(─ │ ┌ ┐ └ ┘)、所有颜色取色均走 `theme.fg/bg`。**不一致集中在「顶层选择器面板」的呈现结构、标题样式、选中标记、帮助提示四类**,以及少量布局间距问题。

顶层面板带边框(上下 `DynamicBorder`)的有:config、settings、model、thinking、theme、show-images、oauth、scoped-models、tree、trust、user-message、extension-*、login-dialog、provider-wizard、first-time-setup。

---

## A. 面板呈现结构不一致(核心)

同为「从一组值里选一个」的**顶层单选面板**,四种风格并存:

| 面板 | 上下边框 | 标题 | 副标题/键位提示 | 搜索框 | 底部帮助 |
|---|---|---|---|---|---|
| thinking-selector | ✅ | ✅ | ✅ | ✅ | ✅ |
| model-selector | ✅ | ✅(scope/提示) | ✅ | ✅ | ✅ |
| settings-selector / submenu | 内嵌无 | ✅ | ✅ | 可选 | ✅ |
| **theme-selector** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **show-images-selector** | ✅ | ❌ | ❌ | ❌ | ❌ |

**问题点**:`theme-selector`(`theme-selector.ts`)与 `show-images-selector`(`show-images-selector.ts`)打开时只有上下边框 + 裸列表,既无标题也无操作提示。用户打开后不清楚这是什么列表、如何操作;与同级选择器(thinking/model/settings 均有标题 + 提示)风格明显割裂。

渲染证据(去色后,width=80):

```
# theme-selector
──────────────────────────────────
→ dark        (current)
  light
──────────────────────────────────

# show-images-selector
──────────────────────────────────
→ Yes         Show images inline in terminal
  No          Show text placeholder instead
──────────────────────────────────

# thinking-selector
──────────────────────────────────
Thinking Level
  ... cycles thinking levels in-session
>
    off       No reasoning
→ ✓ medium    Moderate reasoning (~8k tokens) · default
  Enter to select · Ctrl+S to set as default · Esc to cancel
──────────────────────────────────
```

---

## B. 标题样式不一致

顶层面板标题的着色方式不统一:

- `settings-submenu.ts`:`theme.bold(theme.fg("accent", title))` → **accent + bold**
- `oauth-selector.ts`:`theme.fg("accent", theme.bold(title))` → accent + bold(顺序不同,效果同)
- `thinking-selector.ts`:`new Text(t("Thinking Level"), 0, 0)` → **默认色、不加粗**
- `model-selector.ts`:自定义 scope/提示行,风格独立

**问题点**:同为面板标题,有的用 accent 高亮 + 加粗,有的用默认正文色。thinking-selector 标题未按 accent 风格处理,与其它面板不统一。

---

## C. 选中标记 vs 当前值标记表达不一

「键盘光标选中项」与「当前设置值」的标记组合在不同面板写法不同:

- `select-list.ts`(theme/show-images/settings 统一):仅选中项 → `→ `
- `thinking-selector.ts`:选中 `→ ` + 当前值 `✓ `(`→ ✓ medium`)
- `model-selector.ts`:选中 `→ `(accent)+ 当前模型/scope `✓ `(accent)

**问题点**:当前值标记 `✓ ` 在 thinking 与 model 有,在 theme/show-images 无(它们没有"当前值"概念,theme 用 description "(current)" 表达)。表达当前值的方式:theme 用 `(current)` 后缀,thinking 用 `✓ ` 前缀。需要统一「当前值」的视觉符号。

---

## D. 底部帮助提示不统一

- `settings-submenu`:`  Enter to select · Esc to go back`
- `thinking-selector`:`  Enter to select · Ctrl+S to set as default · Esc to cancel`(含 Ctrl+S,提示更完整)
- `theme-selector` / `show-images-selector`:**无任何提示**

**问题点**:部分面板有操作提示、部分没有;提示词部分用 `·` 分隔、`go back`/`cancel` 措辞不一。

---

## E. 布局与间距

- `SelectList` 接口定义了 `selectedPrefix`,但 `select-list.ts` 实现里选中项前缀**硬编码为 `"→ "`**,从未读取 `selectedPrefix`(接口形同虚设)。`settings-list.ts` 的 `cursor` 同样硬编码 `"→ "`。→ 语义重复、可读性差,且若未来想改前缀需改多处。
- `thinking-selector` 列表在 label 前用固定 2 空格 + `✓ ` 占位,导致其描述列与 theme/show-images 的列起点略有错位(属列宽计算差异,非明显 bug,但可通过统一标记宽度改善)。

---

## F. 颜色与对比度(待实机二次确认)

默认 dark/light 主题 token 完整且对比度均衡(宏观无低对比问题)。以下为**潜在场景**,待真实终端 + 256 色模式验证:

- `syntaxComment` 在 dark(`#5b6b8c`)上对比偏低;256 色模式下 `theme.fg` 会走 `hexTo256`,部分近似色可能失真。
- `thinkingMinimal`(dark `#4a5568` / light `#b0b8c0`)接近边框色,在暗背景下可能不清晰。
- `export.pageBg/cardBg/infoBg` 仅 light 提供,HTML 导出在 dark 下的卡片背景表现待查。

> 注:颜色/对比度属任务 4「主题配色」专项,本清单仅记录初步候选,需实机确认后再修。

---

## 已确认无问题的部分(不修)

- 无硬编码颜色:全库无 `chalk.rgb/hex/ansi`、无裸 `#ffffff`、无 `\x1b[38;5..` 硬编码。
- 边框字符统一为 light 风格;树形选择器(tree/session)用 `│ └ ├` 属功能需要,合理。
- 配置面板(config-selector)自带外边框,其内部 submenu 无边框是嵌套结构所致,合理。
- markdown / 语法高亮 / 工具diff 均走主题 token,一致。

---

## 统一约定(规范,任务 2 产物)

以「多数派 / 更完整既有做法」为基准,向 thinking / settings 面板对齐。以下为**顶层单选对话框**的强制规范:

### 1. 面板结构(自上而下)
```
DynamicBorder  (theme.fg("border"))  ← 边框必填
Spacer(1)
 标题        theme.bold(theme.fg("accent", title))   ← 必填
[可选] 描述   theme.fg("muted", desc)
[可选] 键位/范围提示  theme.fg("muted", hint)
[可选] 搜索输入框
Spacer(1)
 列表        SelectList / SettingsList
Spacer(1)
[可选] 底部提示 theme.fg("dim", hint)
DynamicBorder
```

### 2. 具体规则
- **边框**:顶层对话框统一 `DynamicBorder` 默认色(`theme.fg("border")`)。不使用 borderAccent / borderMuted 作为对话框框体(它们仅用于编辑器边框、thinking 级别等语义)。
- **标题**:统一 `theme.bold(theme.fg("accent", title))`。默认色/不加粗不得用于面板标题。
- **当前值标记**:统一前缀 `✓ `,替代 `(current)` 后缀。accent 上色仅适用于手动渲染行的面板(thinking/model);theme/show-images 走 `SelectList`,整行被 `selectedText` 以单一 accent 色包裹,label 内无法仅给 `✓` 上色——若注入 ANSI reset 会重置整行着色,故该两处 `✓` 为纯文本。
- **选中标记**:`→ `(accent),由 SelectList/SettingsList 统一处理。
- **底部提示**:统一文案 `  Enter to select · Esc to cancel`。需要额外快捷键时追加 ` · <键> …`(如 thinking 的 `· Ctrl+S to set as default`)。措辞统一 `cancel`;**内嵌二级菜单(如 `settings-submenu`)语义为「返回上级」,保留 `go back`**,`cancel` 仅用于顶层弹窗。
- **间距**:面板内容与边框之间、标题与内容之间、列表上方/下方统一 `Spacer(1)`。

### 3. 清理项(审查后决定不做)
- `SelectList.selectedPrefix` 恒被 `selectedText` 整行包裹覆盖,即便让实现读取它也不产生任何区分;让它真正生效需重构选中项的前缀/文字着色分离,属破坏性改动。按「最小影响」原则**不改动**,保留硬编码 `"→ "`。
- `settings-list.ts` 光标 `"→ "` 与 SelectList 前缀一致,无需改动。

---

## 建议修复方向(对应后续任务)

1. 为 theme-selector / show-images-selector 补充**标题 + 底部操作提示**,与 thinking/model/settings 对齐(任务 3)。
2. 统一面板**标题样式**为 accent + bold;修正 thinking-selector 标题(任务 3)。
3. 统一「当前值」标记符号(建议统一用 `✓ `,替代 theme 的 `(current)` 后缀)(任务 3/6)。
4. 统一底部帮助提示措辞与有无(任务 3/6)。
5. ~~清理 `SelectList.selectedPrefix` 死接口~~(审查确认恒被 `selectedText` 覆盖,改动无效,**已撤销**;`settings-list.cursor` 与 SelectList 前缀一致,不改)。
6. 颜色/对比度专项按 F 节候选实机验证后处理(任务 4)。

---

## 落地结果(本次已完成)

| 问题 | 落地 |
|---|---|
| theme-selector 无标题/无提示 | `theme-selector.ts` 补标题(accent+bold)+ 底部提示 + `✓` 当前标记 |
| show-images-selector 无标题/无提示 | `show-images-selector.ts` 补标题 + 底部提示 + `✓` 当前标记 |
| thinking-selector 标题未用 accent | `thinking-selector.ts` 改 accent+bold |
| 当前值标记表达不一 | 统一用 `✓ ` 前缀;accent 上色仅手动渲染行(thinking/model),theme/show-images 因 `SelectList` 整行 accent 包裹为纯文本(见约定节) |
| 底部提示缺失 | 统一 `  Enter to select · Esc to cancel`(新增 i18n 词条) |
| ~~`SelectList.selectedPrefix` 死接口~~ | 审查确认恒被 `selectedText` 覆盖,改动无效,已撤销(保持硬编码) |
| light 主题功能色对比度 <4.5 | `light.json` success/warning/error 提升(success #1a7f37 / warning #9a6700 / error #cf222e) |
| 间距/错位 | 全库 `Spacer(1)`/`Box(1,1)` 统一,`✓` 前缀统一消除列错位 |

验证:`npm run check` 通过(EXIT=0);tui `select-list`(11 项)、`theme-*`(9 项)、`thinking-selector`(1 项)测试全部通过;dark/light 渲染对比确认无回退。
