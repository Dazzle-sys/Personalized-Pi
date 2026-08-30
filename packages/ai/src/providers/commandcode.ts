import { anthropicMessagesApi } from "../api/anthropic-messages.lazy.ts";
import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import type { Api, Model, OpenAICompletionsCompat } from "../types.ts";

const BASE_URL = "https://api.commandcode.ai/provider/v1";
const MODELS_URL = `${BASE_URL}/models`;
const DEFAULT_CONTEXT_WINDOW = 200_000;
const MAX_OUTPUT_TOKENS = 65_536;

interface CommandCodeModelRecord {
	id: string;
	name?: string;
	context_length?: number;
}

function isAnthropicModel(modelId: string): boolean {
	return modelId.startsWith("claude");
}

function toModel(record: CommandCodeModelRecord): Model<Api> {
	const modelId = record.id;
	const isClaude = isAnthropicModel(modelId);
	// The /v1/models endpoint carries no reasoning metadata, so infer from the
	// model id family. Claude runs on Anthropic Messages (native thinking);
	// DeepSeek and the GPT-5 family are reasoning models on OpenAI Completions.
	const isDeepseek = modelId.startsWith("deepseek");
	const isGpt5 = /^gpt-5/.test(modelId);
	const reasoning = isClaude || isDeepseek || isGpt5;
	const api: Api = isClaude ? "anthropic-messages" : "openai-completions";
	const contextWindow =
		typeof record.context_length === "number" && record.context_length > 0
			? record.context_length
			: DEFAULT_CONTEXT_WINDOW;
	// Command Code is a gateway over many backends; send the broadly-accepted
	// `max_tokens` and skip the OpenAI-only `store` param to avoid backend rejects.
	let compat: OpenAICompletionsCompat | undefined;
	if (api === "openai-completions") {
		compat = { supportsStore: false, maxTokensField: "max_tokens" };
		if (isDeepseek) {
			// DeepSeek streams reasoning_content on assistant messages; use
			// DeepSeek-style thinking formatting like the B.AI catalog does.
			compat = {
				...compat,
				requiresReasoningContentOnAssistantMessages: true,
				thinkingFormat: "deepseek",
				supportsDeveloperRole: false,
			};
		}
	}
	return {
		id: modelId,
		name: record.name ?? modelId,
		api,
		provider: "commandcode",
		baseUrl: BASE_URL,
		reasoning,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow,
		maxTokens: Math.min(contextWindow, MAX_OUTPUT_TOKENS),
		compat,
	} as Model<Api>;
}

/** Small synchronous baseline so the provider is usable before the first live refresh. */
export function baselineModels(): Model<Api>[] {
	return [
		toModel({ id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", context_length: 1_000_000 }),
		toModel({ id: "gpt-5.4-mini", name: "GPT-5.4 Mini", context_length: 400_000 }),
		toModel({ id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", context_length: 200_000 }),
	];
}

/** Command Code gateway provider with a live, dynamically refreshed catalog. */
export function commandcodeProvider(): Provider<Api> {
	return createProvider<Api>({
		id: "commandcode",
		name: "Command Code",
		baseUrl: BASE_URL,
		auth: { apiKey: envApiKeyAuth("Command Code API key", ["COMMANDCODE_API_KEY"]) },
		models: baselineModels(),
		fetchModels: async (context) => {
			const apiKey = context.credential?.type === "api_key" ? context.credential.key : undefined;
			const response = await fetch(MODELS_URL, {
				headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
				signal: context.signal,
			});
			if (context.signal.aborted) return [];
			if (!response.ok) {
				throw new Error(`Command Code models request failed: ${response.status}`);
			}
			const payload = (await response.json()) as { data?: CommandCodeModelRecord[] };
			return (payload.data ?? []).filter((record) => typeof record.id === "string").map(toModel);
		},
		// Command Code serves OpenAI-format models on /chat/completions and
		// Anthropic-format models (Claude) on /messages; dispatch per model.
		api: {
			"openai-completions": openAICompletionsApi(),
			"anthropic-messages": anthropicMessagesApi(),
		},
	});
}
