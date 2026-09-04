// packages/coding-agent/test/theme-tokens.test.ts

import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { initTheme, theme } from "../src/modes/interactive/theme/theme.ts";
import { validateThemeJson } from "../src/modes/interactive/theme/theme-json.ts";

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

	test("缺失 assistantBg 的主题在校验期就报错", () => {
		// 以 dark.json 为底删掉 assistantBg，模拟旧自定义主题
		const raw = readFileSync(new URL("../src/modes/interactive/theme/dark.json", import.meta.url), "utf-8");
		const doc = JSON.parse(raw);
		delete doc.colors.assistantBg;
		expect(() => validateThemeJson("test-missing", doc)).toThrow(/assistantBg/);
	});
});
