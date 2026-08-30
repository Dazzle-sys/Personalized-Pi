/**
 * Minimal runtime i18n for TUI strings.
 *
 * English source strings are the dictionary keys: `t("Copied!")` returns the
 * translated string for the active locale, or the source string itself when
 * the locale is English or the entry is missing. Parameters use `{name}`
 * placeholders and are interpolated into the resolved text.
 */

export type Translations = Record<string, string>;

/** Placeholder values; `undefined` leaves the placeholder untouched. */
export type TranslationParams = Record<string, string | number | undefined>;

const locales = new Map<string, Translations>();

let currentLocale = "en";

export function t(template: string, params?: TranslationParams): string {
	let text = locales.get(currentLocale)?.[template] ?? template;
	if (params) {
		text = interpolate(text, params);
	}
	return text;
}

function interpolate(template: string, params: TranslationParams): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => {
		const value = params[key];
		return value === undefined ? match : String(value);
	});
}

export function getLocale(): string {
	return currentLocale;
}

export function setLocale(locale: string): void {
	currentLocale = normalizeLocaleTag(locale) || "en";
}

/** Merge translations for a locale. Later registrations override earlier keys. */
export function registerTranslations(locale: string, translations: Translations): void {
	const tag = normalizeLocaleTag(locale);
	if (!tag) {
		return;
	}
	const existing = locales.get(tag);
	locales.set(tag, existing ? { ...existing, ...translations } : { ...translations });
}

export function getAvailableLocales(): string[] {
	return [...locales.keys()].sort();
}

export function hasTranslations(locale: string): boolean {
	return locales.has(normalizeLocaleTag(locale));
}

/** Normalize a locale tag such as "zh_CN.UTF-8" to "zh-CN". Returns "" if invalid. */
export function normalizeLocaleTag(tag: string): string {
	const trimmed = tag
		.trim()
		.replace(/\.utf-?8$/i, "")
		.replace(/_/g, "-");
	if (!trimmed) {
		return "";
	}
	const [language, region] = trimmed.split("-", 2);
	if (!language || !/^[a-z]{2,8}$/i.test(language)) {
		return "";
	}
	const normalized = language.toLowerCase();
	if (region && /^[a-z0-9]{1,8}$/i.test(region)) {
		return `${normalized}-${region.toUpperCase()}`;
	}
	return normalized;
}

/** Resolve the locale from PI_LOCALE, then LC_ALL, LC_MESSAGES, and LANG. Defaults to "en". */
export function resolveLocaleFromEnv(env: NodeJS.ProcessEnv = process.env): string {
	const candidates = [env.PI_LOCALE, env.LC_ALL, env.LC_MESSAGES, env.LANG];
	for (const candidate of candidates) {
		if (!candidate) {
			continue;
		}
		const tag = normalizeLocaleTag(candidate);
		if (tag) {
			return tag;
		}
	}
	return "en";
}
