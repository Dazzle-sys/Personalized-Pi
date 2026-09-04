import { isAbsolute, relative, resolve, sep } from "node:path";
import { type Component, t, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { AgentSession } from "../../../core/agent-session.ts";
import { areExperimentalFeaturesEnabled } from "../../../core/experimental.ts";
import type { ReadonlyFooterDataProvider } from "../../../core/footer-data-provider.ts";
import { addUsageToTotals, createUsageTotals } from "../../../core/usage-totals.ts";
import { theme } from "../theme/theme.ts";

/**
 * Sanitize text for display in a single-line status.
 * Removes newlines, tabs, carriage returns, and other control characters.
 */
function sanitizeStatusText(text: string): string {
	// Replace newlines, tabs, carriage returns with space, then collapse multiple spaces
	return text
		.replace(/[\r\n\t]/g, " ")
		.replace(/ +/g, " ")
		.trim();
}

/**
 * Format token counts for compact footer display.
 */
export function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

/** Join stat fragments with a subtle dim separator. Keeps the rest of the footer dim styling intact. */
export function formatStatsParts(parts: string[]): string {
	if (parts.length === 0) return "";
	const sep = theme.fg("dim", " • ");
	return parts.join(sep);
}

export function formatCwdForFooter(cwd: string, home: string | undefined): string {
	if (!home) return cwd;

	const resolvedCwd = resolve(cwd);
	const resolvedHome = resolve(home);
	const relativeToHome = relative(resolvedHome, resolvedCwd);
	const isInsideHome =
		relativeToHome === "" ||
		(relativeToHome !== ".." && !relativeToHome.startsWith(`..${sep}`) && !isAbsolute(relativeToHome));

	if (!isInsideHome) return cwd;
	return relativeToHome === "" ? "~" : `~${sep}${relativeToHome}`;
}

/** Footer 两级布局的输入：主行放 pwd + context%，次行放 token/费用统计。 */
export interface FooterLayoutInput {
	pwd: string;
	/** token/费用等统计片段（不含 context%，由 contextDisplay 单独承载）。 */
	statsParts: string[];
	/** 已格式化好的 context 文本，如 "3%/1M (auto)"（不含颜色，阈值着色由纯函数负责）。 */
	contextDisplay: string;
	/** context 百分比数值，用于阈值变色（>70 warning / >90 error）；缺省则不着色。 */
	contextPercentValue?: number;
	modelName: string;
	/** 仅模型支持 reasoning 时传入；"off" 显示为 thinking off。 */
	thinkingLevel?: string;
	providerCount: number;
	providerName?: string;
	extensionStatuses?: ReadonlyMap<string, string>;
	width: number;
}

/**
 * 主行：pwd (branch • session) • context% …… 右侧 model • thinking（muted 档，context% 阈值色逐段保留）。
 * 次行：token 统计 + 费用（dim 档）。有扩展状态则追加第三行。
 * 右对齐沿用 minPadding=2 + truncateToWidth 逻辑。
 */
export function renderFooterLines(input: FooterLayoutInput): string[] {
	const { width } = input;
	const minPadding = 2;

	// 右侧：model • thinking；多 provider 且放得下时加 (provider) 前缀
	let rightPlain = input.modelName;
	if (input.thinkingLevel !== undefined) {
		rightPlain += input.thinkingLevel === "off" ? ` • ${t("thinking off")}` : ` • ${input.thinkingLevel}`;
	}
	if (input.providerCount > 1 && input.providerName) {
		const withProvider = `(${input.providerName}) ${rightPlain}`;
		const leftEstimate = input.contextDisplay ? `${input.pwd} • ${input.contextDisplay}` : input.pwd;
		if (visibleWidth(leftEstimate) + minPadding + visibleWidth(withProvider) <= width) {
			rightPlain = withProvider;
		}
	}

	// 主行左侧：先做布局数学（纯文本），再逐段着色
	let leftPlain = input.contextDisplay ? `${input.pwd} • ${input.contextDisplay}` : input.pwd;
	let leftWidth = visibleWidth(leftPlain);
	if (leftWidth > width) {
		leftPlain = truncateToWidth(leftPlain, width, theme.fg("dim", "..."));
		leftWidth = visibleWidth(leftPlain);
	}
	const rightWidth = visibleWidth(rightPlain);
	let mainPlain: string;
	if (leftWidth + minPadding + rightWidth <= width) {
		mainPlain = leftPlain + " ".repeat(width - leftWidth - rightWidth) + rightPlain;
	} else {
		const availableForRight = width - leftWidth - minPadding;
		if (availableForRight > 0) {
			const truncatedRight = truncateToWidth(rightPlain, availableForRight, "");
			mainPlain =
				leftPlain + " ".repeat(Math.max(0, width - leftWidth - visibleWidth(truncatedRight))) + truncatedRight;
		} else {
			mainPlain = leftPlain;
		}
	}

	// 主行着色：整体 muted，context% 阈值色逐段保留（>90 error / >70 warning）
	let contextSeg: string = input.contextDisplay;
	if (input.contextPercentValue !== undefined) {
		if (input.contextPercentValue > 90) {
			contextSeg = theme.fg("error", input.contextDisplay);
		} else if (input.contextPercentValue > 70) {
			contextSeg = theme.fg("warning", input.contextDisplay);
		}
	}
	let mainLine: string;
	const at = input.contextDisplay ? mainPlain.indexOf(input.contextDisplay) : -1;
	if (at >= 0) {
		mainLine =
			theme.fg("muted", mainPlain.slice(0, at)) +
			contextSeg +
			theme.fg("muted", mainPlain.slice(at + input.contextDisplay.length));
	} else {
		mainLine = theme.fg("muted", mainPlain);
	}
	const lines = [mainLine];

	// 次行：token 统计 + 费用，dim 档
	if (input.statsParts.length > 0) {
		lines.push(truncateToWidth(theme.fg("dim", formatStatsParts(input.statsParts)), width, theme.fg("dim", "...")));
	}

	// 扩展状态行：按 key 排序（与原来一致）
	const extensionStatuses = input.extensionStatuses;
	if (extensionStatuses && extensionStatuses.size > 0) {
		const sortedStatuses = Array.from(extensionStatuses.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([, text]) => sanitizeStatusText(text));
		const statusLine = sortedStatuses.join(" ");
		lines.push(truncateToWidth(statusLine, width, theme.fg("dim", "...")));
	}

	return lines;
}

/**
 * Footer component that shows pwd, token stats, and context usage.
 * Computes token/context stats from session, gets git branch and extension statuses from provider.
 */
export class FooterComponent implements Component {
	private autoCompactEnabled = true;
	private session: AgentSession;
	private footerData: ReadonlyFooterDataProvider;

	constructor(session: AgentSession, footerData: ReadonlyFooterDataProvider) {
		this.session = session;
		this.footerData = footerData;
	}

	setSession(session: AgentSession): void {
		this.session = session;
	}

	setAutoCompactEnabled(enabled: boolean): void {
		this.autoCompactEnabled = enabled;
	}

	/**
	 * No-op: git branch caching now handled by provider.
	 * Kept for compatibility with existing call sites in interactive-mode.
	 */
	invalidate(): void {
		// No-op: git branch is cached/invalidated by provider
	}

	/**
	 * Clean up resources.
	 * Git watcher cleanup now handled by provider.
	 */
	dispose(): void {
		// Git watcher cleanup handled by provider
	}

	render(width: number): string[] {
		const state = this.session.state;

		// Calculate cumulative usage from ALL session entries (not just post-compaction messages)
		const usageTotals = createUsageTotals();
		let latestCacheHitRate: number | undefined;

		for (const entry of this.session.sessionManager.getEntries()) {
			if (entry.type === "message" && entry.message.role === "assistant") {
				addUsageToTotals(usageTotals, entry.message.usage);

				const latestPromptTokens =
					entry.message.usage.input + entry.message.usage.cacheRead + entry.message.usage.cacheWrite;
				latestCacheHitRate =
					latestPromptTokens > 0 ? (entry.message.usage.cacheRead / latestPromptTokens) * 100 : undefined;
			} else if (entry.type === "message" && entry.message.role === "toolResult" && entry.message.usage) {
				addUsageToTotals(usageTotals, entry.message.usage);
			} else if ((entry.type === "branch_summary" || entry.type === "compaction") && entry.usage) {
				addUsageToTotals(usageTotals, entry.usage);
			}
		}

		// Calculate context usage from session (handles compaction correctly).
		// After compaction, tokens are unknown until the next LLM response.
		const contextUsage = this.session.getContextUsage();
		const contextWindow = contextUsage?.contextWindow ?? state.model?.contextWindow ?? 0;
		const contextPercentValue = contextUsage?.percent ?? 0;
		const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";

		// Replace home directory with ~
		let pwd = formatCwdForFooter(this.session.sessionManager.getCwd(), process.env.HOME || process.env.USERPROFILE);

		// Add git branch if available
		const branch = this.footerData.getGitBranch();
		if (branch) {
			pwd = `${pwd} (${branch})`;
		}

		// Add session name if set
		const sessionName = this.session.sessionManager.getSessionName();
		if (sessionName) {
			pwd = `${pwd} • ${sessionName}`;
		}

		// 主行只承载 pwd + context%；token/费用统计下沉到次行
		const statsParts: string[] = [];
		if (usageTotals.input) statsParts.push(`↑${formatTokens(usageTotals.input)}`);
		if (usageTotals.output) statsParts.push(`↓${formatTokens(usageTotals.output)}`);
		if (usageTotals.cacheRead) statsParts.push(`R${formatTokens(usageTotals.cacheRead)}`);
		if (usageTotals.cacheWrite) statsParts.push(`W${formatTokens(usageTotals.cacheWrite)}`);
		if ((usageTotals.cacheRead > 0 || usageTotals.cacheWrite > 0) && latestCacheHitRate !== undefined) {
			statsParts.push(`CH${latestCacheHitRate.toFixed(1)}%`);
		}

		// Kimi Coding is subscription-backed despite using API-key authentication.
		const usingSubscription = state.model
			? state.model.provider === "kimi-coding" || this.session.modelRuntime.isUsingSubscription(state.model.provider)
			: false;
		if (usageTotals.cost || usingSubscription) {
			const costStr = `$${usageTotals.cost.toFixed(3)}${usingSubscription ? t(" (sub)") : ""}`;
			statsParts.push(costStr);
		}

		// context 显示文本（着色由 renderFooterLines 按阈值负责）
		const autoIndicator = this.autoCompactEnabled ? t(" (auto)") : "";
		const contextDisplay =
			contextPercent === "?"
				? `?/${formatTokens(contextWindow)}${autoIndicator}`
				: `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;
		if (areExperimentalFeaturesEnabled()) {
			statsParts.push(`${theme.fg("dim", "•")} ${theme.bold(theme.fg("warning", t("xp")))}`);
		}

		return renderFooterLines({
			pwd,
			statsParts,
			contextDisplay,
			contextPercentValue,
			modelName: state.model?.id || t("no-model"),
			thinkingLevel: state.model?.reasoning ? state.thinkingLevel || "off" : undefined,
			providerCount: this.footerData.getAvailableProviderCount(),
			providerName: state.model?.provider,
			extensionStatuses: this.footerData.getExtensionStatuses(),
			width,
		});
	}
}
