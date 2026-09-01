import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerTranslations, resolveLocaleFromEnv, setLocale, t } from "@earendil-works/pi-tui";

// Extensions load via jiti into a separate module cache, so this pi-tui instance
// doesn't inherit the app's locale. The app broadcasts the effective UI locale to
// PI_LOCALE (applyLocaleSetting), so resolveLocaleFromEnv() here follows the
// /settings language setting as well as the environment. Re-resolve each turn so a
// live settings change is picked up.
registerTranslations("zh-CN", {
	TPS: "TPS",
	"tok/s": "tok/s",
	in: "输入",
	out: "输出",
	"cache r/w": "缓存读写",
	total: "总计",
});

function isAssistantMessage(message: unknown): message is AssistantMessage {
	if (!message || typeof message !== "object") return false;
	const role = (message as { role?: unknown }).role;
	return role === "assistant";
}

export default function (pi: ExtensionAPI) {
	let agentStartMs: number | null = null;

	pi.on("agent_start", () => {
		agentStartMs = Date.now();
	});

	pi.on("agent_end", (event, ctx) => {
		if (!ctx.hasUI) return;
		if (agentStartMs === null) return;

		const elapsedMs = Date.now() - agentStartMs;
		agentStartMs = null;
		if (elapsedMs <= 0) return;

		let input = 0;
		let output = 0;
		let cacheRead = 0;
		let cacheWrite = 0;
		let totalTokens = 0;

		for (const message of event.messages) {
			if (!isAssistantMessage(message)) continue;
			input += message.usage.input || 0;
			output += message.usage.output || 0;
			cacheRead += message.usage.cacheRead || 0;
			cacheWrite += message.usage.cacheWrite || 0;
			totalTokens += message.usage.totalTokens || 0;
		}

		if (output <= 0) return;

		setLocale(resolveLocaleFromEnv());

		const elapsedSeconds = elapsedMs / 1000;
		const tokensPerSecond = output / elapsedSeconds;
		const fmt = (n: number) => n.toLocaleString();
		// notify renders in a dim status line, so emphasis uses bold (color-safe).
		const message = [
			`\x1b[1m${t("TPS")} ${tokensPerSecond.toFixed(1)} ${t("tok/s")}\x1b[22m`,
			`${t("in")} ${fmt(input)}`,
			`${t("out")} ${fmt(output)}`,
			`${t("cache r/w")} ${fmt(cacheRead)}/${fmt(cacheWrite)}`,
			`${t("total")} ${fmt(totalTokens)}`,
			`${elapsedSeconds.toFixed(1)}s`,
		].join(" · ");

		ctx.ui.notify(message, "info");
	});
}
