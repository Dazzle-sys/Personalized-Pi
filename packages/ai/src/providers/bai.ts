import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import { BAI_MODELS } from "./bai.models.ts";

export function baiProvider(): Provider<"openai-completions"> {
	return createProvider({
		id: "bai",
		name: "B.AI",
		baseUrl: "https://api.b.ai/v1",
		auth: { apiKey: envApiKeyAuth("B.AI API key", ["BAI_API_KEY"]) },
		models: Object.values(BAI_MODELS),
		api: openAICompletionsApi(),
	});
}
