<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>

# Pi

> 本仓库是 [Pi](https://github.com/earendil-works/pi) 的**本地复刻**
>
> **注意**：这是一份本地复刻源码，**并未**以 `@earendil-works/*` 发布到 npm。请从源码运行（见 [快速开始](#快速开始)），不要 `npm install -g`（那会装上官方包）。

## 快速开始

克隆源码、安装依赖并注册全局 `pi` 命令，按你的 shell 复制整段即可启动：

### Bash

```bash
git clone https://github.com/Dazzle-sys/Personalized-Pi.git
cd Personalized-Pi
npm install --ignore-scripts
# `--ignore-scripts` 会跳过 prepare 钩子，需显式生成模型目录数据（新克隆必做）
npm run hydrate:model-data
mkdir -p ~/.local/bin
cat > ~/.local/bin/pi <<'EOF'
#!/usr/bin/env bash
cd "$HOME/Personalized-Pi" && exec ./pi-test.sh "$@"
EOF
chmod +x ~/.local/bin/pi
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc   # 或 ~/.zshrc
source ~/.bashrc
pi
```

### PowerShell

```powershell
git clone https://github.com/Dazzle-sys/Personalized-Pi.git
cd Personalized-Pi
npm install --ignore-scripts
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
Add-Content -Path $PROFILE -Value 'function pi { & "$HOME\Personalized-Pi\pi-test.ps1" @args }'
. $PROFILE
pi
```

> 克隆到默认的 `$HOME/Personalized-Pi` 时上面的路径可直接使用；改成其它目录请同步替换 wrapper 里的 `$HOME/Personalized-Pi`。

## 与上游的差异

除以下定制外，其余能力与上游一致：

### i18n 中文化

- 运行时 i18n：`t()` 以英文源串为字典 key，`{name}` 占位符插值；缺失回退英文源串，词典缺失不崩。
- 简体中文词典覆盖 CLI、交互 UI、诊断与消息（见 `packages/coding-agent/src/i18n/locales/zh-CN/` 与 `packages/tui/src/i18n/locales/zh-CN.ts`），英文源串始终可作为兜底。
- locale 解析顺序：界面语言设置 → `PI_LOCALE` → `LC_ALL` → `LC_MESSAGES` → `LANG`，默认英语。
- 在 `/settings` 切换「界面语言」（跟随系统 / 英语 / 简体中文）立即生效（重建聊天视图）。
- i18n 仅作用于**界面与 CLI 文本**；模型 prompt 不受影响，print/JSON 模式固定 `setLocale("en")` 供脚本消费。

### B.AI 提供商

OpenAI 兼容端点 `https://api.b.ai/v1`，认证仅凭 auth.json 凭证（/login 存储，不使用环境变量）。模型目录、目录校准与回退逻辑见 [Provider 配置](packages/coding-agent/docs/providers.md#bai-fork-custom)。

### Command-code 提供商

OpenAI/Anthropic 兼容端点 `https://api.commandcode.ai/provider`，认证用 `COMMANDCODE_API_KEY`（`packages/ai/src/providers/commandcode.ts`）。模型目录与 E2E 覆盖见 [Provider 配置](packages/coding-agent/docs/providers.md#command-code-fork-custom)。

### Provider 配置向导

交互模式输入 `/provider`，按字段引导填写 `apiKey`、`baseUrl`、可选授权头等，写入 `~/.pi/agent/models.json`（并发安全，见 `packages/coding-agent/src/modes/interactive/components/provider-wizard.ts` 与 `core/models-config-writer.ts`）。

### TUI 默认使用 alt-screen 渲染器

默认 TUI 渲染器从 `regular`（main-screen，依赖终端 scrollback）改为 `fullscreen`（alt-screen）。后者自己托管 viewport，在流式输出与 markdown reflow 期间能**保留用户手动滚动位置**，规避上游已知的“视口上方行变化时 `ESC[3J` 清空 scrollback、阅读位置被拽回顶部”问题（上游 earendil-works/pi #7304）。

仅在 `/settings` 或 `--tui-mode regular` 显式选择时才回退到旧的 main-screen。

### 全屏右键复制（替代上游仅 Windows 的右键粘贴）

fullscreen（alt-screen）渲染器的右键行为与上游不同（`packages/tui/src/tui-alt-screen.ts` 的 `handleRightClickCopy`）：

- **上游**：仅 Windows 下右键 === 粘贴剪贴板（`onRightClickPaste`，且排除 VSCode），非 Windows 右键无动作。
- **fork**：移除 Windows 粘贴逻辑；右键且存在选中文本时**复制选中内容**到剪贴板，无选中则忽略。粘贴交由终端键盘（`Ctrl+V` / `Shift+Insert`）。
- **原因**：fullscreen 启用了 SGR 鼠标上报，右键事件传给应用而非终端自行粘贴，故改为复制。
- **复制路径**：经交互模式注入的原生剪贴板 `copySelection`（`interactive-mode.ts` → `utils/clipboard.ts` 的 `copyToClipboard`），失败回退 OSC 52；`copyOnSelect`（默认 true，鼠标释放自动复制选中文本）沿用上游（#8731）。反馈文案（`Copied!` / `Copy failed` / `Failed to copy to clipboard`）已本地化。

> 行为差异：Windows fullscreen 下右键由「粘贴」变为「复制选中」；非 Windows 由「无动作」变为「右键复制选中」。

### 提示词历史持久化

交互模式的聊天输入历史（上下键浏览）跨会话持久化，共 100 条，写入 `~/.pi/agent/prompt-history.json`，重启 `pi` 后仍可浏览（见 `packages/coding-agent/src/modes/interactive/components/custom-editor.ts` 与 `config.ts` 的 `getPromptHistoryPath()`）。

### 默认重试策略

agent 层请求重试默认值从上游的 `maxRetries: 3` / `baseDelayMs: 2000` 提高为 `maxRetries: 12` / `baseDelayMs: 4000`（指数退避 4s/8s/16s）。可在 `~/.pi/agent/settings.json` 的 `retry` 覆盖（见 `packages/coding-agent/src/core/settings-manager.ts`）。

### 编辑器微调

双击 Delete（300ms 内连续两次）清空当前编辑器输入；非 Delete 键输入会中断该双击手势。其他按键行为与上游一致（见 `packages/tui/src/components/editor.ts`）。

### 会话回退（/revert）

新增 `/revert`（别名 `/rollback`、`/回退`）将 git 工作区恢复到当前会话开始时的状态。会话创建时通过 `git stash create` 无侵入快照 `HEAD + index + working tree`（`stashHash | null`），并把会话开始时已存在的**未跟踪文件集**（`untrackedFiles`）一并写入 `SessionHeader.revertSnapshot`（见 `packages/coding-agent/src/core/session-revert.ts` 与 `session-manager.ts#getRevertSnapshot()`）；执行时二次确认后 `git reset --hard <headCommit>`，再按快照时的未跟踪文件集**精准删除**会话期间新增的未跟踪文件（不再用会误删既有文件的 `git clean -fd`），最后 `git stash apply --index <stashHash>` 恢复已跟踪改动。非 git 仓库或无快照时仅提示；会话开始前已存在的未跟踪文件会被保留。

### TUI / UX 现代精致化（tui-ux-refresh）

- **主题焕新**：`dark.json` / `light.json` 从 Solarized 风重构为现代精致风（Tokyo-Night / GitHub-Light 启发），去饱和中性灰 + 单一克制 accent，语义色低饱和，重心放在正文对比与边框分级；仍支持 truecolor → 256 色回退与自定义主题（未新增 token / 未改 schema）。
- **消息转向分隔线**：`MessageDivider`（`packages/coding-agent/src/modes/interactive/components/message-divider.ts`）在每个用户转向前绘制一条 `borderMuted` 细线，替代原先仅空白，营造「提问/回答」节奏。
- **底栏统计分隔符**：`formatStatsParts`（`packages/coding-agent/src/modes/interactive/components/footer.ts`）以弱分隔符 ` • ` 连接 token/成本/上下文用量。
- **loader 节奏**：spinner 默认间隔 80ms → 90ms，`DEFAULT_SPINNER_FRAMES` / `DEFAULT_SPINNER_INTERVAL_MS` 导出供默认与测试复用。

### 顶层面板视觉统一（ui-consistency）

- **面板标题**：顶层选择面板标题统一 `theme.bold(theme.fg("accent", ...))`（此前 `session`/`user-message`/`tree`/`config` 仅加粗、`model` 无标题，现 `model` 已补标题）。
- **选中光标**：简单列表选中光标统一 `→ `（`SelectList` 值列表一致）；树形 `tree-selector` 保留 `› ` 以配合 `│ └ ├` 连接符。
- **对比度提升**：`dark.syntaxComment` `#5b6b8c`→`#7d8bb3`（3.2→5.3）、`dark.thinkingMinimal` `#4a5568`→`#6b7a99`（2.4→4.1）、`light.thinkingMinimal` `#b0b8c0`→`#828c9c`（2.0→3.4）、`dim` 暗色 `#5c6673`→`#6b7480`（3.0→3.75）/亮色 `#8b949e`→`#7d8794`（2.9→3.6）；新增 WCAG 对比度守卫测试（`test/theme-contrast.ts`）防回归。
- **消息分隔线**：`MessageDivider` 由 `borderMuted` 改为 `borderAccent`，消息转向分隔更醒目。
- **快捷键键名**：`keyHint`/`rawKeyHint` 的键名由 `dim` 改 `accent`，帮助文本中键位更易扫读（描述仍 `muted`）。

### 其余内部加固

- **安装时自动生成模型数据**：根 `prepare` 钩子在 `husky && npm run hydrate:model-data` 中离线生成 `packages/ai/src/providers/data/*.json`（gitignore 产物，仅补数据、不改已提交的 `models.generated.ts`/`.models.ts`），避免新克隆/新 worktree 因缺数据导致 `npm run check` 报错。注意：`npm install --ignore-scripts` / `npm ci --ignore-scripts` 会**跳过** prepare，需改用 `npm install` 或手动 `npm run hydrate:model-data`；联网的 `generate-image-models` 不含在内。
- **Bedrock 类型硬化**：`bedrock-converse-stream.ts` 将 tool-use 的 `arguments` 收窄为 `unknown` 并 cast 为 `DocumentType`，消除非法类型安全告警。
- **配置资源路径跨平台归一化**：config-selector 生成的资源 pattern（如 extensions/skills/prompts/themes 的 `-`/`+`/`!` 前缀路径）统一用正斜杠 `/`（复用 `package-manager.toPosixPath`），避免 Windows 上 `path.relative` 产出反斜杠 `\` 导致 settings.json 不可移植（Linux 上正常）。
- **主屏渲染不破坏 scrollback**：`TuiMainScreen` 对视口上方（scrollback 内）行的修改不再用 `ESC[3J` 全清重放，而是仅更新缓冲模型并绘制可见区；仅在内容收缩到视口底部之上时才 full redraw 重新锚定。详见各包 CHANGELOG。
- **Tool 框去冗余顶部空格**：`ToolExecutionComponent` 不再在 `Box(1,1)` 自带 padding 之外再加一个 `Spacer(1)`，消除了折叠 tool 框顶部双倍留白、连续 tool 调用之间 4 行空缝的问题；每个 tool 框上下各留 1 行 padding。

## 维护与同步上游

复刻仓库与上游依赖 [同步纪律](docs/upstream-merge-discipline.md)：**永不 rebase 上游，只用 merge**。同步流程、冲突处置规则与 i18n 冲突面管控见该文档。

变更遵循上游 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)（新条目写入 `## [Unreleased]`，已发布版本段落不可修改）与 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（`{feat,fix,docs}[(scope)]: <message>`）。

## 许可证

MIT
