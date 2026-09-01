import assert from "node:assert";
import { describe, it } from "node:test";
import { LeftBarBox } from "../src/components/left-bar-box.ts";
import { Text } from "../src/components/text.ts";

const redBar = (bar: string) => `\x1b[31m${bar}\x1b[39m`;

describe("LeftBarBox", () => {
	it("draws a continuous colored bar down the left edge", () => {
		const box = new LeftBarBox(1, 1, redBar);
		box.addChild(new Text("hi", 0, 0));

		const lines = box.render(12);

		// Top padding, content, bottom padding
		assert.strictEqual(lines.length, 3);
		// Every line carries the bar so it reads as a continuous left border.
		for (const line of lines) {
			assert.ok(line.startsWith("\x1b[31m▌ \x1b[39m"), `expected bar prefix, got ${JSON.stringify(line)}`);
		}
		assert.ok(lines[1].includes("hi"));
	});

	it("leaves terminal image lines untouched", () => {
		const box = new LeftBarBox(0, 0, redBar);
		box.addChild({
			render: () => ["\x1b_G"],
			invalidate: () => {},
		});

		const lines = box.render(12);
		assert.strictEqual(lines.length, 1);
		assert.strictEqual(lines[0], "\x1b_G");
	});
});
