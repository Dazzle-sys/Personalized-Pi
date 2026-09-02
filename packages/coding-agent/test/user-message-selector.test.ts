import { beforeAll, describe, expect, it } from "vitest";
import { UserMessageSelectorComponent } from "../src/modes/interactive/components/user-message-selector.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

describe("user message selector rendering", () => {
	beforeAll(() => initTheme("dark"));

	it("renders a title and a → selected cursor", () => {
		const selector = new UserMessageSelectorComponent(
			[
				{ id: "1", text: "hello" },
				{ id: "2", text: "world" },
			],
			() => {},
			() => {},
			"2",
		);
		const lines = selector.render(80).map((line) => stripAnsi(line));
		// Title present (accent handled by theme JSON, text asserted here)
		expect(lines.some((l) => l.includes("Fork from Message"))).toBe(true);
		// Selected message (id "2") uses the unified → cursor
		expect(lines.some((l) => l.startsWith("→ world"))).toBe(true);
	});
});
