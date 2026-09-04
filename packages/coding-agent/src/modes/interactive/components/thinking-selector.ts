import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import {
	Container,
	type Focusable,
	fuzzyFilter,
	getKeybindings,
	Input,
	matchesKey,
	Panel,
	type SelectItem,
	SelectList,
	type SelectListLayoutOptions,
	Spacer,
	Text,
	t,
} from "@earendil-works/pi-tui";
import { getSelectListTheme, theme } from "../theme/theme.ts";
import { keyDisplayText } from "./keybinding-hints.ts";

const THINKING_SELECT_LIST_LAYOUT: SelectListLayoutOptions = {
	minPrimaryColumnWidth: 12,
	maxPrimaryColumnWidth: 32,
};

const LEVEL_DESCRIPTIONS: Record<ThinkingLevel, string> = {
	off: "No reasoning",
	minimal: "Very brief reasoning (~1k tokens)",
	low: "Light reasoning (~2k tokens)",
	medium: "Moderate reasoning (~8k tokens)",
	high: "Deep reasoning (~16k tokens)",
	xhigh: "Extra-high reasoning (~32k tokens)",
	max: "Maximum reasoning",
};

/**
 * Component that renders a thinking level selector with borders
 */
export class ThinkingSelectorComponent extends Container implements Focusable {
	private panel: Panel;
	private searchInput: Input;
	private selectList: SelectList;
	private selectListChildIndex: number;
	private allItems: SelectItem[];
	private onSelect: (level: ThinkingLevel) => void;
	private onCancel: () => void;
	private onSelectAsDefault?: (level: ThinkingLevel) => void;
	private _focused = false;

	get focused(): boolean {
		return this._focused;
	}

	set focused(value: boolean) {
		this._focused = value;
		this.searchInput.focused = value;
	}

	constructor(
		currentLevel: ThinkingLevel,
		availableLevels: ThinkingLevel[],
		onSelect: (level: ThinkingLevel) => void,
		onCancel: () => void,
		onSelectAsDefault?: (level: ThinkingLevel) => void,
		defaultThinkingLevel?: ThinkingLevel,
	) {
		super();
		this.onSelect = onSelect;
		this.onCancel = onCancel;
		this.onSelectAsDefault = onSelectAsDefault;

		this.allItems = availableLevels.map((level) => ({
			value: level,
			label: `${level === currentLevel ? "✓ " : "  "}${level}`,
			description:
				level === defaultThinkingLevel
					? `${t(LEVEL_DESCRIPTIONS[level])}${t(" · default")}`
					: t(LEVEL_DESCRIPTIONS[level]),
		}));

		// Add top border
		this.panel = new Panel({ border: "line", borderColor: (t: string) => theme.fg("border", t), padX: 0, padY: 0 });
		this.addChild(this.panel);
		this.panel.addChild(new Spacer(1));
		this.panel.addChild(new Text(theme.bold(theme.fg("accent", t("Thinking Level"))), 0, 0));
		this.panel.addChild(new Spacer(1));
		this.panel.addChild(
			new Text(t("{keys} cycles thinking levels in-session", { keys: keyDisplayText("app.thinking.cycle") }), 0, 0),
		);
		this.panel.addChild(new Spacer(1));

		this.searchInput = new Input();
		this.searchInput.onSubmit = () => this.selectList.handleInput("\r");
		this.panel.addChild(this.searchInput);
		this.panel.addChild(new Spacer(1));

		// Create selector
		this.selectList = this.buildSelectList(this.allItems, currentLevel);
		this.selectListChildIndex = this.panel.children.length;
		this.panel.addChild(this.selectList);
		this.panel.addChild(new Spacer(1));
		this.panel.addChild(
			new Text(theme.fg("dim", t("  Enter to select · Ctrl+S to set as default · Esc to cancel")), 0, 0),
		);
	}

	private buildSelectList(items: SelectItem[], preselect?: ThinkingLevel): SelectList {
		const list = new SelectList(items, Math.max(1, items.length), getSelectListTheme(), THINKING_SELECT_LIST_LAYOUT);
		const currentIndex = items.findIndex((item) => item.value === preselect);
		if (currentIndex !== -1) {
			list.setSelectedIndex(currentIndex);
		}
		list.onSelect = (item) => this.onSelect(item.value as ThinkingLevel);
		list.onCancel = () => this.onCancel();
		return list;
	}

	private applyFilter(query: string): void {
		const filtered = query
			? fuzzyFilter(this.allItems, query, (item) => `${item.value} ${item.description ?? ""}`)
			: this.allItems;
		const selectedValue = this.selectList.getSelectedItem()?.value as ThinkingLevel | undefined;
		const newList = this.buildSelectList(filtered, selectedValue);
		this.panel.children[this.selectListChildIndex] = newList;
		this.selectList = newList;
	}

	handleInput(keyData: string): void {
		if (matchesKey(keyData, "ctrl+s") && this.onSelectAsDefault) {
			const item = this.selectList.getSelectedItem();
			if (item) this.onSelectAsDefault(item.value as ThinkingLevel);
			return;
		}

		const kb = getKeybindings();
		const isNav =
			kb.matches(keyData, "tui.select.up") ||
			kb.matches(keyData, "tui.select.down") ||
			kb.matches(keyData, "tui.select.confirm") ||
			kb.matches(keyData, "tui.select.cancel");
		if (isNav) {
			this.selectList.handleInput(keyData);
			return;
		}

		this.searchInput.handleInput(keyData);
		this.applyFilter(this.searchInput.getValue());
	}

	getSelectList(): SelectList {
		return this.selectList;
	}
}
