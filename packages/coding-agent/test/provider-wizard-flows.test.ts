import { describe, expect, it } from "vitest";
import {
	buildProviderConfig,
	sanitizeProviderId,
	validateProviderId,
	type WizardAnswers,
} from "../src/modes/interactive/components/provider-wizard-flows.ts";

function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
	return {
		providerId: "my-local",
		name: "My Local",
		api: "openai-completions",
		baseUrl: "http://localhost:8080/v1",
		apiKey: "$MY_LOCAL_API_KEY",
		authHeader: false,
		headers: {} as Record<string, string>,
		models: [
			{
				id: "my-model",
				name: "My Model",
				reasoning: false,
				input: ["text"] as ("text" | "image")[],
				contextWindow: 128000,
				maxTokens: 4096,
				costIn: 0,
				costOut: 0,
				costCacheRead: 0,
				costCacheWrite: 0,
			},
		],
		...overrides,
	};
}

describe("provider-wizard-flows", () => {
	it("sanitizes provider ids to lowercase slug", () => {
		expect(sanitizeProviderId("My Local Provider")).toBe("my-local-provider");
		expect(sanitizeProviderId("Proxy_2")).toBe("proxy-2");
	});

	it("validateProviderId accepts a clean slug", () => {
		expect(validateProviderId("my-local")).toBeUndefined();
	});

	it("validateProviderId rejects empty and whitespace-only ids", () => {
		expect(validateProviderId("")).toBeTruthy();
		expect(validateProviderId("   ")).toBeTruthy();
	});

	it("validateProviderId rejects ids with invalid characters", () => {
		expect(validateProviderId("my local")).toBeTruthy();
		expect(validateProviderId("my_local")).toBeTruthy();
	});

	it("buildProviderConfig produces a valid provider with one model", () => {
		const config = buildProviderConfig(makeAnswers());
		expect(config.baseUrl).toBe("http://localhost:8080/v1");
		expect(config.api).toBe("openai-completions");
		expect(config.apiKey).toBe("$MY_LOCAL_API_KEY");
		expect(config.models?.[0]?.id).toBe("my-model");
		expect(config.models?.[0]?.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
	});

	it("buildProviderConfig maps cost fields and reasoning flag", () => {
		const config = buildProviderConfig(
			makeAnswers({
				models: [
					{
						id: "m2",
						name: "M2",
						reasoning: true,
						input: ["text", "image"],
						contextWindow: 200000,
						maxTokens: 8192,
						costIn: 1.5,
						costOut: 4.5,
						costCacheRead: 0.2,
						costCacheWrite: 1.5,
					},
				],
			}),
		);
		expect(config.models?.[0]?.reasoning).toBe(true);
		expect(config.models?.[0]?.input).toEqual(["text", "image"]);
		expect(config.models?.[0]?.cost).toEqual({ input: 1.5, output: 4.5, cacheRead: 0.2, cacheWrite: 1.5 });
	});
});
