// packages/coding-agent/test/theme-tokens.test.ts
import { describe, expect, test } from "vitest";
import { initTheme, theme } from "../src/modes/interactive/theme/theme.ts";

describe("overhaul theme tokens", () => {
	test("dark 主题包含 assistantBg/panelBg 背景 token", () => {
		initTheme("dark");
		expect(() => theme.bg("assistantBg", "x")).not.toThrow();
		expect(() => theme.bg("panelBg", "x")).not.toThrow();
		const painted = theme.bg("assistantBg", "x");
		expect(painted).toContain("x");
	});

	test("editorBorder 前景色可用且非默认", () => {
		initTheme("dark");
		expect(() => theme.fg("editorBorder", "─")).not.toThrow();
	});

	test("light 主题同样可用", () => {
		initTheme("light");
		expect(() => theme.bg("assistantBg", "x")).not.toThrow();
		expect(() => theme.fg("editorBorder", "─")).not.toThrow();
	});
});
