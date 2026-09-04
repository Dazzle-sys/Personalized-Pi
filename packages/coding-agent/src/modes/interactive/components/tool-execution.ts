import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import {
	Box,
	type Component,
	Container,
	getCapabilities,
	Image,
	MouseRegion,
	Panel,
	Spacer,
	Text,
	type TUI,
	type TuiMouseEvent,
	t,
} from "@earendil-works/pi-tui";
import type {
	ToolDefinition,
	ToolDisplayMode,
	ToolRenderContext,
	ToolRenderResultOptions,
} from "../../../core/extensions/types.ts";
import type { Theme } from "../theme/theme.ts";

/**
 * What this component needs from a tool: how to draw it. It neither executes tools nor reads their
 * parameter schemas, so a definition and a bare renderer pair are equally acceptable.
 *
 * The renderer parameters are `any` on purpose: a `ToolDefinition` types them from its schema, and
 * narrowing them here would make those definitions unassignable.
 */
export interface ToolRenderers {
	renderShell?: "default" | "self";
	renderCall?: (args: any, theme: Theme, context: ToolRenderContext<any, any>) => Component;
	renderResult?: (
		result: AgentToolResult<any>,
		options: ToolRenderResultOptions,
		theme: Theme,
		context: ToolRenderContext<any, any>,
	) => Component;
}

import { getTextOutput as getRenderedTextOutput } from "../../../core/tools/render-utils.ts";
import { convertToPng } from "../../../utils/image-convert.ts";
import { theme } from "../theme/theme.ts";
import { keyHint } from "./keybinding-hints.ts";

const FALLBACK_PREVIEW_LINES = 10;

// Left status bar prefix: a solid half-block + space, 2 terminal cells wide.
const TOOL_BAR = "▌ ";
const TOOL_BAR_WIDTH = 2;

export interface ToolExecutionOptions {
	showImages?: boolean;
	imageWidthCells?: number;
}

export class ToolExecutionComponent extends Container {
	private contentBox: Box;
	private contentText: Text;
	private contentTextRegion: MouseRegion;
	private selfRenderContainer: Container;
	private selfRenderHeight = 0;
	private callRendererComponent?: Component;
	private resultRendererComponent?: Component;
	private rendererState: any = {};
	private imageComponents: Image[] = [];
	private imageSpacers: Spacer[] = [];
	private toolName: string;
	private toolCallId: string;
	private args: any;
	private displayMode: ToolDisplayMode = "title";
	private showImages: boolean;
	private imageWidthCells: number;
	private isPartial = true;
	private toolDefinition?: ToolRenderers;
	private ui: TUI;
	private cwd: string;
	private executionStarted = false;
	private argsComplete = false;
	private result?: {
		content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
		isError: boolean;
		details?: any;
	};
	private convertedImages: Map<number, { data: string; mimeType: string }> = new Map();
	private hideComponent = false;

	constructor(
		toolName: string,
		toolCallId: string,
		args: any,
		options: ToolExecutionOptions = {},
		toolDefinition: ToolRenderers | ToolDefinition<any, any, any> | undefined,
		ui: TUI,
		cwd: string,
	) {
		super();
		this.toolName = toolName;
		this.toolCallId = toolCallId;
		this.args = args;
		this.toolDefinition = toolDefinition;
		this.showImages = options.showImages ?? true;
		this.imageWidthCells = options.imageWidthCells ?? 60;
		this.ui = ui;
		this.cwd = cwd;

		// Always create all shell variants. contentBox is used for default renderer-based composition.
		// No leading Spacer here: contentBox (Box(1,1)) already provides one line of padding above and
		// below the content, so an extra Spacer doubled the top padding and wasted vertical space.
		// selfRenderContainer is used when the tool renders its own framing.
		// contentText is reserved for generic fallback rendering when no tool definition exists.
		this.contentBox = new Box(1, 1);
		this.contentText = new Text("", 1, 1);
		this.contentTextRegion = this.createResultRegion(this.contentText);
		this.selfRenderContainer = new Container();

		if (this.hasRendererDefinition()) {
			this.addChild(this.getRenderShell() === "self" ? this.selfRenderContainer : this.contentBox);
		} else {
			this.addChild(this.contentTextRegion);
		}

		this.updateDisplay();
	}

	private getCallRenderer(): ToolDefinition<any, any>["renderCall"] | undefined {
		return this.toolDefinition?.renderCall;
	}

	private getResultRenderer(): ToolDefinition<any, any>["renderResult"] | undefined {
		return this.toolDefinition?.renderResult;
	}

	private hasRendererDefinition(): boolean {
		return this.toolDefinition !== undefined;
	}

	private getRenderShell(): "default" | "self" {
		return this.toolDefinition?.renderShell ?? "default";
	}

	private getRenderContext(lastComponent: Component | undefined): ToolRenderContext {
		return {
			args: this.args,
			toolCallId: this.toolCallId,
			invalidate: () => {
				this.invalidate();
				this.ui.requestRender();
			},
			lastComponent,
			state: this.rendererState,
			cwd: this.cwd,
			executionStarted: this.executionStarted,
			argsComplete: this.argsComplete,
			isPartial: this.isPartial,
			expanded: this.displayMode === "expanded",
			displayMode: this.displayMode,
			showImages: this.showImages,
			isError: this.result?.isError ?? false,
		};
	}

