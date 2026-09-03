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
