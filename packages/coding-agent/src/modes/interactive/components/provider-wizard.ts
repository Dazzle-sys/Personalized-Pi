/**
 * Dialog-style provider wizard: sequential field prompts that build a
 * ModelsJsonProvider, written to models.json by the caller on completion.
 * Mirrors the LoginDialogComponent prompt/append/input pattern.
 */

import { Container, getKeybindings, Input, Spacer, Text, type TUI, t } from "@earendil-works/pi-tui";
import type { ModelsJsonProvider } from "../../../core/model-config.ts";
import { theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint } from "./keybinding-hints.ts";
import {
	API_CHOICES,
	buildProviderConfig,
	sanitizeProviderId,
	validateProviderId,
	type WizardAnswers,
} from "./provider-wizard-flows.ts";

/** Callback used when the wizard needs a choice; the host mounts the selector UI. */
export type WizardAskChoice = (message: string, choices: readonly string[]) => Promise<string | undefined>;

export class ProviderWizardDialog extends Container {
	private contentContainer: Container;
	private input: Input;
	private tui: TUI;
	private abortController = new AbortController();
	private inputResolver?: (value: string) => void;
	private inputRejecter?: (error: Error) => void;
	private onComplete: (providerId: string, config: ModelsJsonProvider) => void;
	private onCancel: () => void;
	private initialProviderId?: string;
	private askChoiceCallback: WizardAskChoice;
	private cancelTriggered = false;

	// Focusable implementation - propagate to input for IME cursor positioning
	private _focused = false;
	get focused(): boolean {
		return this._focused;
	}
	set focused(value: boolean) {
		this._focused = value;
		this.input.focused = value;
	}

	constructor(
		tui: TUI,
		onComplete: (providerId: string, config: ModelsJsonProvider) => void,
		onCancel: () => void,
		askChoice: WizardAskChoice,
		initialProviderId?: string,
	) {
		super();
		this.tui = tui;
		this.onComplete = onComplete;
		this.onCancel = onCancel;
		this.askChoiceCallback = askChoice;
		this.initialProviderId = initialProviderId;

		this.addChild(new DynamicBorder());
		this.addChild(new Text(theme.fg("accent", theme.bold(t("Add custom provider"))), 1, 0));

		this.contentContainer = new Container();
		this.addChild(this.contentContainer);

		this.input = new Input();
		this.input.onSubmit = () => {
			if (this.inputResolver) {
				const value = this.input.getValue();
				this.replaceInputWithSubmittedText(value);
				this.inputResolver(value);
				this.inputResolver = undefined;
				this.inputRejecter = undefined;
			}
		};
		this.input.onEscape = () => this.cancel();

		this.addChild(new DynamicBorder());
	}

	get signal(): AbortSignal {
		return this.abortController.signal;
	}

	// cancel() can be reached twice (validation paths call it, then re-throw into
	// run()'s catch). Guard so abort/onCancel fire only once.
	private cancel(errorMessage = "Cancelled"): void {
		if (this.cancelTriggered) return;
		this.cancelTriggered = true;
		this.abortController.abort();
		if (this.inputRejecter) {
			this.inputRejecter(new Error(errorMessage));
			this.inputResolver = undefined;
			this.inputRejecter = undefined;
		}
		this.onCancel();
	}

	private replaceInputWithSubmittedText(value: string): void {
		this.contentContainer.children = this.contentContainer.children.map((child) =>
			child === this.input ? new Text(theme.fg("dim", `> ${value}`), 0, 0) : child,
		);
	}

	private askText(message: string, placeholder?: string): Promise<string> {
		this.contentContainer.addChild(new Spacer(1));
		this.contentContainer.addChild(new Text(theme.fg("text", message), 1, 0));
		if (placeholder) {
			this.contentContainer.addChild(
				new Text(theme.fg("dim", t("e.g., {example}", { example: placeholder })), 1, 0),
			);
		}
		this.contentContainer.addChild(this.input);
		this.contentContainer.addChild(
			new Text(
				`(${keyHint("tui.select.cancel", "to cancel,")} ${keyHint("tui.select.confirm", "to submit")})`,
				1,
				0,
			),
		);
		this.input.setValue("");
		this.tui.requestRender();
		return new Promise((resolve, reject) => {
			this.inputResolver = resolve;
			this.inputRejecter = reject;
		});
	}

