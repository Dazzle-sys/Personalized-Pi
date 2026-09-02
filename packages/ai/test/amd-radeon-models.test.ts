import { describe, expect, it } from "vitest";
import { getModels } from "../src/compat.ts";
import { findEnvKeys } from "../src/env-api-keys.ts";

const AMD_MODEL_IDS = [
	"DeepSeek-V4-Flash",
	"DeepSeek-V4-Flash-Vision-Exp",
	"MiniCPM-V46",
	"MiniCPM5-1B",
	"Qwen3.8-Flash-Next",
];

describe("AMD Radeon Cloud models", () => {
	it("exposes exactly the five public free models", () => {
		const modelIds = getModels("amd-radeon")
			.map((model) => model.id)
			.sort();
		expect(modelIds).toEqual([...AMD_MODEL_IDS].sort());
	});

	it("reuses the AMD Radeon environment variable", () => {
		expect(findEnvKeys("amd-radeon", { AMD_RADEON_API_KEY: "test" })).toEqual(["AMD_RADEON_API_KEY"]);
	});

	it("points at the Radeon Cloud OpenAI-compatible endpoint", () => {
		for (const model of getModels("amd-radeon")) {
			expect(model.baseUrl).toBe("https://developer.amd.com.cn/radeon/api/v1");
			expect(model.api).toBe("openai-completions");
		}
	});

	it("does not send unsupported OpenAI fields", () => {
		for (const model of getModels("amd-radeon")) {
			expect(model.compat).toMatchObject({
				supportsDeveloperRole: false,
				supportsStore: false,
				supportsReasoningEffort: false,
				maxTokensField: "max_tokens",
			});
		}
	});

	it("splits the five free models into 3 text + 2 vision", () => {
		const textModels = getModels("amd-radeon")
			.filter((model) => !model.input.includes("image"))
			.map((model) => model.id);
		const visionModels = getModels("amd-radeon")
			.filter((model) => model.input.includes("image"))
			.map((model) => model.id);
		expect(textModels.sort()).toEqual(["DeepSeek-V4-Flash", "MiniCPM5-1B", "Qwen3.8-Flash-Next"].sort());
		expect(visionModels.sort()).toEqual(["DeepSeek-V4-Flash-Vision-Exp", "MiniCPM-V46"].sort());
	});

	it("tags vision-capable free models with image input", () => {
		const byId = new Map(getModels("amd-radeon").map((model) => [model.id, model]));
		expect(byId.get("Qwen3.8-Flash-Next")?.input).toEqual(["text"]);
		expect(byId.get("DeepSeek-V4-Flash-Vision-Exp")?.input).toEqual(["text", "image"]);
		expect(byId.get("MiniCPM-V46")?.input).toEqual(["text", "image"]);
		expect(byId.get("DeepSeek-V4-Flash")?.input).toEqual(["text"]);
		expect(byId.get("MiniCPM5-1B")?.input).toEqual(["text"]);
	});

	it("marks reasoning models and not the non-reasoning MiniCPM-V46", () => {
		const byId = new Map(getModels("amd-radeon").map((model) => [model.id, model]));
		expect(byId.get("Qwen3.8-Flash-Next")?.reasoning).toBe(true);
		expect(byId.get("DeepSeek-V4-Flash")?.reasoning).toBe(true);
		expect(byId.get("DeepSeek-V4-Flash-Vision-Exp")?.reasoning).toBe(true);
		expect(byId.get("MiniCPM5-1B")?.reasoning).toBe(true);
		expect(byId.get("MiniCPM-V46")?.reasoning).toBe(false);
	});
});
