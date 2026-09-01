import { describe, expect, it } from "vitest";
import { getResolvedThemeColors } from "../src/modes/interactive/theme/theme.ts";

// Regression: tool execution box backgrounds resolve to subtle state colors so the box reads as a
// distinct layered card instead of blending into the terminal.
describe("tool box background state colors", () => {
	for (const name of ["dark", "light"] as const) {
		it(`${name}: toolPendingBg/SuccessBg/ErrorBg resolve to their configured colors`, () => {
			const css = getResolvedThemeColors(name);
			const expected =
				name === "dark"
					? {
							toolPendingBg: "#2a3245",
							toolSuccessBg: "#223024",
							toolErrorBg: "#322427",
						}
					: {
							toolPendingBg: "#d9e2ee",
							toolSuccessBg: "#dff0e1",
							toolErrorBg: "#fbe4e6",
						};
			expect(css.toolPendingBg).toBe(expected.toolPendingBg);
			expect(css.toolSuccessBg).toBe(expected.toolSuccessBg);
			expect(css.toolErrorBg).toBe(expected.toolErrorBg);
		});
	}
});
