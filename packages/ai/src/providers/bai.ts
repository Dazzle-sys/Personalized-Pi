import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import { BAI_MODELS } from "./bai.models.ts";

export function baiProvider(): Provider<"openai-completions"> {
	return createProvider({
		id: "bai",
		name: "B.AI",
		baseUrl: "https://api.b.ai/v1",
		// 认证仅凭 auth.json 凭证（/login 存储），不使用环境变量
		auth: { apiKey: envApiKeyAuth("B.AI API key", []) },
		models: Object.values(BAI_MODELS),
		api: openAICompletionsApi(),
	});
}
