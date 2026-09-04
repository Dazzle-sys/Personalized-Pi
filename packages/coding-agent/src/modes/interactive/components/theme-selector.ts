import {
	Container,
	Panel,
	type SelectItem,
	SelectList,
	type SelectListLayoutOptions,
	Spacer,
	Text,
	t,
} from "@earendil-works/pi-tui";
import { getAvailableThemes, getSelectListTheme, theme } from "../theme/theme.ts";

const THEME_SELECT_LIST_LAYOUT: SelectListLayoutOptions = {
	minPrimaryColumnWidth: 12,
	maxPrimaryColumnWidth: 32,
};

/**
 * Component that renders a theme selector
 */
export class ThemeSelectorComponent extends Container {
	private selectList: SelectList;
	private onPreview: (themeName: string) => void;

	constructor(
		currentTheme: string,
		onSelect: (themeName: string) => void,
		onCancel: () => void,
		onPreview: (themeName: string) => void,
	) {
		super();
		this.onPreview = onPreview;

		// Get available themes and create select items
		const themes = getAvailableThemes();
		const themeItems: SelectItem[] = themes.map((name) => ({
			value: name,
			label: `${name === currentTheme ? "✓ " : "  "}${name}`,
		}));

		// Top border, title, and separator
		const panel = new Panel({ border: "line", borderColor: (t: string) => theme.fg("border", t), padX: 0, padY: 0 });
		this.addChild(panel);
		panel.addChild(new Spacer(1));
		panel.addChild(new Text(theme.bold(theme.fg("accent", t("Theme"))), 0, 0));
		panel.addChild(new Spacer(1));

		// Create selector
		this.selectList = new SelectList(themeItems, 15, getSelectListTheme(), THEME_SELECT_LIST_LAYOUT);

		// Preselect current theme
		const currentIndex = themes.indexOf(currentTheme);
		if (currentIndex !== -1) {
			this.selectList.setSelectedIndex(currentIndex);
		}

		this.selectList.onSelect = (item) => {
			onSelect(item.value);
		};

		this.selectList.onCancel = () => {
			onCancel();
		};

		this.selectList.onSelectionChange = (item) => {
			this.onPreview(item.value);
		};

		panel.addChild(this.selectList);

		// Bottom hint and border
		panel.addChild(new Spacer(1));
		panel.addChild(new Text(theme.fg("dim", t("  Enter to select · Esc to cancel")), 0, 0));
	}

	getSelectList(): SelectList {
		return this.selectList;
	}
}
