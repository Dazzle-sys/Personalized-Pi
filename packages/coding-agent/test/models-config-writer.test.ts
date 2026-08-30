import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ModelsJsonProvider } from "../src/core/model-config.ts";
import { hasProvider, readProviders, upsertProvider } from "../src/core/models-config-writer.ts";

function makeProvider(): ModelsJsonProvider {
	return {
		name: "My Local",
		baseUrl: "http://localhost:8080/v1",
		apiKey: "$MY_LOCAL_API_KEY",
		api: "openai-completions",
		models: [
			{
				id: "my-model",
				name: "My Model",
				reasoning: false,
				input: ["text"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 128000,
				maxTokens: 4096,
			},
		],
	};
}

describe("models-config-writer", () => {
	let dir: string;
	let modelsPath: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-models-writer-"));
		modelsPath = join(dir, "models.json");
	});

	afterEach(() => {
		if (dir) rmSync(dir, { recursive: true, force: true });
	});

	it("returns empty providers when file is missing", () => {
		expect(readProviders(modelsPath)).toEqual({});
		expect(hasProvider("my-local", modelsPath)).toBe(false);
	});

	it("reads existing providers from a file with comments and trailing commas", () => {
		writeFileSync(
			modelsPath,
			`{
				"providers": {
					"existing": {
						"baseUrl": "https://example.com/v1",
						"api": "openai-completions",
						"models": [{ "id": "m" }]
					},
				},
			}`,
		);
		expect(hasProvider("existing", modelsPath)).toBe(true);
	});

	it("upserts a provider, preserving unrelated providers", () => {
		writeFileSync(
			modelsPath,
			JSON.stringify({ providers: { existing: { baseUrl: "https://a.example/v1", api: "openai-completions" } } }),
		);
		upsertProvider("my-local", makeProvider(), modelsPath);
		const providers = readProviders(modelsPath);
		expect(providers["my-local"]).toEqual(makeProvider());
		expect(providers.existing).toEqual({ baseUrl: "https://a.example/v1", api: "openai-completions" });
	});

	it("creates the file and parent dir when absent", () => {
		upsertProvider("my-local", makeProvider(), modelsPath);
		const providers = readProviders(modelsPath);
		expect(providers["my-local"]).toEqual(makeProvider());
	});

	it("replaces an existing provider of the same id", () => {
		upsertProvider("my-local", makeProvider(), modelsPath);
		const updated = { ...makeProvider(), baseUrl: "http://localhost:9090/v1" };
		upsertProvider("my-local", updated, modelsPath);
		expect(readProviders(modelsPath)["my-local"]).toEqual(updated);
	});

	it("writes valid JSON that ModelConfig can re-parse", () => {
		upsertProvider("my-local", makeProvider(), modelsPath);
		expect(() => JSON.parse(readFileSync(modelsPath, "utf-8"))).not.toThrow();
	});

	it("throws instead of clobbering a malformed file", () => {
		writeFileSync(modelsPath, "{ providers: { existing: { } }"); // invalid JSON
		expect(() => upsertProvider("my-local", makeProvider(), modelsPath)).toThrow();
		// The malformed file is left untouched rather than overwritten.
		expect(readFileSync(modelsPath, "utf-8")).toBe("{ providers: { existing: { } }");
	});
});