	/** State is conveyed by the status bar color (see getStatusBar); no redundant glyph on the title. */
	private getStateMarker(): string {
		return "";
	}

	/** Status color for the left bar, mirroring the state marker colors. */
	private getStatusBarColor(): "accent" | "error" | "success" {
		if (this.isPartial) return "accent";
		return this.result?.isError ? "error" : "success";
	}

	private getStatusBar(): string {
		return theme.fg(this.getStatusBarColor(), TOOL_BAR);
	}

	private isImageLine(line: string): boolean {
		return line.includes("\x1b_G") || line.includes("\x1b]1337;File=");
	}

	private createCallFallback(): Component {
		return new Text(`${this.getStateMarker()}${theme.fg("toolTitle", theme.bold(this.toolName))}`, 0, 0);
	}

	private createResultFallback(): Component | undefined {
		const output = this.getTextOutput();
		if (!output) {
			return undefined;
		}

		if (this.displayMode === "title") {
			return undefined;
		}

		const lines = output.split("\n");
		const displayLines = this.displayMode === "expanded" ? lines : lines.slice(0, FALLBACK_PREVIEW_LINES);
		const remaining = lines.length - displayLines.length;
		let text = displayLines.map((line) => theme.fg("toolOutput", line)).join("\n");
		if (remaining > 0) {
			const moreLines = t("\n... ({count} more lines,", { count: remaining });
			text += `${theme.fg("muted", moreLines)} ${keyHint("app.tools.expand", "to expand")}${theme.fg("muted", t(")"))}`;
		}
		return new Text(text, 0, 0);
	}

	/** preview/expanded 结果区按状态着色 Panel：pending/success/error 三态。title 模式不走这里；self 壳原样返回。 */
	private wrapResultPanel(component: Component): Component {
		if (this.getRenderShell() === "self") return component;
		const stateBg: "toolErrorBg" | "toolPendingBg" | "toolSuccessBg" = this.result?.isError
			? "toolErrorBg"
			: this.isPartial
				? "toolPendingBg"
				: "toolSuccessBg";
		const resultPanel = new Panel({
			bg: (text: string) => theme.bg(stateBg, text),
			padX: 1,
			padY: 0,
		});
		resultPanel.addChild(component);
		return resultPanel;
	}

	private createResultRegion(component: Component): MouseRegion {
		return new MouseRegion(component, (event) => {
			if (!this.result || event.type !== "click" || event.button !== "left") return undefined;
			this.setExpanded(this.displayMode !== "expanded");
			return { handled: true };
		});
	}

	updateArgs(args: any): void {
		this.args = args;
		this.updateDisplay();
	}

	markExecutionStarted(): void {
		this.executionStarted = true;
		this.updateDisplay();
		this.ui.requestRender();
	}

	setArgsComplete(): void {
		this.argsComplete = true;
		this.updateDisplay();
		this.ui.requestRender();
	}

	updateResult(
		result: {
			content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
			details?: any;
			isError: boolean;
		},
		isPartial = false,
	): void {
		this.result = result;
		this.isPartial = isPartial;
		this.updateDisplay();
		this.maybeConvertImagesForKitty();
	}

	private maybeConvertImagesForKitty(): void {
		const caps = getCapabilities();
		if (caps.images !== "kitty") return;
		if (!this.result) return;

		const imageBlocks = this.result.content.filter((c) => c.type === "image");
		for (let i = 0; i < imageBlocks.length; i++) {
			const img = imageBlocks[i];
			if (!img.data || !img.mimeType) continue;
			if (img.mimeType === "image/png") continue;
			if (this.convertedImages.has(i)) continue;

			const index = i;
			convertToPng(img.data, img.mimeType).then((converted) => {
				if (converted) {
					this.convertedImages.set(index, converted);
					this.updateDisplay();
					this.ui.requestRender();
				}
			});
		}
	}

	setDisplayMode(mode: ToolDisplayMode): void {
		this.displayMode = mode;
		this.updateDisplay();
	}

	setExpanded(expanded: boolean): void {
		this.setDisplayMode(expanded ? "expanded" : "title");
	}

	setShowImages(show: boolean): void {
		this.showImages = show;
		this.updateDisplay();
	}

	setImageWidthCells(width: number): void {
		this.imageWidthCells = Math.max(1, Math.floor(width));
		this.updateDisplay();
	}

	override invalidate(): void {
		super.invalidate();
		this.updateDisplay();
	}

