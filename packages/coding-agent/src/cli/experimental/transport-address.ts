import { posix } from "node:path";
import { t } from "@earendil-works/pi-tui";

export interface UnixTransportAddress {
	readonly transport: "unix";
	readonly path: string;
}

export type TransportAddress = UnixTransportAddress;

function invalidAddress(option: "--listen" | "--connect", value: string): string {
	return t('Invalid {option} address "{value}"', { option, value });
}

export function parseTransportAddress(
	value: string,
	option: "--listen" | "--connect",
): { address?: TransportAddress; error?: string } {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return { error: invalidAddress(option, value) };
	}
	if (url.protocol !== "unix:") {
		return { error: t('Unsupported {option} transport "{protocol}"', { option, protocol: url.protocol }) };
	}
	if (url.hostname || url.port || url.username || url.password) {
		return { error: t("Unix transport address must not include an authority") };
	}
	if (
		!value.startsWith("unix:///") ||
		value.startsWith("unix:////") ||
		value.includes("?") ||
		value.includes("#") ||
		url.href !== value
	) {
		return { error: invalidAddress(option, value) };
	}
	let path: string;
	try {
		path = decodeURIComponent(url.pathname);
	} catch {
		return { error: invalidAddress(option, value) };
	}
	if (path.includes("\0")) {
		return { error: invalidAddress(option, value) };
	}
	if (!posix.isAbsolute(path)) {
		return { error: t("Unix transport address requires an absolute path") };
	}
	return { address: { transport: "unix", path } };
}
