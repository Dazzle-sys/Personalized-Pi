import { describe, expect, test } from "vitest";
import { formatStatsParts, formatTokens } from "../src/modes/interactive/components/footer.ts";
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
});
