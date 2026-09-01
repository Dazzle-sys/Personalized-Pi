import assert from "node:assert";
import { describe, it } from "node:test";
import { ScrollView } from "../src/components/scroll-view.ts";
import { Text } from "../src/components/text.ts";
import { VStack } from "../src/components/v-stack.ts";
import { renderLayoutFrame } from "../src/layout.ts";

class ClickableText extends Text {
	onContentClick = (_row: number, _col: number) => true;
}

describe("clickable content rows", () => {
	it("registers onContentClick rows for a scroll view's content", () => {
		const clickable = new ClickableText("click me", 0, 0);
		const scroll = new ScrollView(
			new VStack([
				{ component: clickable, basis: 1, shrink: 0 },
				{ component: new Text("body", 0, 0), basis: 0, grow: 1 },
			]),
		);
		const frame = renderLayoutFrame(scroll, 20, 5, () => {});
		let fired = false;
		let registeredRows = 0;
		for (const rowMap of frame.clickTargets.values()) {
			registeredRows += rowMap.size;
			for (const [row, fn] of rowMap) {
				if (fn(row)) fired = true;
			}
		}
		assert.ok(registeredRows >= 1, "at least one clickable content row registered");
		assert.ok(fired, "a registered click handler fires");
	});

	it("produces no click targets when no component opts in", () => {
		const scroll = new ScrollView(
			new VStack([
				{ component: new Text("a", 0, 0), basis: 1 },
				{ component: new Text("b", 0, 0), basis: 1 },
			]),
		);
		const frame = renderLayoutFrame(scroll, 20, 5, () => {});
		let total = 0;
		for (const rowMap of frame.clickTargets.values()) total += rowMap.size;
		assert.strictEqual(total, 0);
	});

	it("accounts for scroll offset when mapping content rows", () => {
		const clickable = new ClickableText("click me", 0, 0);
		const scroll = new ScrollView(
			new VStack([
				{ component: new Text("filler\nfiller\nfiller\nfiller", 0, 0), basis: 4 },
				{ component: clickable, basis: 1, shrink: 0 },
			]),
		);
		const frame = renderLayoutFrame(scroll, 20, 3, () => {});
		// With a 3-row viewport and 5 content rows, the clickable is scrolled out at scrollTop 0;
		// its content row is registered regardless of visibility (hit-test clamps the row).
		let registered = 0;
		for (const rowMap of frame.clickTargets.values()) registered += rowMap.size;
		assert.ok(registered >= 1, "clickable row registered even when scrolled out");
	});
});
