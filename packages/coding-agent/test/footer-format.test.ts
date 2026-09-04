import { describe, expect, test } from "vitest";
import { formatStatsParts, formatTokens, renderFooterLines } from "../src/modes/interactive/components/footer.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

describe("footer formatting", () => {
	test("formatTokens follows compact units", () => {
		expect(formatTokens(500)).toBe("500");
		expect(formatTokens(1500)).toBe("1.5k");
		expect(formatTokens(123456)).toBe("123k");
		expect(formatTokens(1500000)).toBe("1.5M");
	});

	test("formatStatsParts joins parts with a dim bullet and omits it for a single part", () => {
		initTheme("dark");
		expect(stripAnsi(formatStatsParts(["↑1.2k", "↓3.4k"]))).toBe("↑1.2k • ↓3.4k");
		expect(stripAnsi(formatStatsParts(["↑1.2k"]))).toBe("↑1.2k");
	});

	test("footer splits stats to secondary dim line", () => {
		initTheme("dark");
		// renderFooterLines 为本任务提取的纯函数：输入布局参数，输出行数组
		const lines = renderFooterLines({
			pwd: "D:\\proj (main)",
			statsParts: ["↑1k", "↓2k"],
			contextDisplay: "3%/1M (auto)",
			modelName: "gpt-x",
			thinkingLevel: "high",
			providerCount: 1,
			width: 80,
		});
		expect(lines).toHaveLength(2);
		const main = stripAnsi(lines[0]);
		const secondary = stripAnsi(lines[1]);
		expect(main).toContain("D:\\proj (main)");
		expect(main).toContain("gpt-x");
		expect(main).toContain("3%/1M");
		expect(secondary).toContain("↑1k");
		expect(secondary).toContain("↓2k");
	});
});
