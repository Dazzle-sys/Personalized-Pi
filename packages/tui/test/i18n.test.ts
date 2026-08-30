import assert from "node:assert";
import { describe, it } from "node:test";
import {
	getAvailableLocales,
	getLocale,
	hasTranslations,
	normalizeLocaleTag,
	registerTranslations,
	resolveLocaleFromEnv,
	setLocale,
	t,
	zhCNTranslations,
} from "../src/index.ts";

describe("i18n", () => {
	it("returns the source string when no translation is registered", () => {
		setLocale("en");
		assert.strictEqual(t("Copied!"), "Copied!");
	});

	it("returns the translated string for the active locale", () => {
		registerTranslations("xx-XX", { "Copied!": "XX!" });
		setLocale("xx-XX");
		assert.strictEqual(t("Copied!"), "XX!");
		setLocale("en");
		assert.strictEqual(t("Copied!"), "Copied!");
	});

	it("falls back to the source string for missing entries", () => {
		registerTranslations("xx-XX", { "Copied!": "XX!" });
		setLocale("xx-XX");
		assert.strictEqual(t("Copy failed"), "Copy failed");
		setLocale("en");
	});

	it("interpolates {name} parameters", () => {
		assert.strictEqual(t("Debug log written to: {path}", { path: "/tmp/a.log" }), "Debug log written to: /tmp/a.log");
		registerTranslations("xx-XX", { "Debug log written to: {path}": "P {path}" });
		setLocale("xx-XX");
		assert.strictEqual(t("Debug log written to: {path}", { path: "/tmp/a.log" }), "P /tmp/a.log");
		setLocale("en");
	});

	it("leaves unknown placeholders untouched", () => {
		assert.strictEqual(t("value {missing}", { other: "x" }), "value {missing}");
	});

	it("does not interpolate when no params are given", () => {
		assert.strictEqual(t("literal {name} braces"), "literal {name} braces");
	});

	it("merges repeated registrations and later keys win", () => {
		registerTranslations("yy-YY", { a: "1" });
		registerTranslations("yy-YY", { a: "2", b: "3" });
		setLocale("yy-YY");
		assert.strictEqual(t("a"), "2");
		assert.strictEqual(t("b"), "3");
		setLocale("en");
	});

	it("normalizes locale tags", () => {
		assert.strictEqual(normalizeLocaleTag("zh_CN.UTF-8"), "zh-CN");
		assert.strictEqual(normalizeLocaleTag("en-US"), "en-US");
		assert.strictEqual(normalizeLocaleTag("EN"), "en");
		assert.strictEqual(normalizeLocaleTag("C"), "");
		assert.strictEqual(normalizeLocaleTag(""), "");
	});

	it("resolves locale from environment variables in priority order", () => {
		assert.strictEqual(resolveLocaleFromEnv({ PI_LOCALE: "fr_FR.UTF-8", LANG: "zh_CN" }), "fr-FR");
		assert.strictEqual(resolveLocaleFromEnv({ LC_ALL: "zh_CN.UTF-8", LANG: "en" }), "zh-CN");
		assert.strictEqual(resolveLocaleFromEnv({ LC_MESSAGES: "de_DE", LANG: "en" }), "de-DE");
		assert.strictEqual(resolveLocaleFromEnv({ LANG: "zh_CN.UTF-8" }), "zh-CN");
		assert.strictEqual(resolveLocaleFromEnv({ LANG: "C" }), "en");
		assert.strictEqual(resolveLocaleFromEnv({}), "en");
	});

	it("tracks available locales and translation presence", () => {
		registerTranslations("zh-CN", zhCNTranslations);
		assert.ok(getAvailableLocales().includes("zh-CN"));
		assert.ok(hasTranslations("zh-CN"));
		assert.ok(hasTranslations("zh_CN.UTF-8"));
		assert.strictEqual(hasTranslations("zz-ZZ"), false);
		assert.strictEqual(getLocale(), "en");
	});
});
