import type { Component } from "@earendil-works/pi-tui";
import { Container, LeftBarBox, Panel, Spacer, Text, t } from "@earendil-works/pi-tui";
import type { EntryRenderer } from "../../../core/extensions/types.ts";
import type { CustomEntry } from "../../../core/session-manager.ts";
import { theme } from "../theme/theme.ts";

/**
 * Component that renders a custom session entry from extensions.
 * The host owns transcript spacing; renderer output should provide only its content.
 */
export class CustomEntryComponent extends Container {
	private entry: CustomEntry<unknown>;
	private renderer: EntryRenderer;
	private customComponent?: Component;
	private _expanded = false;

	constructor(entry: CustomEntry<unknown>, renderer: EntryRenderer) {
		super();
		this.entry = entry;
		this.renderer = renderer;
		this.rebuild();
	}

	hasContent(): boolean {
		return this.customComponent !== undefined;
	}

	setExpanded(expanded: boolean): void {
		if (this._expanded !== expanded) {
			this._expanded = expanded;
			this.rebuild();
		}
	}

	override invalidate(): void {
		super.invalidate();
		this.rebuild();
	}

	private rebuild(): void {
		this.clear();
		this.customComponent = undefined;

		let component: Component | undefined;
		try {
			component = this.renderer(this.entry, { expanded: this._expanded }, theme);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const box = new LeftBarBox(1, 1, (bar: string) => theme.fg("customMessageLabel", bar));
			box.addChild(
				new Text(
					theme.fg("error", t("[{type}] renderer failed: {message}", { type: this.entry.customType, message })),
					0,
					0,
				),
			);
			// 错误回退框同样套 customMessageBg，与 custom 消息家族统一
			const panel = new Panel({
				bg: (text: string) => theme.bg("customMessageBg", text),
				padX: 0,
				padY: 0,
			});
			panel.addChild(box);
			component = panel;
		}

		if (!component) {
			return;
		}

		this.customComponent = component;
		this.addChild(new Spacer(1));
		this.addChild(component);
	}
}
