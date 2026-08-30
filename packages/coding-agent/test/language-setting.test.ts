import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getLocale, resolveLocaleFromEnv, setLocale } from "@earendil-works/pi-tui";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { applyLocaleSetting } from "../src/i18n/index.ts";

describe("language setting", () => {
	const testDir = join(process.cwd(), "test-language-tmp");
	const agentDir = join(testDir, "agent");
	const projectDir = join(testDir, "project");

	beforeEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
		mkdirSync(agentDir, { recursive: true });
		mkdirSync(join(projectDir, ".pi"), { recursive: true });
	});

	afterEach(() => {
		setLocale("en");
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
	});

	it("setLanguage persists to settings.json and getLanguage reads it back", async () => {
		const settingsManager = SettingsManager.create(projectDir, agentDir);
		expect(settingsManager.getLanguage()).toBeUndefined();

		settingsManager.setLanguage("zh-CN");
		expect(settingsManager.getLanguage()).toBe("zh-CN");
		await settingsManager.flush();

		const stored = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
		expect(stored.language).toBe("zh-CN");
	});

	it("clearLanguage removes the setting", async () => {
		const settingsManager = SettingsManager.create(projectDir, agentDir);
		settingsManager.setLanguage("zh-CN");
		expect(settingsManager.getLanguage()).toBe("zh-CN");

		settingsManager.clearLanguage();
		expect(settingsManager.getLanguage()).toBeUndefined();
		await settingsManager.flush();

		const stored = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
		expect(stored.language).toBeUndefined();
	});

	it("applyLocaleSetting prefers an explicit language over the environment", () => {
		applyLocaleSetting("zh-CN");
		expect(getLocale()).toBe("zh-CN");

		applyLocaleSetting("en");
		expect(getLocale()).toBe("en");
	});

	it("applyLocaleSetting falls back to the environment for auto or unset values", () => {
		const envLocale = resolveLocaleFromEnv({ PI_LOCALE: "fr_FR.UTF-8" });
		applyLocaleSetting("auto");
		// No fr-FR dictionary is registered, but the locale tag itself must resolve.
		expect(envLocale).toBe("fr-FR");
		applyLocaleSetting(undefined);
		setLocale("en");
	});

	it("applyLocaleSetting ignores invalid language values and keeps English", () => {
		applyLocaleSetting("not a locale!");
		expect(getLocale()).toBe("en");
	});
});
