import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Editor, type EditorOptions, type EditorTheme, type TUI } from "@earendil-works/pi-tui";
import type { AppKeybinding, KeybindingsManager } from "../../../core/keybindings.ts";

/**
 * Custom editor that handles app-level keybindings for coding-agent.
 */
export class CustomEditor extends Editor {
	private keybindings: KeybindingsManager;
	public actionHandlers: Map<AppKeybinding, () => void> = new Map();

	// Special handlers that can be dynamically replaced
	public onEscape?: () => void;
	public onCtrlD?: () => void;
	public onPasteImage?: () => void;
	/** Handler for extension-registered shortcuts. Returns true if handled. */
	public onExtensionShortcut?: (data: string) => boolean;

	private historyPath?: string;

	constructor(
		tui: TUI,
		theme: EditorTheme,
		keybindings: KeybindingsManager,
		options?: EditorOptions,
		historyPath?: string,
	) {
		super(tui, theme, loadInitialHistory(options, historyPath));
		this.keybindings = keybindings;
		this.historyPath = historyPath;
	}

	override addToHistory(text: string): void {
		super.addToHistory(text);
		if (this.historyPath) {
			try {
				const dir = dirname(this.historyPath);
				if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
				// Atomic write (tmp + rename): a crash mid-write keeps the previous complete history
				// instead of a truncated JSON that would read back as empty history.
				const tmpPath = `${this.historyPath}.tmp`;
				writeFileSync(tmpPath, JSON.stringify(this.getHistory()), { mode: 0o600 });
				renameSync(tmpPath, this.historyPath);
			} catch {
				// Ignore history write failures (read-only FS, etc.)
			}
		}
	}

	/**
	 * Register a handler for an app action.
	 */
	onAction(action: AppKeybinding, handler: () => void): void {
		this.actionHandlers.set(action, handler);
	}

	handleInput(data: string): void {
		// Check extension-registered shortcuts first
		if (this.onExtensionShortcut?.(data)) {
			return;
		}

		// Check for clipboard paste keybinding
		if (this.keybindings.matches(data, "app.clipboard.pasteImage")) {
			this.onPasteImage?.();
			return;
		}

		// Check app keybindings first

		// Escape/interrupt - only if autocomplete is NOT active
		if (this.keybindings.matches(data, "app.interrupt")) {
			if (!this.isShowingAutocomplete()) {
				// Use dynamic onEscape if set, otherwise registered handler
				const handler = this.onEscape ?? this.actionHandlers.get("app.interrupt");
				if (handler) {
					handler();
					return;
				}
			}
			// Let parent handle escape for autocomplete cancellation
			super.handleInput(data);
			return;
		}

		// Exit (Ctrl+D) - only when editor is empty
		if (this.keybindings.matches(data, "app.exit")) {
			if (this.getText().length === 0) {
				const handler = this.onCtrlD ?? this.actionHandlers.get("app.exit");
				if (handler) handler();
				return;
			}
			// Fall through to editor handling for delete-char-forward when not empty
		}

		// Explicit history bindings take precedence over app actions while the editor is focused.
		// This lets users bind Ctrl+P even though it cycles models by default.
		if (
			this.keybindings.matches(data, "tui.editor.historyPrevious") ||
			this.keybindings.matches(data, "tui.editor.historyNext")
		) {
			super.handleInput(data);
			return;
		}

		// Check all other app actions
		for (const [action, handler] of this.actionHandlers) {
			if (action !== "app.interrupt" && action !== "app.exit" && this.keybindings.matches(data, action)) {
				handler();
				return;
			}
		}

		// Pass to parent for editor handling
		super.handleInput(data);
	}
}

/** Load persisted history into the editor's initial history; tolerate missing/corrupt file. */
function loadInitialHistory(
	options: EditorOptions | undefined,
	historyPath: string | undefined,
): EditorOptions | undefined {
	if (!historyPath || !existsSync(historyPath)) return options;
	try {
		const parsed = JSON.parse(readFileSync(historyPath, "utf-8")) as unknown;
		if (!Array.isArray(parsed)) return options;
		const entries = parsed.filter((item): item is string => typeof item === "string");
		return { ...options, initialHistory: entries };
	} catch {
		// Ignore corrupt history file
		return options;
	}
}
