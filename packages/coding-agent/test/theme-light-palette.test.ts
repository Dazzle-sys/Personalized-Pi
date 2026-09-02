import { describe, expect, test } from "vitest";
import { getResolvedThemeColors } from "../src/modes/interactive/theme/theme.ts";
import { contrastRatio } from "./theme-contrast.ts";

describe("light theme palette (modern refined)", () => {
	test("light theme resolves modern refined anchors", () => {
		const colors = getResolvedThemeColors("light");
		expect(colors.accent).toBe("#3f6fad");
		expect(colors.text).toBe("#24292e");
		expect(colors.success).toBe("#1a7f37");
		expect(colors.warning).toBe("#9a6700");
		expect(colors.error).toBe("#cf222e");
		expect(colors.userMessageBg).toBe("#eef2f7");
		// Contrast guard: not the washed-out old value.
		expect(colors.accent).not.toBe("#5a8080");
	});

	test("light thinkingMinimal is readable", () => {
		const colors = getResolvedThemeColors("light");
		expect(contrastRatio(colors.thinkingMinimal, "#ffffff")).toBeGreaterThanOrEqual(3.0);
	});
});
