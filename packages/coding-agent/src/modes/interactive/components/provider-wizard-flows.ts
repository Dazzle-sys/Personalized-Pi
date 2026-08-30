import { t } from "@earendil-works/pi-tui";
import type { ModelsJsonModel, ModelsJsonProvider } from "../../../core/model-config.ts";

/** API types that fit the wizard's baseUrl + apiKey + optional Bearer authHeader
 *  collection. Provider families needing dedicated credentials or non-baseUrl
 *  config (Bedrock/AWS, Vertex/GCP, Azure resource mapping, Codex sub, Gemini
 *  `?key=` auth) are excluded: the wizard cannot express them, so selecting one
 *  would produce a provider that cannot authenticate. */
export const API_CHOICES: readonly string[] = [
	"openai-completions",
	"anthropic-messages",
	"openai-responses",
	"mistral-conversations",
	"pi-messages",
];

export interface WizardModelAnswers {
	id: string;
	name: string;
	reasoning: boolean;
	input: ("text" | "image")[];
	contextWindow: number;
	maxTokens: number;
	costIn: number;
	costOut: number;
	costCacheRead: number;
	costCacheWrite: number;
}

export interface WizardAnswers {
	providerId: string;
	name: string;
	api: string;
	baseUrl: string;
	apiKey?: string;
	authHeader: boolean;
	headers: Record<string, string>;
	models: WizardModelAnswers[];
}

/** Replace non-slug characters with "-" and lowercase, so ids are safe as config keys. */
export function sanitizeProviderId(id: string): string {
	return id
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Return a user-facing error message when id is invalid, else undefined. */
export function validateProviderId(id: string): string | undefined {
	if (!id.trim()) return t("Provider id is required.");
	if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
		return t("Provider id may only contain lowercase letters, digits, and dashes (e.g. my-local).");
	}
	return undefined;
}

function modelFromAnswers(m: WizardModelAnswers): ModelsJsonModel {
	return {
		id: m.id,
		name: m.name || m.id,
		reasoning: m.reasoning,
		input: m.input,
		cost: {
			input: m.costIn,
			output: m.costOut,
			cacheRead: m.costCacheRead,
			cacheWrite: m.costCacheWrite,
		},
		contextWindow: m.contextWindow,
		maxTokens: m.maxTokens,
	};
}

/** Convert wizard answers into a ModelsJsonProvider matching the models.json schema. */
export function buildProviderConfig(answers: WizardAnswers): ModelsJsonProvider {
	const config: ModelsJsonProvider = {
		name: answers.name || answers.providerId,
		baseUrl: answers.baseUrl,
		api: answers.api,
		models: answers.models.map(modelFromAnswers),
	};
	if (answers.apiKey) config.apiKey = answers.apiKey;
	if (answers.authHeader) config.authHeader = true;
	if (Object.keys(answers.headers).length > 0) config.headers = answers.headers;
	return config;
}
