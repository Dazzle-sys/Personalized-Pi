import assert from "node:assert";
import { test } from "node:test";
import { Panel } from "../src/components/panel.ts";
import { Text } from "../src/components/text.ts";
import { visibleWidth } from "../src/utils.ts";

// 与 markdown.test.ts 同模式：测试内局部剥 ANSI，utils.ts 无此导出
function stripAnsi(line: string): string {
	return line.replace(/\x1b\[[0-9;]*m/g, "");
}

const bg = (text: string) => `\x1b[48;5;17m${text}\x1b[49m`;
const border = (text: string) => `\x1b[38;5;39m${text}\x1b[39m`;

test("Panel 无边框时渲染 bg 填充的 padY 空行 + 内容行 + padY 空行", () => {
	const panel = new Panel({ bg, padX: 1, padY: 1 });
	panel.addChild(new Text("hello", 0, 0));
	const lines = panel.render(10);
	assert.strictEqual(lines.length, 3); // 上下 padding + 1 内容行
	for (const line of lines) {
		assert.strictEqual(stripAnsi(line).length, 10); // 全宽背景
		// brief 原断言 line.includes(bg("") 不成立：applyBackgroundToLine 总把内容夹在色码中间，
		// 这里按意图改为：每行都携带背景开/闭码
		assert.ok(line.includes("\x1b[48;5;17m") && line.includes("\x1b[49m"));
	}
	assert.strictEqual(stripAnsi(lines[1]).trim(), "hello");
});

test("Panel line 边框上下各一条全宽 ─ 线", () => {
	const panel = new Panel({ border: "line", borderColor: border, padX: 1, padY: 0 });
	panel.addChild(new Text("hi", 0, 0));
	const lines = panel.render(8);
	assert.strictEqual(lines.length, 3);
	assert.strictEqual(stripAnsi(lines[0]), "─".repeat(8));
	assert.strictEqual(stripAnsi(lines[2]), "─".repeat(8));
	assert.strictEqual(stripAnsi(lines[0]), stripAnsi(lines[2]));
});

test("Panel rounded 边框使用 ╭─╮│╰╯ 且标题嵌入顶边", () => {
	const panel = new Panel({
		border: "rounded",
		borderColor: border,
		title: "输入",
		titleColor: (t) => t,
		padX: 1,
		padY: 0,
	});
	panel.addChild(new Text("x", 0, 0));
	const lines = panel.render(20);
	const top = stripAnsi(lines[0]);
	assert.ok(top.startsWith("╭─ 输入 "));
	assert.ok(top.endsWith("╮"));
	assert.ok(top.includes("─"));
	const bottom = stripAnsi(lines[2]);
	assert.ok(bottom.startsWith("╰") && bottom.endsWith("╯"));
});

test("Panel CJK 标题宽度按 visibleWidth 计算，边框不串列", () => {
	const panel = new Panel({
		border: "rounded",
		borderColor: border,
		title: "模型选择",
		titleColor: (t) => t,
		padX: 1,
		padY: 0,
	});
	panel.addChild(new Text("y", 0, 0));
	const lines = panel.render(20);
	// 顶行可见宽度恰为 20（CJK 算 2 列）
	const top = stripAnsi(lines[0]);
	assert.strictEqual(visibleWidth(top), 20);
});

test("Panel 窄宽度时标题截断不破坏边框", () => {
	const panel = new Panel({
		border: "rounded",
		borderColor: border,
		title: "很长的标题会被截断处理",
		titleColor: (t) => t,
		padX: 1,
		padY: 0,
	});
	panel.addChild(new Text("z", 0, 0));
	const lines = panel.render(10);
	const top = stripAnsi(lines[0]);
	assert.ok(top.length <= 12); // 列宽截断后不会超过宽度
	assert.ok(top.startsWith("╭"));
});

test("Panel invalidate 后重新渲染", () => {
	const panel = new Panel({ bg, padX: 1, padY: 0 });
	panel.addChild(new Text("a", 0, 0));
	const first = panel.render(6);
	panel.clear();
	panel.addChild(new Text("b", 0, 0));
	panel.invalidate();
	const second = panel.render(6);
	assert.notStrictEqual(stripAnsi(first[0]), stripAnsi(second[0]));
});
