import {
	registerTranslations,
	resolveLocaleFromEnv,
	setLocale,
	type Translations,
	zhCNTranslations,
} from "@earendil-works/pi-tui";

export { setLocale };

import { zhCN as zhCNCli } from "./locales/zh-CN/cli.ts";
import { zhCN as zhCNComponentsA } from "./locales/zh-CN/components-a.ts";
import { zhCN as zhCNComponentsB } from "./locales/zh-CN/components-b.ts";
import { zhCN as zhCNCore } from "./locales/zh-CN/core.ts";
import { zhCN as zhCNInteractive } from "./locales/zh-CN/interactive.ts";

const zhCN: Translations = {
	...zhCNTranslations,
	...zhCNComponentsA,
	...zhCNComponentsB,
	...zhCNInteractive,
	...zhCNCli,
	...zhCNCore,
};

registerTranslations("zh-CN", zhCN);

/**
 * Apply the UI locale. An explicit non-"auto" language setting wins over the
 * environment (PI_LOCALE, LC_ALL, LC_MESSAGES, LANG); otherwise fall back to
 * the environment and finally English.
 */
export function applyLocaleSetting(language?: string): void {
	const resolved = language && language !== "auto" ? language : resolveLocaleFromEnv();
	setLocale(resolved);
	// Extensions load via jiti into a separate module cache, so their pi-tui
	// instance can't see the app's resolved locale through module state. Broadcast
	// it to PI_LOCALE so extension code using resolveLocaleFromEnv() follows the
	// effective UI locale (settings override/env), not just the raw environment.
	process.env.PI_LOCALE = resolved;
}
