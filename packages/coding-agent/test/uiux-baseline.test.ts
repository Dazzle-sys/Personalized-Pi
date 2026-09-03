import { describe, expect, it } from "vitest";
import { formatStatsParts, formatTokens } from "../src/modes/interactive/components/footer.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";

initTheme("dark");

describe("uiux footer baseline", () => {
	it("stats 用 dim 的 • 分隔", () => {
		const out = formatStatsParts(["a", "b"]);
		expect(out).toContain(" • ");
		expect(out).not.toContain(" | ");
	});
	it("token 缩写口径", () => {
		expect(formatTokens(999)).toBe("999");
		expect(formatTokens(1500)).toBe("1.5k");
		expect(formatTokens(25000)).toBe("25k");
		expect(formatTokens(2500000)).toBe("2.5M");
	});
});

import { stripTerminalSequences, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { keyHint, rawKeyHint } from "../src/modes/interactive/components/keybinding-hints.ts";

describe("uiux truncation", () => {
	it("中文截断不超宽", () => {
		const out = truncateToWidth("你好世界hello", 6);
		expect(visibleWidth(out)).toBeLessThanOrEqual(6);
	});
	it("ASCII 截断精确", () => {
		// 默认 ellipsis="..." 会补省略号；传 "" 测纯截断精度（同一入口，reset 码剥离后比对）
		expect(stripTerminalSequences(truncateToWidth("hello world", 5, ""))).toBe("hello");
	});
});

describe("uiux key hints", () => {
	it("keyHint 走 accent+muted 且含描述", () => {
		// 注：brief 示例用 "editor:confirm"，该 id 不存在；改用真实 id "tui.select.confirm"
		const out = keyHint("tui.select.confirm", "Confirm");
		expect(out).toContain("Confirm");
	});
	it("rawKeyHint 透传按键", () => {
		expect(rawKeyHint("ctrl+c", "Cancel")).toContain("ctrl+c");
	});
});
