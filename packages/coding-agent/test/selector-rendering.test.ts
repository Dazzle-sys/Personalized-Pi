import { beforeAll, describe, expect, it } from "vitest";
import { ShowImagesSelectorComponent } from "../src/modes/interactive/components/show-images-selector.ts";
import { ThemeSelectorComponent } from "../src/modes/interactive/components/theme-selector.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

function renderedLines(component: { render(width: number): string[] }): string[] {
	return component.render(80).map((line) => stripAnsi(line));
}

describe("theme selector rendering", () => {
	beforeAll(() => initTheme("dark"));

	it("renders a title, bottom hint, and marks the current theme", () => {
		const selector = new ThemeSelectorComponent(
			"dark",
			() => {},
			() => {},
			() => {},
		);
		const lines = renderedLines(selector as unknown as { render(width: number): string[] });

		// Title (accent + bold) present
		expect(lines.some((l) => l.trim().startsWith("Theme"))).toBe(true);
		// Bottom hint present
		expect(lines.some((l) => l.includes("Enter to select · Esc to cancel"))).toBe(true);
		// Current theme (dark) is preset-selected and marked with ✓
		expect(lines.some((l) => l.includes("→ ✓ dark"))).toBe(true);
		// Non-current theme rendered with a 2-space placeholder marker
		expect(lines.some((l) => l.trimStart().startsWith("light"))).toBe(true);
	});
});

describe("show images selector rendering", () => {
	beforeAll(() => initTheme("dark"));

	it("renders a title, bottom hint, and marks the current value", () => {
		const selector = new ShowImagesSelectorComponent(
			true,
			() => {},
			() => {},
		);
		const lines = renderedLines(selector as unknown as { render(width: number): string[] });

		expect(lines.some((l) => l.trim().startsWith("Show images"))).toBe(true);
		expect(lines.some((l) => l.includes("Enter to select · Esc to cancel"))).toBe(true);
		// currentValue=true -> "Yes" preselected and marked ✓
		expect(lines.some((l) => l.includes("→ ✓ Yes"))).toBe(true);
		expect(lines.some((l) => l.trimStart().startsWith("No") && l.includes("Show text placeholder instead"))).toBe(
			true,
		);
	});
});