	override render(width: number): string[] {
		if (this.hideComponent) {
			return [];
		}

		if (this.hasRendererDefinition() && this.getRenderShell() === "self") {
			const contentLines = this.selfRenderContainer.render(Math.max(1, width - TOOL_BAR_WIDTH));
			this.selfRenderHeight = contentLines.length;
			if (contentLines.length === 0 && this.imageComponents.length === 0) {
				return [];
			}

			const lines: string[] = [];
			if (contentLines.length > 0) {
				// self-rendered content (e.g. the edit box) already carries its own Box padding, so
				// prefix each line with the status bar without adding an extra leading row.
				lines.push(...contentLines.map((line) => (this.isImageLine(line) ? line : this.getStatusBar() + line)));
			}
			for (let i = 0; i < this.imageComponents.length; i++) {
				const spacer = this.imageSpacers[i];
				if (spacer) {
					lines.push(...spacer.render(width));
				}
				const imageComponent = this.imageComponents[i];
				if (imageComponent) {
					lines.push(...imageComponent.render(width));
				}
			}
			return lines;
		}

		return super
			.render(Math.max(1, width - TOOL_BAR_WIDTH))
			.map((line) => (this.isImageLine(line) ? line : this.getStatusBar() + line));
	}

	override handleMouse(event: TuiMouseEvent): ReturnType<Container["handleMouse"]> {
		if (!this.hasRendererDefinition() || this.getRenderShell() !== "self") return super.handleMouse(event);
		if (event.y <= 0 || event.y > this.selfRenderHeight) return undefined;
		return this.selfRenderContainer.handleMouse({
			...event,
			y: event.y - 1,
			height: this.selfRenderHeight,
		});
	}

	private updateDisplay(): void {
		let hasContent = false;
		this.hideComponent = false;
		if (this.hasRendererDefinition()) {
			const renderContainer = this.getRenderShell() === "self" ? this.selfRenderContainer : this.contentBox;
			renderContainer.clear();

			const callRenderer = this.getCallRenderer();
			if (!callRenderer) {
				renderContainer.addChild(this.createResultRegion(this.createCallFallback()));
				hasContent = true;
			} else {
				try {
					const component = callRenderer(this.args, theme, this.getRenderContext(this.callRendererComponent));
					this.callRendererComponent = component;
					renderContainer.addChild(this.createResultRegion(component));
					hasContent = true;
				} catch {
					this.callRendererComponent = undefined;
					renderContainer.addChild(this.createResultRegion(this.createCallFallback()));
					hasContent = true;
				}
			}

			if (this.result && this.displayMode !== "title") {
				const resultRenderer = this.getResultRenderer();
				if (!resultRenderer) {
					const component = this.createResultFallback();
					if (component) {
						renderContainer.addChild(this.createResultRegion(this.wrapResultPanel(component)));
						hasContent = true;
					}
				} else {
					try {
						const component = resultRenderer(
							{ content: this.result.content as any, details: this.result.details },
							{
								expanded: this.displayMode === "expanded",
								isPartial: this.isPartial,
								displayMode: this.displayMode,
							},
							theme,
							this.getRenderContext(this.resultRendererComponent),
						);
						this.resultRendererComponent = component;
						renderContainer.addChild(this.createResultRegion(this.wrapResultPanel(component)));
						hasContent = true;
					} catch {
						this.resultRendererComponent = undefined;
						const component = this.createResultFallback();
						if (component) {
							renderContainer.addChild(this.createResultRegion(this.wrapResultPanel(component)));
							hasContent = true;
						}
					}
				}
			}
		} else {
			this.contentText.setText(this.formatToolExecution());
			hasContent = true;
		}

		for (const img of this.imageComponents) {
			this.removeChild(img);
		}
		this.imageComponents = [];
		for (const spacer of this.imageSpacers) {
			this.removeChild(spacer);
		}
		this.imageSpacers = [];

		if (this.result && this.displayMode !== "title") {
			const imageBlocks = this.result.content.filter((c) => c.type === "image");
			const caps = getCapabilities();
			for (let i = 0; i < imageBlocks.length; i++) {
				const img = imageBlocks[i];
				if (caps.images && this.showImages && img.data && img.mimeType) {
					const converted = this.convertedImages.get(i);
					const imageData = converted?.data ?? img.data;
					const imageMimeType = converted?.mimeType ?? img.mimeType;
					if (caps.images === "kitty" && imageMimeType !== "image/png") continue;

					const spacer = new Spacer(1);
					this.addChild(spacer);
					this.imageSpacers.push(spacer);
					const imageComponent = new Image(
						imageData,
						imageMimeType,
						{ fallbackColor: (s: string) => theme.fg("toolOutput", s) },
						{ maxWidthCells: this.imageWidthCells },
					);
					this.imageComponents.push(imageComponent);
					this.addChild(imageComponent);
				}
			}
		}

		if (this.hasRendererDefinition() && !hasContent && this.imageComponents.length === 0) {
			this.hideComponent = true;
		}
	}

	private getTextOutput(): string {
		return getRenderedTextOutput(this.result, this.showImages);
	}

	private formatToolExecution(): string {
		let text = `${this.getStateMarker()}${theme.fg("toolTitle", theme.bold(this.toolName))}`;
		const content = JSON.stringify(this.args, null, 2);
		if (content) {
			text += `\n\n${content}`;
		}
		const output = this.getTextOutput();
		if (output) {
			text += `\n${output}`;
		}
		return text;
	}
}
