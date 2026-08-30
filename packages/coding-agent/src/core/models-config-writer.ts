/**
 * Read-merge-write support for ~/.pi/agent/models.json providers.
 * Uses proper-lockfile (mirrors settings-manager) so concurrent sessions
 * do not clobber each other's providers.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import lockfile from "proper-lockfile";
import { getModelsPath } from "../config.ts";
import { stripJsonComments } from "../utils/json.ts";
import { stripBom } from "../utils/text.ts";
import type { ModelsJsonProvider } from "./model-config.ts";

const WRITE_OPTIONS = { encoding: "utf-8", mode: 0o600 } as const;

type ProvidersMap = Record<string, ModelsJsonProvider>;

function acquireLockSyncWithRetry(path: string): () => void {
	const maxAttempts = 10;
	const delayMs = 20;
	let lastError: unknown;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return lockfile.lockSync(path, { realpath: false });
		} catch (error) {
			const code =
				typeof error === "object" && error !== null && "code" in error
					? String((error as { code?: unknown }).code)
					: undefined;
			if (code !== "ELOCKED" || attempt === maxAttempts) throw error;
			lastError = error;
			const start = Date.now();
			while (Date.now() - start < delayMs) {
				// Sleep synchronously to keep callers synchronous (matches settings-manager).
			}
		}
	}
	throw (lastError as Error) ?? new Error("Failed to acquire models.json lock");
}

function parseProviders(content: string | undefined): ProvidersMap {
	if (!content) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(stripJsonComments(stripBom(content)));
	} catch {
		// Strict: fail loudly so callers that must not clobber the file (e.g.
		// upsertProvider) throw instead of silently overwriting user content.
		throw new Error("models.json contains invalid JSON; fix it before making changes");
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
	const providers = (parsed as { providers?: unknown }).providers;
	if (typeof providers !== "object" || providers === null || Array.isArray(providers)) return {};
	return providers as ProvidersMap;
}

function writeProviders(path: string, providers: ProvidersMap): void {
	const dir = dirname(path);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
	writeFileSync(path, JSON.stringify({ providers }, null, 2), WRITE_OPTIONS);
}

/** Read providers as a plain object; missing or malformed files yield {}. */
export function readProviders(modelsPath: string = getModelsPath()): ProvidersMap {
	if (!existsSync(modelsPath)) return {};
	// Lenient by default: a malformed file reads as empty rather than throwing,
	// matching the previous best-effort behavior. upsertProvider is the strict path.
	try {
		return parseProviders(readFileSync(modelsPath, "utf-8"));
	} catch {
		return {};
	}
}

/** Return true if the provider id is present in models.json. */
export function hasProvider(providerId: string, modelsPath: string = getModelsPath()): boolean {
	return providerId in readProviders(modelsPath);
}

/**
 * Insert or replace a single provider in models.json, preserving all others.
 * Creates the file/parent dir when absent. Synchronous lock on the target file.
 */
export function upsertProvider(
	providerId: string,
	provider: ModelsJsonProvider,
	modelsPath: string = getModelsPath(),
): void {
	if (!existsSync(modelsPath)) {
		// Materialize an empty file first so the lock target exists; the merge
		// below then runs under the lock, closing the concurrent first-create
		// race that would otherwise let two sessions clobber each other.
		writeProviders(modelsPath, {});
	}
	let release: (() => void) | undefined;
	try {
		release = acquireLockSyncWithRetry(modelsPath);
		const current = readFileSync(modelsPath, "utf-8");
		const providers = parseProviders(current);
		providers[providerId] = provider;
		writeProviders(modelsPath, providers);
	} finally {
		release?.();
	}
}
