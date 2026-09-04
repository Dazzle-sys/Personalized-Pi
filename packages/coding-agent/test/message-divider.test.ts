import { describe, expect, test } from "vitest";
import { MessageDivider } from "../src/modes/interactive/components/message-divider.ts";
import { initTheme, theme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

describe("MessageDivider", () => {
	test("renders a full-width muted rule", () => {
		initTheme("dark");
		const lines = new MessageDivider().render(24);
		expect(lines).toHaveLength(1);
		expect(stripAnsi(lines[0])).toBe("─".repeat(24));
	});

	test("renders at least one column for narrow viewports", () => {
		initTheme("dark");
		const lines = new MessageDivider().render(0);
		expect(stripAnsi(lines[0])).toBe("─");
	});

	test("divider uses borderMuted (not borderAccent)", () => {
		initTheme("dark");
		const lines = new MessageDivider().render(10);
		// borderMuted 暗色 #2b3245 → 256 色/truecolor 前景码，与 borderAccent(#6a86c9) 不同
		expect(lines[0]).not.toContain(theme.getFgAnsi("borderAccent"));
		expect(lines[0]).toContain(theme.getFgAnsi("borderMuted"));
	});
});
