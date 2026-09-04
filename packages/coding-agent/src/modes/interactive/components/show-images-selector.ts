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
import { getSelectListTheme, theme } from "../theme/theme.ts";

const SHOW_IMAGES_SELECT_LIST_LAYOUT: SelectListLayoutOptions = {
	minPrimaryColumnWidth: 12,
	maxPrimaryColumnWidth: 32,
};

/**
 * Component that renders a show images selector with borders
 */
export class ShowImagesSelectorComponent extends Container {
	private selectList: SelectList;

	constructor(currentValue: boolean, onSelect: (show: boolean) => void, onCancel: () => void) {
		super();

		const items: SelectItem[] = [
			{
				value: "yes",
				label: `${currentValue ? "✓ " : "  "}${t("Yes")}`,
				description: t("Show images inline in terminal"),
			},
			{
				value: "no",
				label: `${currentValue ? "  " : "✓ "}${t("No")}`,
				description: t("Show text placeholder instead"),
			},
		];

		// Top border, title, and separator
		const panel = new Panel({ border: "line", borderColor: (t: string) => theme.fg("border", t), padX: 0, padY: 0 });
		this.addChild(panel);
		panel.addChild(new Spacer(1));
		panel.addChild(new Text(theme.bold(theme.fg("accent", t("Show images"))), 0, 0));
		panel.addChild(new Spacer(1));

		// Create selector
		this.selectList = new SelectList(items, 5, getSelectListTheme(), SHOW_IMAGES_SELECT_LIST_LAYOUT);

		// Preselect current value
		this.selectList.setSelectedIndex(currentValue ? 0 : 1);

		this.selectList.onSelect = (item) => {
			onSelect(item.value === "yes");
		};

		this.selectList.onCancel = () => {
			onCancel();
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
