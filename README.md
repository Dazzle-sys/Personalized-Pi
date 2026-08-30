<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>

# Pi Agent Harness（本地复刻）

> 本仓库是 [Pi Agent Harness](https://github.com/earendil-works/pi) 的**本地复刻**，仅做两类定制：**i18n 中文化**与 **B.AI 提供商**。核心目的让「跟上游同步」保持低成本、可回滚。
>
> **注意**：这是一份本地复刻源码，**并未**以 `@earendil-works/*` 发布到 npm。请从源码运行（见 [快速开始](#快速开始)），不要 `npm install -g`（那会装上官方包）。

## 与上游的差异

只定制两处，其余能力与上游一致：

### i18n 中文化

- 运行时 i18n：`t()` 以英文源串为字典 key，`{name}` 占位符插值；缺失回退英文源串，词典缺失不崩。
- 简体中文词典覆盖 CLI、交互 UI、诊断与消息（见 `packages/coding-agent/src/i18n/locales/zh-CN/` 与 `packages/tui/src/i18n/locales/zh-CN.ts`），英文源串始终可作为兜底。
- locale 解析顺序：界面语言设置 → `PI_LOCALE` → `LC_ALL` → `LC_MESSAGES` → `LANG`，默认英语。
- 在 `/settings` 切换「界面语言」（跟随系统 / 英语 / 简体中文）立即生效（重建聊天视图）。
- i18n 仅作用于**界面与 CLI 文本**；模型 prompt 不受影响，print/JSON 模式固定 `setLocale("en")` 供脚本消费。

### B.AI 提供商

OpenAI 兼容端点 `https://api.b.ai/v1`，认证用 `BAI_API_KEY`。模型目录、目录校准与回退逻辑见 [Provider 配置](packages/coding-agent/docs/providers.md#bai-fork-custom)。

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

### 配置 B.AI

```bash
export BAI_API_KEY=sk-xxxxxxxx
pi
```

### 启用简体中文

```bash
export PI_LOCALE=zh-CN
pi
```

也可以运行后在 `/settings` 中切换界面语言。

## 维护与同步上游

复刻仓库与上游依赖 [同步纪律](docs/upstream-merge-discipline.md)：**永不 rebase 上游，只用 merge**。同步流程、冲突处置规则（含 zh-CN 词典、`t()` 包装、`generate-models.ts` 三类高冲突区）与 i18n 冲突面管控见该文档。

变更遵循上游 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)（新条目写入 `## [Unreleased]`，已发布版本段落不可修改）与 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（`{feat,fix,docs}[(scope)]: <message>`）。

## 许可证

MIT
