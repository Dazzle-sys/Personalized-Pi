import { describe, expect, it } from "vitest";
import { getResolvedThemeColors, getThemeByName } from "../src/modes/interactive/theme/theme.ts";

// Regression: tool execution box backgrounds resolve to the terminal's default background (""),
// so the box blends into the terminal instead of painting a fixed opaque color. HTML export maps
// these to transparent so they don't use the text color as a card background.
describe("tool box background default", () => {
	for (const name of ["dark", "light"] as const) {
		it(`${name}: toolPendingBg/SuccessBg/ErrorBg resolve to the terminal default background`, () => {
			const t = getThemeByName(name)!;
			expect(t.getBgAnsi("toolPendingBg")).toBe("\u001b[49m");
			expect(t.getBgAnsi("toolSuccessBg")).toBe("\u001b[49m");
			expect(t.getBgAnsi("toolErrorBg")).toBe("\u001b[49m");
		});

		it(`${name}: HTML export maps tool box backgrounds to transparent`, () => {
			const css = getResolvedThemeColors(name);
			expect(css.toolPendingBg).toBe("transparent");
			expect(css.toolSuccessBg).toBe("transparent");
			expect(css.toolErrorBg).toBe("transparent");
		});
	}
});
