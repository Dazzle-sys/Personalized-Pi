import { isImageLine } from "../terminal-image.ts";
import type { Component } from "../tui.ts";
import { visibleWidth } from "../utils.ts";

// Left status bar: a solid half-block + space, occupying 2 terminal cells.
const DEFAULT_BAR = "▌ ";
const DEFAULT_BAR_WIDTH = 2;

/**
 * LeftBarBox - a Box that leaves the background alone and instead draws a
 * single colored bar down the left edge. Each rendered line (padding lines
 * included) is prefixed with the bar, so the block reads as a panel with a
 * continuous left accent. Image lines are emitted untouched so terminal image
 * protocols keep working.
 */
export class LeftBarBox implements Component {
	children: Component[] = [];
	private paddingX: number;
	private paddingY: number;
	private barFn?: (bar: string) => string;

	constructor(paddingX = 1, paddingY = 1, barFn?: (bar: string) => string) {
		this.paddingX = paddingX;
		this.paddingY = paddingY;
		this.barFn = barFn;
	}

	addChild(component: Component): void {
		this.children.push(component);
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
		}
	}

	clear(): void {
		this.children = [];
	}

	invalidate(): void {
		for (const child of this.children) {
			child.invalidate?.();
		}
	}

	render(width: number): string[] {
		if (this.children.length === 0) {
			return [];
		}

		const contentWidth = Math.max(1, width - DEFAULT_BAR_WIDTH - this.paddingX * 2);
		const leftPad = " ".repeat(this.paddingX);

		const childLines: string[] = [];
		for (const child of this.children) {
			const lines = child.render(contentWidth);
			for (const line of lines) {
				childLines.push(leftPad + line);
			}
		}

		if (childLines.length === 0) {
			return [];
		}

		const bar = this.barFn ? this.barFn(DEFAULT_BAR) : DEFAULT_BAR;
		const padWidth = Math.max(0, width - DEFAULT_BAR_WIDTH);
		const barPad = " ".repeat(padWidth);

		const result: string[] = [];
		// Top padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(bar + barPad);
		}
		// Content
		for (const line of childLines) {
			if (isImageLine(line)) {
				result.push(line);
				continue;
			}
			const visibleLength = visibleWidth(line);
			result.push(bar + line + " ".repeat(Math.max(0, padWidth - visibleLength)));
		}
		// Bottom padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(bar + barPad);
		}

		return result;
	}
}
