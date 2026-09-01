import { describe, expect, test } from "vitest";
import { getResolvedThemeColors } from "../src/modes/interactive/theme/theme.ts";

describe("light theme palette (modern refined)", () => {
	test("light theme resolves modern refined anchors", () => {
		const colors = getResolvedThemeColors("light");
		expect(colors.accent).toBe("#3f6fad");
		expect(colors.text).toBe("#24292e");
		expect(colors.error).toBe("#d64550");
		expect(colors.userMessageBg).toBe("#eef2f7");
		// Contrast guard: not the washed-out old value.
		expect(colors.accent).not.toBe("#5a8080");
	});
});
