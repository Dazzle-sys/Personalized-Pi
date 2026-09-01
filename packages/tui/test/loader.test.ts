import assert from "node:assert";
import { describe, it } from "node:test";
import {
	DEFAULT_SPINNER_FRAMES,
	DEFAULT_SPINNER_INTERVAL_MS,
	Loader,
} from "../src/components/loader.ts";
import type { TUI } from "../src/tui.ts";

class FakeUi {
	requestRender(): void {}
}

describe("Loader", () => {
	it("exposes smooth default frames and interval", () => {
		assert.ok(DEFAULT_SPINNER_FRAMES.length > 3);
		assert.ok(DEFAULT_SPINNER_INTERVAL_MS >= 70);
		assert.ok(DEFAULT_SPINNER_FRAMES.includes("⠋"));
	});

	it("hides the indicator when empty frames are set", () => {
		const loader = new Loader(new FakeUi() as unknown as TUI, (s) => s, (s) => s, "working", {
			frames: [],
		});
		const [, line] = loader.render(20);
		assert.ok(line.includes("working"));
	});
});
