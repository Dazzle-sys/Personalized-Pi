<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>

# Pi Agent Harness（本地复刻）

> 本仓库是 [Pi Agent Harness](https://github.com/earendil-works/pi) 的**本地复刻**，在 i18n 中文化之外还扩展到 B.AI / command-code 提供商与 provider 配置向导（详见[与上游的差异](#与上游的差异)）。核心目的让「跟上游同步」保持低成本、可回滚。
>
> **注意**：这是一份本地复刻源码，**并未**以 `@earendil-works/*` 发布到 npm。请从源码运行（见 [快速开始](#快速开始)），不要 `npm install -g`（那会装上官方包）。

## 与上游的差异

除以下定制外，其余能力与上游一致：

### i18n 中文化

- 运行时 i18n：`t()` 以英文源串为字典 key，`{name}` 占位符插值；缺失回退英文源串，词典缺失不崩。
- 简体中文词典覆盖 CLI、交互 UI、诊断与消息（见 `packages/coding-agent/src/i18n/locales/zh-CN/` 与 `packages/tui/src/i18n/locales/zh-CN.ts`），英文源串始终可作为兜底。
- locale 解析顺序：界面语言设置 → `PI_LOCALE` → `LC_ALL` → `LC_MESSAGES` → `LANG`，默认英语。
- 在 `/settings` 切换「界面语言」（跟随系统 / 英语 / 简体中文）立即生效（重建聊天视图）。
- i18n 仅作用于**界面与 CLI 文本**；模型 prompt 不受影响，print/JSON 模式固定 `setLocale("en")` 供脚本消费。

### B.AI 提供商

OpenAI 兼容端点 `https://api.b.ai/v1`，认证用 `BAI_API_KEY`。模型目录、目录校准与回退逻辑见 [Provider 配置](packages/coding-agent/docs/providers.md#bai-fork-custom)。

### Command-code 提供商

OpenAI/Anthropic 兼容端点 `https://api.commandcode.ai/provider`，认证用 `COMMANDCODE_API_KEY`（`packages/ai/src/providers/commandcode.ts`）。模型目录与 E2E 覆盖见 [Provider 配置](packages/coding-agent/docs/providers.md#command-code-fork-custom)。

### Provider 配置向导

交互模式输入 `/provider`，按字段引导填写 `apiKey`、`baseUrl`、可选授权头等，写入 `~/.pi/agent/models.json`（并发安全，见 `packages/coding-agent/src/modes/interactive/components/provider-wizard.ts` 与 `core/models-config-writer.ts`）。

### TUI 默认使用 alt-screen 渲染器

默认 TUI 渲染器从 `regular`（main-screen，依赖终端 scrollback）改为 `fullscreen`（alt-screen）。后者自己托管 viewport，在流式输出与 markdown reflow 期间能**保留用户手动滚动位置**，规避上游已知的“视口上方行变化时 `ESC[3J` 清空 scrollback、阅读位置被拽回顶部”问题（上游 earendil-works/pi #7304）。

仅在 `/settings` 或 `--tui-mode regular` 显式选择时才回退到旧的 main-screen。

## 快速开始

先从源码安装依赖并运行：

```bash
git clone https://github.com/Dazzle-sys/pi
cd pi
npm install --ignore-scripts
```

从仓库根直接运行（任意目录可执行）：

```bash
./pi-test.sh            # 自带 --no-env 等参数支持
npx tsx packages/coding-agent/src/cli.ts
```

### 注册 `pi` 启动命令

把 `pi` 注册为一个全局命令，方便在任意目录直接使用。下面两种方式选其一：

#### 方式一：PATH wrapper（推荐，跨 shell、可加参数）

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/pi <<'EOF'
#!/usr/bin/env bash
cd "$HOME/pi" && exec ./pi-test.sh "$@"
EOF
chmod +x ~/.local/bin/pi
```

然后在 shell 配置文件（`~/.bashrc` / `~/.zshrc`）中加入：

```bash
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc   # 或 source ~/.zshrc
```

之后任意目录直接 `pi` 即可启动。

#### 方式二：shell alias

```bash
echo 'alias pi="$HOME/pi/pi-test.sh"' >> ~/.bashrc   # 或 ~/.zshrc
source ~/.bashrc
```

### 配置提供商

```bash
# B.AI
export BAI_API_KEY=sk-xxxxxxxx
# Command Code
export COMMANDCODE_API_KEY=sk-xxxxxxxx
pi
```

也可在交互模式输入 `/provider` 用向导写入 `~/.pi/agent/models.json`（provider 级配置，与环境变量二选一）。

### 启用简体中文

```bash
export PI_LOCALE=zh-CN
pi
```

也可以运行后在 `/settings` 中切换界面语言。

## 维护与同步上游

复刻仓库与上游依赖 [同步纪律](docs/upstream-merge-discipline.md)：**永不 rebase 上游，只用 merge**。同步流程、冲突处置规则与 i18n 冲突面管控见该文档。

变更遵循上游 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)（新条目写入 `## [Unreleased]`，已发布版本段落不可修改）与 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（`{feat,fix,docs}[(scope)]: <message>`）。

## 许可证

MIT
