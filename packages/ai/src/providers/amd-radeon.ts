import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import { AMD_RADEON_MODELS } from "./amd-radeon.models.ts";

export function amdRadeonProvider(): Provider<"openai-completions"> {
	return createProvider({
		id: "amd-radeon",
		name: "AMD Radeon Cloud",
		baseUrl: "https://developer.amd.com.cn/radeon/api/v1",
		auth: { apiKey: envApiKeyAuth("AMD Radeon Cloud API key", ["AMD_RADEON_API_KEY"]) },
		models: Object.values(AMD_RADEON_MODELS),
		api: openAICompletionsApi(),
	});
}
