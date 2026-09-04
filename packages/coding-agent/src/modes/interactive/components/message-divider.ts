import type { Component } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

/** Full-width thin rule using borderMuted, used to separate message turns. */
export class MessageDivider implements Component {
	invalidate(): void {
		// No cached state.
	}

	render(width: number): string[] {
		return [theme.fg("borderMuted", "─".repeat(Math.max(1, width)))];
	}
}
