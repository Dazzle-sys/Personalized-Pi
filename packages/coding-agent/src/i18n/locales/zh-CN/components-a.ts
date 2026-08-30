import type { Translations } from "@earendil-works/pi-tui";

/** Simplified Chinese translations (keys are the English source strings). */
export const zhCN: Translations = {
	// assistant-message.ts
	"Thinking...": "思考中…",
	"Response was truncated before completion.": "响应在完成前被截断。",
	"Operation aborted": "操作已中止",
	"Unknown error": "未知错误",
	"Error: {msg}": "错误：{msg}",

	// bash-execution.ts
	"Running... ({keys} to cancel)": "运行中…（{keys} 取消）",
	"(": "（",
	")": "）",
	"to collapse": "折叠",
	"... {count} more lines (": "… 还有 {count} 行（",
	"to expand": "展开",
	"(cancelled)": "（已取消）",
	"(exit {code})": "（退出码 {code}）",
	"Output truncated. Full output: {path}": "输出已截断。完整输出：{path}",

	// bordered-loader.ts
	cancel: "取消",

	// branch-summary-message.ts
	"[branch]": "[分支]",
	"**Branch Summary**\n\n": "**分支摘要**\n\n",
	"Branch summary (": "分支摘要（",
	" to expand)": " 展开）",

	// compaction-summary-message.ts
	"[compaction]": "[上下文压缩]",
	"**Compacted from {count} tokens**\n\n": "**由 {count} tokens 压缩而来**\n\n",
	"Compacted from {count} tokens (": "由 {count} tokens 压缩（",

	// config-selector.ts
	Extensions: "扩展",
	Skills: "技能",
	Prompts: "提示词",
	Themes: "主题",
	"User ({path})": "用户（{path}）",
	"Project ({path})": "项目（{path}）",
	"Project ({dir}/)": "项目（{dir}/）",
	"User settings": "用户设置",
	"Project settings": "项目设置",
	"Project Local Resources": "项目本地资源",
	"Global Resources": "全局资源",
	"switch mode": "切换模式",
	"cycle inherit/+/-": "循环 继承/+/-",
	toggle: "切换",
	close: "关闭",
	" · inherited global resources are dimmed": " · 继承的全局资源以暗色显示",
	"  No resources found": "  未找到资源",
	" · inherited global": " · 继承自全局",
	"  project load": "  项目加载",
	"  project unload": "  项目卸载",
	"  inherited global": "  继承自全局",

	// custom-entry.ts
	"[{type}] renderer failed: {message}": "[{type}] 渲染失败：{message}",

	// earendil-announcement.ts
	"pi has joined Earendil": "pi 已加入 Earendil",
	"Read the blog post:": "阅读博客文章：",

	// extension-editor.ts
	submit: "提交",
	newline: "换行",
	"external editor": "外部编辑器",

	// extension-input.ts
	" ({count}s)": "（{count}s）",

	// extension-selector.ts
	navigate: "移动",
	select: "选择",

	// first-time-setup.ts
	Dark: "深色",
	Light: "浅色",
	"Share anonymous usage data": "共享匿名使用数据",
	"Don't share": "不共享",
	"Welcome to {name}, the minimal coding agent.": "欢迎使用 {name}，极简编码 Agent。",
	"Pick a theme.": "选择主题。",
	"Detected system appearance: {theme}": "检测到系统外观：{theme}",
	"Opt-in to anonymous usage data sharing?": "是否共享匿名使用数据？",
	"Opting in stores a tracking identifier in settings.json and enables anonymous\nusage analytics. This helps us to better debug, reproduce, and resolve issues\nand bugs within Pi. You can observe what is shared using /privacy and make\nchanges anytime in settings.json.":
		"选择共享后，会在 settings.json 中存储跟踪标识符，并启用匿名使用数据分析。\n这有助于我们更好地调试、复现和解决 Pi 中的问题与缺陷。\n你可以使用 /privacy 查看共享的内容，\n并随时在 settings.json 中进行更改。",
	continue: "继续",
	finish: "完成",
	"skip setup": "跳过设置",

	// footer.ts
	" (sub)": "（订阅）",
	" (auto)": "（自动）",
	"no-model": "无模型",
	"thinking off": "思考已关",
	xp: "实验",

	// login-dialog.ts
	"Login to {provider}": "登录 {provider}",
	"Cmd+click to open": "Cmd+点击打开",
	"Ctrl+click to open": "Ctrl+点击打开",
	"Enter code: {code}": "输入代码：{code}",
	"e.g., {example}": "例如：{example}",
	"to cancel": "取消",
	"to cancel,": "取消，",
	"to submit": "提交",
	"to close": "关闭",

	// mermaid.ts
	" (+{count} more)": "（+{count} 条）",
	"Mermaid diagram not rendered: {warning}": "Mermaid 图未渲染：{warning}",
};
