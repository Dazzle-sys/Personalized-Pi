import type { Translations } from "@earendil-works/pi-tui";

/** Simplified Chinese translations (keys are the English source strings). */
export const zhCN: Translations = {
	// core/agent-session.ts
	"Authentication failed for \"{provider}\". Credentials may have expired or network is unavailable. Run '/login {provider}' to re-authenticate.":
		"“{provider}”认证失败。凭据可能已过期或网络不可用。请运行 '/login {provider}' 重新认证。",
	"This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload().":
		"会话替换或重载后，此扩展 ctx 已失效。请勿在 ctx.newSession()、ctx.fork()、ctx.switchSession() 或 ctx.reload() 之后继续使用先前捕获的 pi 或 command ctx。对于 newSession、fork 和 switchSession，请把替换后的工作移入 withSession，并使用传给 withSession 的 ctx。对于 reload，请在 await ctx.reload() 之后不要再使用旧 ctx。",
	"Cannot submit a prompt while compaction is in progress. Wait for compaction to finish and retry.":
		"上下文压缩进行中，无法提交提示词。请等待压缩完成后再试。",
	"Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message.":
		"Agent 正在处理中。请指定 streamingBehavior（'steer' 或 'followUp'）将消息加入队列。",
	'Extension command "/{command}" cannot be queued. Use prompt() or execute the command when not streaming.':
		'扩展命令 "/{command}" 无法排队。请在非流式状态下使用 prompt() 或执行该命令。',
	"No API key for {model}": "没有 {model} 的 API 密钥",
	"Already compacted": "已完成上下文压缩",
	"Nothing to compact (session too small)": "没有可压缩的内容（会话太小）",
	"compaction failed": "上下文压缩失败",
	"Compaction failed: {message}": "上下文压缩失败：{message}",
	"Context overflow recovery failed after one compact-and-retry attempt. Try reducing context or switching to a larger-context model.":
		"一次压缩并重试后仍无法从上下文溢出中恢复。请尝试减少上下文或换用更大上下文窗口的模型。",
	"Truncated response recovery failed after one compact-and-retry attempt.":
		"一次压缩并重试后仍无法从截断响应中恢复。",
	"Context overflow recovery failed: {message}": "上下文溢出恢复失败：{message}",
	"Auto-compaction failed: {message}": "自动上下文压缩失败：{message}",
	"Retry cancelled": "重试已取消",
	"Wait for the current response to finish before navigating the session tree.": "请等待当前响应完成后再导航会话树。",
	"No model available for summarization": "没有可用于摘要的模型",
	"Entry {entryId} not found": "未找到条目 {entryId}",

	// core/agent-session-runtime.ts
	"File not found: {path}": "文件未找到：{path}",
	"Invalid entry ID for forking": "用于分叉的条目 ID 无效",
	"Persisted session is missing a session file": "持久化会话缺少会话文件",
	"This session has not been saved yet. Wait for the first assistant response before cloning or forking it.":
		"此会话尚未保存。请等待首个助手响应后再克隆或分叉。",
	"Failed to create forked session": "创建分叉会话失败",

	// core/auth-guidance.ts
	"Use /login to log into a provider via OAuth or API key. See:":
		"使用 /login 通过 OAuth 或 API 密钥登录提供商。参见：",
	"No models available. {help}": "没有可用模型。{help}",
	"No model selected.\n\n{help}\n\nThen use /model to select a model.":
		"未选择模型。\n\n{help}\n\n然后使用 /model 选择模型。",
	"No API key found for {provider}.\n\n{help}": "未找到 {provider} 的 API 密钥。\n\n{help}",
	"the selected model": "所选模型",

	// core/auth-storage.ts
	"Failed to acquire auth storage lock": "获取认证存储锁失败",
	"Auth storage lock was compromised": "认证存储锁已失效",
	"Failed to read auth.json: {error}": "读取 auth.json 失败：{error}",
	"Invalid auth.json: expected an object": "auth.json 无效：应为对象",
	'Invalid auth.json credential for provider "{provider}"': "提供商 “{provider}” 的 auth.json 凭据无效",
	"Read-only credential storage cannot modify auth.json": "只读凭据存储无法修改 auth.json",

	// core/http-dispatcher.ts
	"Invalid HTTP idle timeout: {value}": "无效的 HTTP 空闲超时：{value}",

	// core/model-registry.ts
	'No API key found for "{provider}"': "未找到 “{provider}” 的 API 密钥",
	"Provider config is required when registering by name": "按名称注册时必须提供提供商配置",

	// core/model-resolver.ts
	'Invalid thinking level "{level}" in pattern "{pattern}". Using default instead.':
		'模式 "{pattern}" 中的思考级别 "{level}" 无效。改用默认值。',
	'No models match pattern "{pattern}"': "没有模型匹配模式 “{pattern}”",
	"Warning: {message}": "警告：{message}",
	"No models available. Check your installation or add models to models.json.":
		"没有可用模型。请检查安装情况或向 models.json 添加模型。",
	'Unknown provider "{provider}". Use --list-models to see available providers/models.':
		'未知提供商 "{provider}"。使用 --list-models 查看可用的提供商/模型。',
	"No matching provider is authenticated.": "没有匹配的已认证提供商。",
	"More than one matching provider is authenticated.": "多个匹配的提供商均已认证。",
	'Model "{model}" is ambiguous across providers: {matches}. {authHint} Use --provider or provider/model.':
		'模型 "{model}" 在多个提供商中存在歧义：{matches}。{authHint}请使用 --provider 或 provider/model 格式。',
	'Model "{model}" not found for provider "{provider}". Using custom model id.':
		'提供商 "{provider}" 下未找到模型 "{model}"。将使用自定义模型 ID。',
	'Model "{model}" not found. Use --list-models to see available models.':
		'未找到模型 "{model}"。使用 --list-models 查看可用模型。',
	"Restored model: {model}": "已恢复模型：{model}",
	"model no longer exists": "模型已不存在",
	"no auth configured": "未配置认证",
	"Warning: Could not restore model {model} ({reason}).": "警告：无法恢复模型 {model}（{reason}）。",
	"Falling back to: {model}": "回退到：{model}",
	"Could not restore model {model} ({reason}). Using {fallback}.":
		"无法恢复模型 {model}（{reason}）。改用 {fallback}。",

	// core/model-runtime.ts
	'Provider "{provider}": {error}': "提供商 “{provider}”：{error}",
	"Availability refresh: {error}": "可用性刷新：{error}",
	"Unknown provider: {provider}": "未知提供商：{provider}",
	"Provider is not configured: {provider}": "提供商未配置：{provider}",
	"Provider {provider} does not support deferred responses": "提供商 {provider} 不支持延迟响应",
	"Provider id must not be empty.": "提供商 ID 不能为空。",

	// core/package-manager.ts
	"Installing {source}...": "正在安装 {source}…",
	"Path does not exist: {path}": "路径不存在：{path}",
	"Unsupported install source: {source}": "不支持的安装来源：{source}",
	"Removing {source}...": "正在移除 {source}…",
	"Unsupported remove source: {source}": "不支持的移除来源：{source}",
	"Updating {source}...": "正在更新 {source}…",
	"user npm packages": "用户 npm 包",
	"project npm packages": "项目 npm 包",
	"Updating user npm packages...": "正在更新用户 npm 包…",
	"Updating project npm packages...": "正在更新项目 npm 包…",
	"Missing source: {source}": "缺少来源：{source}",
	"No matching package found for {source}": "未找到匹配的包：{source}",
	"No matching package found for {source}. Did you mean {suggestion}?":
		"未找到匹配的包：{source}。是否指的是 {suggestion}？",
	"Empty response from npm view": "npm view 返回空响应",
	"Unexpected response from npm view": "npm view 返回意外响应",
	"Failed to determine remote HEAD": "无法确定远程 HEAD",
	"Unsupported upstream remote: {remote}": "不支持的上游远程：{remote}",
	"Missing upstream branch name": "缺少上游分支名",
	"Project is not trusted; refusing to access project package storage": "项目不受信任；拒绝访问项目包存储",
	"Invalid npmCommand: first array entry must be a non-empty command": "npmCommand 无效：数组第一项必须是非空命令",
	"Refreshing {source}...": "正在刷新 {source}…",
	"Missing git install root": "缺少 git 安装根目录",
	"Refusing to use path outside package install root: {path}": "拒绝使用包安装根目录之外的路径：{path}",
	"{command} timed out after {timeoutMs}ms": "{command} 超时（{timeoutMs} 毫秒）",
	"signal {signal}": "信号 {signal}",
	"code {code}": "退出码 {code}",
	"{command} failed with {exitStatus}: {output}": "{command} 执行失败（{exitStatus}）：{output}",
	"{command} failed with code {code}": "{command} 执行失败，退出码 {code}",
	"Failed to run {command}: {error}": "运行 {command} 失败：{error}",

	// core/project-trust.ts
	"Trust project folder?\n{cwd}\n\nThis allows {app} to load {configDir} settings and resources, install missing project packages, and execute project extensions.":
		"信任项目文件夹？\n{cwd}\n\n这将允许 {app} 加载 {configDir} 设置与资源、安装缺失的项目包并执行项目扩展。",
	'Extension "{path}" project_trust error: {error}': "扩展 “{path}” project_trust 错误：{error}",

	// core/resource-loader.ts
	"Warning: Could not read {description} file {path}: {error}": "警告：无法读取{description}文件 {path}：{error}",
	"Warning: Could not read {path}: {error}": "警告：无法读取 {path}：{error}",
	"Extension path does not exist: {path}": "扩展路径不存在：{path}",
	"Skill path does not exist": "技能路径不存在",
	"Prompt template path does not exist": "提示词模板路径不存在",
	"Theme path does not exist": "主题路径不存在",
	"system prompt": "系统提示词",
	"append system prompt": "追加系统提示词",
	"theme path does not exist": "主题路径不存在",
	"theme path is not a json file": "主题路径不是 json 文件",
	"failed to read theme path": "读取主题路径失败",
	"failed to read theme directory": "读取主题目录失败",
	"failed to load theme": "加载主题失败",
	"failed to load extension": "加载扩展失败",
	'name "/{name}" collision': "名称 “/{name}” 冲突",
	'name "{name}" collision': "名称 “{name}” 冲突",
	'Tool "{toolName}" conflicts with {owner}': "工具 “{toolName}” 与 {owner} 冲突",
	'Flag "--{flagName}" conflicts with {owner}': "标志 “--{flagName}” 与 {owner} 冲突",

	// core/session-cwd.ts
	"\nSession file: {path}": "\n会话文件：{path}",
	"Stored session working directory does not exist: {sessionCwd}{sessionFile}\nCurrent working directory: {fallbackCwd}":
		"会话中存储的工作目录不存在：{sessionCwd}{sessionFile}\n当前工作目录：{fallbackCwd}",
	"cwd from session file does not exist\n{sessionCwd}\n\ncontinue in current cwd\n{fallbackCwd}":
		"会话文件中的工作目录不存在\n{sessionCwd}\n\n在当前工作目录中继续\n{fallbackCwd}",

	// core/session-manager.ts
	"(no messages)": "（无消息）",
	"Session id must be non-empty, contain only alphanumeric characters, '-', '_', and '.', and start and end with an alphanumeric character":
		"会话 ID 不能为空，只能包含字母、数字、'-'、'_' 和 '.'，且必须以字母或数字开头和结尾",
	"Session header exceeds {limit}-byte scan limit: {path}": "会话头超出 {limit} 字节扫描上限：{path}",
	"Session file is not a valid {app} session: {path}": "会话文件不是有效的 {app} 会话：{path}",
	"Cannot fork: source session file is empty or invalid: {path}": "无法分叉：源会话文件为空或无效：{path}",
	"Cannot fork: source session has no header: {path}": "无法分叉：源会话缺少文件头：{path}",

	// core/settings-diagnostics.ts
	"Invalid settings file {path}: {error}": "设置文件无效 {path}：{error}",
	"Invalid {scope} settings: {error}": "{scope} 设置无效：{error}",

	// core/settings-manager.ts
	"Invalid {setting} setting: {value}": "无效的 {setting} 设置：{value}",
	"Failed to acquire settings lock": "获取设置锁失败",
	"Project is not trusted; refusing to write project settings": "项目不受信任；拒绝写入项目设置",

	// core/slash-commands.ts
	"Open settings menu": "打开设置菜单",
	"Select model (opens selector UI)": "选择模型（打开选择器界面）",
	"Navigate session tree (switch branches)": "导航会话树（切换分支）",
	"Set thinking level": "设置思考级别",
	"Enable/disable models for Ctrl+P cycling": "启用/禁用用于 Ctrl+P 轮换的模型",
	"Export session (HTML default, or specify path: .html/.jsonl)": "导出会话（默认 HTML，也可指定路径：.html/.jsonl）",
	"Import and resume a session from a JSONL file": "从 JSONL 文件导入并恢复会话",
	"Share session as a secret GitHub gist": "以私密 GitHub gist 分享会话",
	"Copy last agent message to clipboard": "复制最后一条助手消息到剪贴板",
	"Set session display name": "设置会话显示名称",
	"Show session info and stats": "显示会话信息与统计",
	"Show changelog entries": "显示更新日志条目",
	"Show all keyboard shortcuts": "显示所有键盘快捷键",
	"Create a new fork from a previous user message": "从之前的用户消息创建新分叉",
	"Duplicate the current session at the current position": "在当前位置复制当前会话",
	"Save project trust decision for future sessions": "保存项目信任决定，供以后的会话使用",
	"Configure provider authentication": "配置提供商认证",
	"Remove provider authentication": "移除提供商认证",
	"Start a new session": "开始新会话",
	"Manually compact the session context": "手动压缩会话上下文",
	"Resume a different session": "恢复另一个会话",
	"Reload keybindings, extensions, skills, prompts, themes, and context files":
		"重新加载键位、扩展、技能、提示词、主题与上下文文件",
	"Quit {app}": "退出 {app}",
	// slash-command category group labels（分类源为中文，恒等映射以满足 i18n 覆盖校验）
	信息: "信息",
	模型: "模型",
	会话: "会话",
	传输: "传输",
	账号: "账号",
	其他: "其他",

	// core/trust-manager.ts
	Trust: "信任",
	"Trust parent folder ({path})": "信任父文件夹（{path}）",
	"Trust (this session only)": "信任（仅本次会话）",
	"Do not trust": "不信任",
	"Do not trust (this session only)": "不信任（仅本次会话）",
	"Failed to read trust store {path}: {message}": "读取信任存储 {path} 失败：{message}",
	"Invalid trust store {path}: expected an object": "信任存储 {path} 无效：应为对象",
	"Invalid trust store {path}: value for {key} must be true, false, or null":
		"信任存储 {path} 无效：{key} 的值必须为 true、false 或 null",
	"Failed to acquire trust store lock": "获取信任存储锁失败",

	// core/compaction/compaction.ts
	Summarization: "摘要生成",
	"Turn prefix summarization": "轮次前缀摘要",

	// core/compaction/branch-summarization.ts
	"Branch summarization": "分支摘要",

	// core/extensions/loader.ts
	"Extension runtime not initialized. Action methods cannot be called during extension loading.":
		"扩展运行时未初始化。扩展加载期间无法调用操作方法。",
	"Extension runtime not initialized": "扩展运行时未初始化",
	'Extension "{path}" failed to load and its API is no longer active.': "扩展 “{path}” 加载失败，其 API 已不再可用。",
	'Invalid default for flag "{name}": expected {expected}, got {actual}':
		'标志 "{name}" 的默认值无效：应为 {expected}，实际为 {actual}',
	"Extension does not export a valid factory function: {path}": "扩展未导出有效的工厂函数：{path}",
	"Failed to load extension: {message}": "加载扩展失败：{message}",

	// core/extensions/runner.ts
	"Extension shortcut '{key}' from {path} conflicts with built-in shortcut. Skipping.":
		"来自 {path} 的扩展快捷键 '{key}' 与内置快捷键冲突。已跳过。",
	"Extension shortcut conflict: '{key}' is built-in shortcut for {builtin} and {path}. Using {path}.":
		"扩展快捷键冲突：'{key}' 已是 {builtin} 的内置快捷键，同时被 {path} 注册。将使用 {path}。",
	"Extension shortcut conflict: '{key}' registered by both {existing} and {path}. Using {path}.":
		"扩展快捷键冲突：'{key}' 已被 {existing} 和 {path} 同时注册。将使用 {path}。",
	"message_end handlers must return a message with the same role": "message_end 处理器必须返回相同角色的消息",

	// core/tools/bash.ts
	" (timeout {timeout}s)": "（超时 {timeout} 秒）",
	"... ({count} earlier lines,": "…（前 {count} 行，",
	"Full output: {path}": "完整输出：{path}",
	"Truncated: showing {shown} of {total} lines": "已截断：显示 {total} 行中的 {shown} 行",
	"Truncated: {count} lines shown ({size} limit)": "已截断：显示 {count} 行（{size} 上限）",
	Elapsed: "已用时",
	Took: "耗时",

	// core/tools/find.ts
	" (limit {limit})": "（上限 {limit}）",
	in: "位于",
	"{limit} results limit": "结果上限 {limit}",
	"{size} limit": "{size} 上限",

	// core/tools/grep.ts
	" limit {limit}": " 上限 {limit}",
	"{limit} matches limit": "匹配上限 {limit}",
	"some lines truncated": "部分行已截断",

	// core/tools/ls.ts
	"{limit} entries limit": "条目上限 {limit}",

	// core/tools/read.ts
	"[First line exceeds {size} limit]": "[首行超出 {size} 上限]",
	"[Truncated: showing {shown} of {total} lines ({limit} line limit)]":
		"[已截断：显示 {total} 行中的 {shown} 行（行数上限 {limit}）]",
	"[Truncated: {count} lines shown ({size} limit)]": "[已截断：显示 {count} 行（{size} 上限）]",

	// core/tools/render-utils.ts
	"[invalid arg]": "[无效参数]",

	// core/tools/write.ts
	"[invalid content arg - expected string]": "[无效 content 参数 - 应为字符串]",
	"\n... ({count} more lines, {total} total,": "\n…（还有 {count} 行，共 {total} 行，",

	// tools 通用（find/grep/ls/read）
	"[Truncated: {warnings}]": "[已截断：{warnings}]",

	// utils/deprecation.ts
	"Deprecation warning: {message}": "弃用警告：{message}",

	// utils/changelog.ts
	"Warning: Could not parse changelog: {error}": "警告：无法解析更新日志：{error}",

	// utils/clipboard.ts
	"Failed to copy to clipboard": "复制到剪贴板失败",

	// utils/tools-manager.ts
	"Failed to resolve latest {repo} release: HTTP {status} without redirect":
		"解析 {repo} 最新版本失败：HTTP {status} 且无重定向",
	"Failed to resolve latest {repo} release: unexpected redirect to {location}":
		"解析 {repo} 最新版本失败：意外重定向到 {location}",
	"Failed to download: {status}": "下载失败：{status}",
	"Download failed with HTTP {status}: {url}": "下载失败，HTTP {status}：{url}",
	"No response body": "响应无内容",
	"exit status {status}": "退出状态 {status}",
	"Failed to extract {asset}: {failure}": "解压 {asset} 失败：{failure}",
	"Unsupported platform: {platform}": "不支持的平台：{platform}",
	"Unsupported archive format: {asset}": "不支持的压缩包格式：{asset}",
	"Binary not found in archive: expected {binary} under {dir}": "压缩包中未找到二进制文件：应在 {dir} 下的 {binary}",
	"{name} not found. Offline mode enabled, skipping download.": "未找到 {name}。已启用离线模式，跳过下载。",
	"{name} not found. Install with: pkg install {package}": "未找到 {name}。请使用 pkg install {package} 安装",
	"{name} not found. Downloading...": "未找到 {name}。正在下载…",
	"{name} installed to {path}": "{name} 已安装到 {path}",
	"Failed to download {name}: {error}": "下载 {name} 失败：{error}",

	// core/tools/read.ts 渲染标签
	"read docs": "读取文档",
	"read resource": "读取资源",
	"read skill": "读取技能",

	// core/session-revert.ts & slash-commands.ts (revert)
	"Revert workspace to session start (aliases: /rollback, /回退)":
		"回退工作区到会话开始时的状态（别名：/rollback、/回退）",
	"Revert workspace to session start": "回退工作区到会话开始时的状态",
	"Confirm revert": "确认回退",
	"This will discard all changes since {time} and restore the workspace to that state. Untracked files will be removed. Continue?":
		"这将丢弃自 {time} 以来的所有改动并恢复工作区到该状态，未跟踪文件也会被删除。是否继续？",
	"No revert snapshot for this session. Try starting a new session in a git repository.":
		"当前会话没有回退快照。请在 git 仓库中新建会话后重试。",
	"Revert cancelled.": "已取消回退。",
	"Workspace reverted to session start ({desc}).": "工作区已回退到会话开始时的状态（{desc}）。",
	"Revert failed: {error}": "回退失败：{error}",
};
