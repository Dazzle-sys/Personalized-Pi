import { type Component, dispatchMouseEvent, type TuiMouseDispatchResult, type TuiMouseEvent } from "../tui.ts";
import { applyBackgroundToLine, truncateToWidth, visibleWidth } from "../utils.ts";

export interface PanelOptions {
	/** 背景函数（通常为 theme.bg(...)）。空缺则不铺背景。 */
	bg?: (text: string) => string;
	/** 边框风格：none=仅背景块；line=直线；rounded=圆角框。 */
	border?: "none" | "line" | "rounded";
	borderColor?: (text: string) => string;
	/** 嵌入顶边框行的标题（仅 line/rounded 有效）。 */
	title?: string;
	titleColor?: (text: string) => string;
	/** 水平内边距，默认 1。 */
	padX?: number;
	/** 垂直内边距（上下各 N 行），默认 1。 */
	padY?: number;
}

/**
 * Panel - 统一面板原语：背景块 + 可选边框（直线/圆角）+ 嵌入式标题。
 * 所有"面"（消息、编辑器、选择器）都应走 Panel，避免样式分裂。
 * 色函数由调用方显式传入（jiti 扩展拿不到全局 theme，保持逃生口）。
 */
export class Panel implements Component {
	children: Component[] = [];
	private options: Required<Pick<PanelOptions, "padX" | "padY">> & PanelOptions;

	constructor(options: PanelOptions = {}) {
		// 负值钳制为 0，避免 render 中 repeat 抛 RangeError
		this.options = {
			...options,
			padX: Math.max(0, options.padX ?? 1),
			padY: Math.max(0, options.padY ?? 1),
		};
	}

	addChild(component: Component): void {
		this.children.push(component);
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) this.children.splice(index, 1);
	}

	clear(): void {
		this.children = [];
	}

	invalidate(): void {
		for (const child of this.children) child.invalidate?.();
	}

	// 鼠标事件透传：子组件按 contentWidth 堆叠，坐标去 padX/padY（及顶边框行）偏移。
	// 无此方法时 dispatchMouseEvent 直接返回，Panel 内 MouseRegion（如 thinking 折叠、tool 展开）会失活。
	handleMouse(event: TuiMouseEvent): TuiMouseDispatchResult | undefined {
		const { padX, padY, border } = this.options;
		const contentWidth = Math.max(1, event.width - padX * 2);
		const topOffset = padY + (border === "line" || border === "rounded" ? 1 : 0);
		const contentY = event.y - topOffset;
		const contentX = event.x - padX;
		if (contentY < 0 || contentX < 0 || contentX >= contentWidth) return undefined;

		let childY = 0;
		for (const child of this.children) {
			const childHeight = child.render(contentWidth).length;
			if (contentY >= childY && contentY < childY + childHeight) {
				return dispatchMouseEvent(child, {
					...event,
					x: contentX,
					y: contentY - childY,
					width: contentWidth,
					height: childHeight,
				});
			}
			childY += childHeight;
		}
		return undefined;
	}

	render(width: number): string[] {
		const { bg, border, borderColor, title, titleColor, padX, padY } = this.options;
		const contentWidth = Math.max(1, width - padX * 2);
		const leftPad = " ".repeat(padX);

		// 渲染子组件，统一补右侧空隙并铺背景
		const paint = (line: string): string => {
			const padded = line + " ".repeat(Math.max(0, width - visibleWidth(line)));
			return bg ? applyBackgroundToLine(padded, width, bg) : padded;
		};
		const blank = (): string => paint("");

		const lines: string[] = [];
		for (let i = 0; i < padY; i++) lines.push(blank());

		if (this.children.length === 0 && border === "none") {
			return lines;
		}

		for (const child of this.children) {
			for (const line of child.render(contentWidth)) {
				lines.push(paint(leftPad + line));
			}
		}

		for (let i = 0; i < padY; i++) lines.push(blank());

		if (border === "line" || border === "rounded") {
			const color = borderColor ?? ((t: string) => t);
			const paintBorder = (l: string): string => (bg ? applyBackgroundToLine(color(l), width, bg) : color(l));
			const top =
				border === "rounded" ? "╭" + "─".repeat(Math.max(1, width - 2)) + "╮" : "─".repeat(Math.max(1, width));
			const bottom =
				border === "rounded" ? "╰" + "─".repeat(Math.max(1, width - 2)) + "╯" : "─".repeat(Math.max(1, width));
			if (title && border === "rounded") {
				// ╭─ 标题 ─────╮：标题两侧各留 1 空格，CJK 按 visibleWidth 计量
				const titleText = titleColor ? titleColor(title) : title;
				const fixedWidth = 2 /* ╭─ */ + 1 /* 空格 */ + visibleWidth(title) + 1 /* 空格 */ + 1 /* ╮ */;
				const dashAfter = Math.max(0, width - fixedWidth);
				const raw = `╭─ ${titleText} ${"─".repeat(dashAfter)}╮`;
				lines.unshift(paintBorder(truncateToWidth(raw, width)));
			} else {
				lines.unshift(paintBorder(top));
			}
			lines.push(paintBorder(bottom));
		}

		return lines;
	}
}
