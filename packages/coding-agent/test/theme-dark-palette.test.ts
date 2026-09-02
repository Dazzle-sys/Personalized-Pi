import { describe, expect, test } from "vitest";
import { getAvailableThemes, getResolvedThemeColors } from "../src/modes/interactive/theme/theme.ts";
import { contrastRatio } from "./theme-contrast.ts";

describe("dark theme palette (modern refined)", () => {
	test("dark theme validates and exposes all tokens", () => {
		expect(getAvailableThemes()).toContain("dark");
		const colors = getResolvedThemeColors("dark");
		// Spot-check the modern refined palette anchors.
		expect(colors.accent).toBe("#7aa2f7");
		expect(colors.text).toBe("#d7dce2");
		expect(colors.success).toBe("#9ece6a");
		expect(colors.mdHeading).toBe("#c0caf5");
		expect(colors.thinkingHigh).toBe("#bb9af7");
		// Semantic risk guards: never pure primary colors.
		expect(colors.error).not.toBe("#ff0000");
		expect(colors.warning).not.toBe("#ffff00");
		expect(colors.userMessageBg).toBe("#1e2733");
	});

	test("dark syntaxComment and thinkingMinimal are readable", () => {
		const colors = getResolvedThemeColors("dark");
		const bg = "#16181e";
		// Code comments must hit WCAG AA for body text.
		expect(contrastRatio(colors.syntaxComment, bg)).toBeGreaterThanOrEqual(4.5);
		// The faintest thinking tier must still be discernible (AA large text).
		expect(contrastRatio(colors.thinkingMinimal, bg)).toBeGreaterThanOrEqual(3.0);
	});
});
