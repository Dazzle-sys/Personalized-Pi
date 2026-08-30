import { join } from "node:path";
import { t } from "@earendil-works/pi-tui";
import { getDocsPath } from "../config.ts";

const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	return [
		t("Use /login to log into a provider via OAuth or API key. See:"),
		`  ${join(getDocsPath(), "providers.md")}`,
		`  ${join(getDocsPath(), "models.md")}`,
	].join("\n");
}

export function formatNoModelsAvailableMessage(): string {
	return t("No models available. {help}", { help: getProviderLoginHelp() });
}

export function formatNoModelSelectedMessage(): string {
	return t("No model selected.\n\n{help}\n\nThen use /model to select a model.", { help: getProviderLoginHelp() });
}

export function formatNoApiKeyFoundMessage(provider: string): string {
	const providerDisplay = provider === UNKNOWN_PROVIDER ? t("the selected model") : provider;
	return t("No API key found for {provider}.\n\n{help}", { provider: providerDisplay, help: getProviderLoginHelp() });
}
