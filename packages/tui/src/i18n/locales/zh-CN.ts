import type { Translations } from "../i18n.ts";

/** Simplified Chinese translations for TUI strings. */
export const zhCN: Translations = {
	// settings-list
	"  No settings available": "  无可用设置",
	"  No matching settings": "  无匹配的设置",
	"  Type to search · Enter/Space to change · Esc to cancel": "  输入以搜索 · Enter/Space 修改 · Esc 取消",
	"  Enter/Space to change · Esc to cancel": "  Enter/Space 修改 · Esc 取消",
	// select-list
	"  No matching commands": "  无匹配的命令",
	// loader
	"Loading...": "加载中…",
	// editor paste markers and scroll border
	paste: "粘贴",
	lines: "行",
	chars: "字符",
	"─── {direction} {count} more ": "─── {direction} 还有 {count} 行 ",
	// alt-screen search
	" Find transcript": " 搜索会话记录",
	"No matches ": "无匹配 ",
	// clipboard flash
	"Copied!": "已复制！",
	"Copy failed": "复制失败",
	// image fallback
	"[Image: {content}]": "[图片：{content}]",
	// main screen render crash
	"Rendered line {index} exceeds terminal width ({lineWidth} > {width}).":
		"渲染行 {index} 超出终端宽度（{lineWidth} > {width}）。",
	"This is likely caused by a custom TUI component not truncating its output.":
		"这通常是由自定义 TUI 组件未截断其输出导致的。",
	"Use visibleWidth() to measure and truncateToWidth() to truncate lines.":
		"请使用 visibleWidth() 测量宽度，并使用 truncateToWidth() 截断行。",
	"Debug log written to: {path}": "调试日志已写入：{path}",
};
