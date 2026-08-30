import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setKeybindings, TuiMainScreen } from "@earendil-works/pi-tui";
import { afterEach, describe, expect, it } from "vitest";
import { defaultEditorTheme } from "../../tui/test/test-themes.ts";
import { VirtualTerminal } from "../../tui/test/virtual-terminal.ts";
import { KeybindingsManager } from "../src/core/keybindings.ts";
import { CustomEditor } from "../src/modes/interactive/components/custom-editor.ts";

afterEach(() => {
	setKeybindings(new KeybindingsManager());
});

describe("CustomEditor prompt history keybindings", () => {
	it("gives an explicit history binding precedence over model cycling", () => {
		const keybindings = new KeybindingsManager({
			"tui.editor.historyPrevious": "ctrl+p",
			"tui.editor.historyNext": "ctrl+n",
		});
		setKeybindings(keybindings);
		const editor = new CustomEditor(new TuiMainScreen(new VirtualTerminal()), defaultEditorTheme, keybindings);
		let modelCycles = 0;
		editor.onAction("app.model.cycleForward", () => {
			modelCycles++;
		});
		editor.addToHistory("previous prompt");
		editor.setText("draft");

		editor.handleInput("\x10"); // Ctrl+P
		expect(editor.getText()).toBe("previous prompt");
		expect(modelCycles).toBe(0);

		editor.handleInput("\x0e"); // Ctrl+N
		expect(editor.getText()).toBe("draft");
	});
});

describe("CustomEditor persistent prompt history", () => {
	/** Fresh editor wired to a temp history file. */
	function makeEditor(historyPath: string) {
		const keybindings = new KeybindingsManager();
		setKeybindings(keybindings);
		return new CustomEditor(
			new TuiMainScreen(new VirtualTerminal()),
			defaultEditorTheme,
			keybindings,
			undefined,
			historyPath,
		);
	}

	it("persists history to disk and reloads it on a new instance", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-history-"));
		const historyPath = join(dir, "prompt-history.json");
		try {
			const editor = makeEditor(historyPath);
			editor.addToHistory("first prompt");
			editor.addToHistory("second prompt");

			const onDisk = JSON.parse(readFileSync(historyPath, "utf-8")) as string[];
			expect(onDisk).toEqual(["second prompt", "first prompt"]);

			// A fresh instance loads the persisted history (most recent first).
			const reloaded = makeEditor(historyPath);
			expect(reloaded.getHistory()).toEqual(["second prompt", "first prompt"]);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("tolerates a missing or corrupt history file", () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-history-"));
		const historyPath = join(dir, "prompt-history.json");
		try {
			// Missing file -> empty history.
			expect(makeEditor(historyPath).getHistory()).toEqual([]);

			// Corrupt file -> empty history rather than throwing.
			writeFileSync(historyPath, "{ not valid json");
			expect(makeEditor(historyPath).getHistory()).toEqual([]);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
