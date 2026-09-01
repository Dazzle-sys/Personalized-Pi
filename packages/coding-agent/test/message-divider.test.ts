import { describe, expect, test } from "vitest";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";
import { MessageDivider } from "../src/modes/interactive/components/message-divider.ts";

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
});
