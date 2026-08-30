import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { zhCNTranslations } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { zhCN as zhCNCli } from "../src/i18n/locales/zh-CN/cli.ts";
import { zhCN as zhCNComponentsA } from "../src/i18n/locales/zh-CN/components-a.ts";
import { zhCN as zhCNComponentsB } from "../src/i18n/locales/zh-CN/components-b.ts";
import { zhCN as zhCNCore } from "../src/i18n/locales/zh-CN/core.ts";
import { zhCN as zhCNInteractive } from "../src/i18n/locales/zh-CN/interactive.ts";

// 运行时查找表：tui 基础词典 + coding-agent 五个词典合并
const dictionary: Record<string, string> = {
	...zhCNTranslations,
	...zhCNComponentsA,
	...zhCNComponentsB,
	...zhCNInteractive,
	...zhCNCli,
	...zhCNCore,
};

const SCAN_ROOTS = [join(import.meta.dirname, "../src"), join(import.meta.dirname, "../../tui/src")];

function walkTs(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "locales") out.push(...walkTs(p));
		} else if (entry.name.endsWith(".ts")) {
			out.push(p);
		}
	}
	return out;
}

function readStringLiteral(source: string, start: number): { value: string; end: number } | undefined {
	const quote = source[start];
	if (quote !== '"' && quote !== "'") return undefined;
	let out = "";
	let i = start + 1;
	while (i < source.length) {
		const c = source[i];
		if (c === "\\") {
			const n = source[i + 1] ?? "";
			if (n === "n") out += "\n";
			else if (n === "t") out += "\t";
			else if (n === "u" && /^[0-9a-fA-F]{4}$/.test(source.slice(i + 2, i + 6))) {
				out += String.fromCharCode(parseInt(source.slice(i + 2, i + 6), 16));
				i += 6;
				continue;
			} else out += n;
			i += 2;
			continue;
		}
		if (c === quote) return { value: out, end: i + 1 };
		out += c;
		i++;
	}
	return undefined;
}

function skipWs(source: string, i: number): number {
	while (i < source.length && /\s/.test(source[i])) i++;
	return i;
}

/** 读取 "a" + "b" 形式的字符串拼接；含非字面量拼接时返回 undefined（动态 key）。 */
function readConcatenatedLiteral(source: string, start: number): { value: string; end: number } | undefined {
	const first = readStringLiteral(source, start);
	if (!first) return undefined;
	let value = first.value;
	let end = first.end;
	for (;;) {
		const j = skipWs(source, end);
		if (source[j] !== "+") return { value, end };
		const next = readStringLiteral(source, skipWs(source, j + 1));
		if (!next) return undefined;
		value += next.value;
		end = next.end;
	}
}

/** 提取 t("...")、keyHint(name, "desc")、rawKeyHint(key, "desc") 中的字面翻译 key。 */
function extractLiteralKeys(source: string): Set<string> {
	const keys = new Set<string>();
	const callRe = /\b(t|keyHint|rawKeyHint)\s*\(/g;
	let m = callRe.exec(source);
	while (m !== null) {
		const fn = m[1];
		const first = readConcatenatedLiteral(source, skipWs(source, m.index + m[0].length));
		let key: string | undefined;
		if (first) {
			key = first.value;
			if (fn !== "t") {
				// keyHint/rawKeyHint 第一个参数是键位名；第二个参数（描述）才是翻译 key。
				// 描述不是字面量（模板字符串/三元表达式）时无法静态取值，直接跳过。
				const comma = skipWs(source, first.end);
				const second =
					source[comma] === "," ? readConcatenatedLiteral(source, skipWs(source, comma + 1)) : undefined;
				key = second?.value;
			}
			callRe.lastIndex = first.end;
		}
		if (key !== undefined) keys.add(key);
		m = callRe.exec(source);
	}
	return keys;
}

describe("i18n dictionary coverage", () => {
	it("every literal t() key has a zh-CN entry", () => {
		const missing: string[] = [];
		for (const root of SCAN_ROOTS) {
			for (const file of walkTs(root)) {
				for (const key of extractLiteralKeys(readFileSync(file, "utf8"))) {
					if (!(key in dictionary)) missing.push(`${file}: ${JSON.stringify(key)}`);
				}
			}
		}
		expect(missing).toEqual([]);
	});

	it("translations preserve every placeholder of their key", () => {
		const bad: string[] = [];
		for (const [key, value] of Object.entries(dictionary)) {
			const keyParams = new Set([...key.matchAll(/\{(\w+)\}/g)].map((x) => x[1]));
			const valueParams = new Set([...value.matchAll(/\{(\w+)\}/g)].map((x) => x[1]));
			for (const p of keyParams) if (!valueParams.has(p)) bad.push(`missing {${p}}: ${JSON.stringify(key)}`);
			for (const p of valueParams) if (!keyParams.has(p)) bad.push(`extra {${p}}: ${JSON.stringify(key)}`);
		}
		expect(bad).toEqual([]);
	});
});
