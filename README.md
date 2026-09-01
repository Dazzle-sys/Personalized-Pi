<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>

# Pi Agent Harness

> 本仓库是 [Pi Agent Harness](https://github.com/earendil-works/pi) 的**本地复刻**
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

### 提示词历史持久化

交互模式的聊天输入历史（上下键浏览）跨会话持久化，共 100 条，写入 `~/.pi/agent/prompt-history.json`，重启 `pi` 后仍可浏览（见 `packages/coding-agent/src/modes/interactive/components/custom-editor.ts` 与 `config.ts` 的 `getPromptHistoryPath()`）。

### 默认重试策略

agent 层请求重试默认值从上游的 `maxRetries: 3` / `baseDelayMs: 2000` 提高为 `maxRetries: 12` / `baseDelayMs: 4000`（指数退避 4s/8s/16s）。可在 `~/.pi/agent/settings.json` 的 `retry` 覆盖（见 `packages/coding-agent/src/core/settings-manager.ts`）。

### 编辑器微调

双击 Delete（300ms 内连续两次）清空当前编辑器输入；非 Delete 键输入会中断该双击手势。其他按键行为与上游一致（见 `packages/tui/src/components/editor.ts`）。

### 会话回退（/revert）

新增 `/revert`（别名 `/rollback`、`/回退`）将 git 工作区恢复到当前会话开始时的状态。会话创建时通过 `git stash create` 无侵入快照 `HEAD + index + working tree`（`stashHash | null`），连同 `headCommit/createdAt/cwd` 写入 `SessionHeader.revertSnapshot`（见 `packages/coding-agent/src/core/session-revert.ts` 与 `session-manager.ts#getRevertSnapshot()`）；执行时二次确认后依次 `git reset --hard <headCommit>`、`git clean -fd`、`git stash apply --index <stashHash>`，非 git 仓库或无快照时仅提示。确认与结果文案经 `t()` 中文化（`packages/coding-agent/src/i18n/locales/zh-CN/core.ts`），未跟踪文件的完整恢复为已知上限（`ponytail: stash create` 仅覆盖已跟踪文件）。

### TUI / UX 现代精致化（tui-ux-refresh）

- **主题焕新**：`dark.json` / `light.json` 从 Solarized 风重构为现代精致风（Tokyo-Night / GitHub-Light 启发），去饱和中性灰 + 单一克制 accent，语义色低饱和，重心放在正文对比与边框分级；仍支持 truecolor → 256 色回退与自定义主题（未新增 token / 未改 schema）。
- **消息转向分隔线**：`MessageDivider`（`packages/coding-agent/src/modes/interactive/components/message-divider.ts`）在每个用户转向前绘制一条 `borderMuted` 细线，替代原先仅空白，营造「提问/回答」节奏。
- **底栏统计分隔符**：`formatStatsParts`（`packages/coding-agent/src/modes/interactive/components/footer.ts`）以弱分隔符 ` • ` 连接 token/成本/上下文用量。
- **loader 节奏**：spinner 默认间隔 80ms → 90ms，`DEFAULT_SPINNER_FRAMES` / `DEFAULT_SPINNER_INTERVAL_MS` 导出供默认与测试复用。

### 其余内部加固

- **安装时自动生成模型数据**：根 `prepare` 钩子在 `husky && npm run hydrate:model-data` 中离线生成 `packages/ai/src/providers/data/*.json`（gitignore 产物，仅补数据、不改已提交的 `models.generated.ts`/`.models.ts`），避免新克隆/新 worktree 因缺数据导致 `npm run check` 报错。注意：`npm install --ignore-scripts` / `npm ci --ignore-scripts` 会**跳过** prepare，需改用 `npm install` 或手动 `npm run hydrate:model-data`；联网的 `generate-image-models` 不含在内。
- **Bedrock 类型硬化**：`bedrock-converse-stream.ts` 将 tool-use 的 `arguments` 收窄为 `unknown` 并 cast 为 `DocumentType`，消除非法类型安全告警。
- **gitleaks 白名单**：`.gitleaks.toml` 排除 `packages/ai/src/providers/data/`（生成模型目录，仅模型元数据与校验和，无凭据），避免 `structureHash` 误报。

## 维护与同步上游

复刻仓库与上游依赖 [同步纪律](docs/upstream-merge-discipline.md)：**永不 rebase 上游，只用 merge**。同步流程、冲突处置规则与 i18n 冲突面管控见该文档。

变更遵循上游 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)（新条目写入 `## [Unreleased]`，已发布版本段落不可修改）与 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（`{feat,fix,docs}[(scope)]: <message>`）。

## 许可证

MIT