	private askDetails(lines: string[]): void {
		this.contentContainer.addChild(new Spacer(1));
		for (const line of lines) {
			this.contentContainer.addChild(new Text(theme.fg("text", line), 1, 0));
		}
		this.tui.requestRender();
	}

	private async askNumber(message: string, placeholder: string, fallback: number): Promise<number> {
		const raw = await this.askText(message, placeholder);
		const parsed = Number(raw);
		if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
		return parsed;
	}

	private async askYesNo(message: string): Promise<boolean> {
		const answer = await this.askText(`${message} (y/N)`, "n");
		return answer.trim().toLowerCase() === "y";
	}

	private async askChoice(message: string, choices: readonly string[]): Promise<string | undefined> {
		// Delegate to the host, which owns editorContainer + focus.
		const result = await this.askChoiceCallback(message, choices);
		if (result) this.askDetails([theme.fg("dim", `> ${result}`)]);
		return result;
	}

	handleInput(data: string): void {
		const kb = getKeybindings();
		if (kb.matches(data, "tui.select.cancel")) {
			this.cancel();
			return;
		}
		this.input.handleInput(data);
	}

	/**
	 * Drive the whole flow. Collect final answers, build config, and complete.
	 * Each step re-uses askText/askChoice; the caller (interactive-mode) owns mounting.
	 */
	async run(): Promise<void> {
		try {
			const providerId = await this.askText(
				t("Provider id (lowercase letters, digits, dashes):"),
				this.initialProviderId ? sanitizeProviderId(this.initialProviderId) : "my-local",
			);
			const cleanId = sanitizeProviderId(providerId);
			const idError = validateProviderId(cleanId);
			if (idError) {
				this.askDetails([theme.fg("warning", idError)]);
				this.cancel(idError);
				return;
			}

			const name = (await this.askText(t("Display name:"), cleanId)).trim() || cleanId;

			const api = (await this.askChoice(t("API type:"), API_CHOICES)) ?? "openai-completions";

			const baseUrl = (await this.askText(t("Base URL:"), "https://api.example.com/v1")).trim();
			if (!baseUrl) {
				this.askDetails([theme.fg("warning", t("Base URL is required."))]);
				this.cancel("Base URL required");
				return;
			}

			const apiKey =
				(await this.askText(t("API key (or $ENV_VAR reference), leave blank for none:"))).trim() || undefined;

			const authHeader = await this.askYesNo(t("Use Authorization: Bearer header for the key?"));

			// Build one model. (Extended multi-model is a follow-up; YAGNI until requested.)
			const model = await this.collectModel();

			const answers: WizardAnswers = {
				providerId: cleanId,
				name,
				api,
				baseUrl,
				apiKey,
				authHeader,
				headers: {},
				models: [model],
			};
			this.onComplete(cleanId, buildProviderConfig(answers));
		} catch (error) {
			this.cancel(error instanceof Error ? error.message : "Cancelled");
		}
	}

	private async collectModel(): Promise<WizardAnswers["models"][number]> {
		const id = (await this.askText(t("Model id:"), "my-model")).trim();
		if (!id) {
			this.askDetails([theme.fg("warning", t("Model id is required."))]);
			this.cancel("Model id required");
			return Promise.reject(new Error("Model id required"));
		}
		const name = (await this.askText(t("Model display name:"), id)).trim() || id;
		const reasoning = await this.askYesNo(t("Supports extended thinking?"));
		const imageInput = await this.askYesNo(t("Supports image input?"));
		const contextWindow = await this.askNumber(t("Context window (tokens):"), "128000", 128000);
		const maxTokens = await this.askNumber(t("Max output tokens:"), "4096", 4096);
		const costIn = await this.askNumber(t("Cost in ($/1M tokens):"), "0", 0);
		const costOut = await this.askNumber(t("Cost out ($/1M tokens):"), "0", 0);
		const costCacheRead = await this.askNumber(t("Cost cache read ($/1M tokens):"), "0", 0);
		const costCacheWrite = await this.askNumber(t("Cost cache write ($/1M tokens):"), "0", 0);
		return {
			id,
			name,
			reasoning,
			input: imageInput ? (["text", "image"] as ("text" | "image")[]) : (["text"] as ("text" | "image")[]),
			contextWindow,
			maxTokens,
			costIn,
			costOut,
			costCacheRead,
			costCacheWrite,
		};
	}
}
