/**
 * CLI argument parsing and help display
 */

import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { t } from "@earendil-works/pi-tui";
import chalk from "chalk";
import { APP_NAME, CONFIG_DIR_NAME, ENV_AGENT_DIR, ENV_SESSION_DIR } from "../config.ts";
import type { ExtensionFlag } from "../core/extensions/types.ts";
import type { TuiMode } from "../core/settings-manager.ts";

export type Mode = "text" | "json" | "rpc";

export interface Args {
	provider?: string;
	model?: string;
	apiKey?: string;
	systemPrompt?: string;
	appendSystemPrompt?: string[];
	thinking?: ThinkingLevel;
	continue?: boolean;
	resume?: boolean;
	help?: boolean;
	version?: boolean;
	mode?: Mode;
	name?: string;
	noSession?: boolean;
	session?: string;
	sessionId?: string;
	fork?: string;
	sessionDir?: string;
	models?: string[];
	tools?: string[];
	excludeTools?: string[];
	noTools?: boolean;
	noBuiltinTools?: boolean;
	extensions?: string[];
	noExtensions?: boolean;
	print?: boolean;
	export?: string;
	noSkills?: boolean;
	skills?: string[];
	promptTemplates?: string[];
	noPromptTemplates?: boolean;
	themes?: string[];
	useTheme?: string;
	noThemes?: boolean;
	noContextFiles?: boolean;
	listModels?: string | true;
	offline?: boolean;
	tuiMode?: TuiMode;
	verbose?: boolean;
	projectTrustOverride?: boolean;
	messages: string[];
	fileArgs: string[];
	/** Unknown flags (potentially extension flags) - map of flag name to value */
	unknownFlags: Map<string, boolean | string>;
	diagnostics: Array<{ type: "warning" | "error"; message: string }>;
}

const VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export function isValidThinkingLevel(level: string): level is ThinkingLevel {
	return VALID_THINKING_LEVELS.includes(level as ThinkingLevel);
}

export function normalizeSessionName(value: string): string | undefined {
	const name = value.trim();
	return name.length > 0 ? name : undefined;
}

export function parseArgs(args: string[]): Args {
	const result: Args = {
		messages: [],
		fileArgs: [],
		unknownFlags: new Map(),
		diagnostics: [],
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--") {
			for (const positionalArg of args.slice(i + 1)) {
				if (positionalArg.startsWith("@")) {
					result.fileArgs.push(positionalArg.slice(1));
				} else {
					result.messages.push(positionalArg);
				}
			}
			break;
		} else if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else if (arg === "--version" || arg === "-v") {
			result.version = true;
		} else if (arg === "--mode" && i + 1 < args.length) {
			const mode = args[++i];
			if (mode === "text" || mode === "json" || mode === "rpc") {
				result.mode = mode;
			}
		} else if (arg === "--continue" || arg === "-c") {
			result.continue = true;
		} else if (arg === "--resume" || arg === "-r") {
			result.resume = true;
		} else if (arg === "--provider" && i + 1 < args.length) {
			result.provider = args[++i];
		} else if (arg === "--model" && i + 1 < args.length) {
			result.model = args[++i];
		} else if (arg === "--api-key" && i + 1 < args.length) {
			result.apiKey = args[++i];
		} else if (arg === "--system-prompt" && i + 1 < args.length) {
			result.systemPrompt = args[++i];
		} else if (arg === "--append-system-prompt" && i + 1 < args.length) {
			result.appendSystemPrompt = result.appendSystemPrompt ?? [];
			result.appendSystemPrompt.push(args[++i]);
		} else if (arg === "--name" || arg === "-n") {
			if (i + 1 < args.length) {
				result.name = args[++i];
			} else {
				result.diagnostics.push({ type: "error", message: t("--name requires a value") });
			}
		} else if (arg === "--no-session") {
			result.noSession = true;
		} else if (arg === "--session" && i + 1 < args.length) {
			result.session = args[++i];
		} else if (arg === "--session-id" && i + 1 < args.length) {
			result.sessionId = args[++i];
		} else if (arg === "--fork" && i + 1 < args.length) {
			result.fork = args[++i];
		} else if (arg === "--session-dir" && i + 1 < args.length) {
			result.sessionDir = args[++i];
		} else if (arg === "--models" && i + 1 < args.length) {
			result.models = args[++i].split(",").map((s) => s.trim());
		} else if (arg === "--no-tools" || arg === "-nt") {
			result.noTools = true;
		} else if (arg === "--no-builtin-tools" || arg === "-nbt") {
			result.noBuiltinTools = true;
		} else if ((arg === "--tools" || arg === "-t") && i + 1 < args.length) {
			result.tools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
		} else if ((arg === "--exclude-tools" || arg === "-xt") && i + 1 < args.length) {
			result.excludeTools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
		} else if (arg === "--thinking" && i + 1 < args.length) {
			const level = args[++i];
			if (isValidThinkingLevel(level)) {
				result.thinking = level;
			} else {
				result.diagnostics.push({
					type: "warning",
					message: t('Invalid thinking level "{level}". Valid values: {values}', {
						level,
						values: VALID_THINKING_LEVELS.join(", "),
					}),
				});
			}
		} else if (arg === "--print" || arg === "-p") {
			result.print = true;
			const next = args[i + 1];
			if (next !== undefined && !next.startsWith("@") && (!next.startsWith("-") || next.startsWith("---"))) {
				result.messages.push(next);
				i++;
			}
		} else if (arg === "--export" && i + 1 < args.length) {
			result.export = args[++i];
		} else if ((arg === "--extension" || arg === "-e") && i + 1 < args.length) {
			result.extensions = result.extensions ?? [];
			result.extensions.push(args[++i]);
		} else if (arg === "--no-extensions" || arg === "-ne") {
			result.noExtensions = true;
		} else if (arg === "--skill" && i + 1 < args.length) {
			result.skills = result.skills ?? [];
			result.skills.push(args[++i]);
		} else if (arg === "--prompt-template" && i + 1 < args.length) {
			result.promptTemplates = result.promptTemplates ?? [];
			result.promptTemplates.push(args[++i]);
		} else if (arg === "--theme" && i + 1 < args.length) {
			result.themes = result.themes ?? [];
			result.themes.push(args[++i]);
		} else if (arg === "--use-theme") {
			const themeName = args[i + 1];
			if (themeName === undefined || themeName.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: t("--use-theme requires a theme name") });
			} else {
				result.useTheme = themeName;
				i++;
			}
		} else if (arg === "--no-skills" || arg === "-ns") {
			result.noSkills = true;
		} else if (arg === "--no-prompt-templates" || arg === "-np") {
			result.noPromptTemplates = true;
		} else if (arg === "--no-themes") {
			result.noThemes = true;
		} else if (arg === "--no-context-files" || arg === "-nc") {
			result.noContextFiles = true;
		} else if (arg === "--list-models") {
			// Check if next arg is a search pattern (not a flag or file arg)
			if (i + 1 < args.length && !args[i + 1].startsWith("-") && !args[i + 1].startsWith("@")) {
				result.listModels = args[++i];
			} else {
				result.listModels = true;
			}
		} else if (arg === "--tui-mode") {
			const mode = args[i + 1];
			if (mode === "regular" || mode === "fullscreen") {
				result.tuiMode = mode;
				i++;
			} else if (mode === undefined || mode.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: t("--tui-mode requires regular or fullscreen") });
			} else {
				i++;
				result.diagnostics.push({
					type: "error",
					message: t('Invalid TUI mode "{mode}". Valid values: regular, fullscreen', { mode }),
				});
			}
		} else if (arg === "--verbose") {
			result.verbose = true;
		} else if (arg === "--approve" || arg === "-a") {
			result.projectTrustOverride = true;
		} else if (arg === "--no-approve" || arg === "-na") {
			result.projectTrustOverride = false;
		} else if (arg === "--offline") {
			result.offline = true;
		} else if (arg.startsWith("@")) {
			result.fileArgs.push(arg.slice(1)); // Remove @ prefix
		} else if (arg.startsWith("--")) {
			const eqIndex = arg.indexOf("=");
			if (eqIndex !== -1) {
				result.unknownFlags.set(arg.slice(2, eqIndex), arg.slice(eqIndex + 1));
			} else {
				const flagName = arg.slice(2);
				const next = args[i + 1];
				if (next !== undefined && !next.startsWith("-") && !next.startsWith("@")) {
					result.unknownFlags.set(flagName, next);
					i++;
				} else {
					result.unknownFlags.set(flagName, true);
				}
			}
		} else if (arg.startsWith("-") && !arg.startsWith("--")) {
			result.diagnostics.push({ type: "error", message: t("Unknown option: {option}", { option: arg }) });
		} else if (!arg.startsWith("-")) {
			result.messages.push(arg);
		}
	}

	return result;
}

export function printHelp(extensionFlags?: ExtensionFlag[]): void {
	const extensionFlagsText =
		extensionFlags && extensionFlags.length > 0
			? `\n${chalk.bold(t("Extension CLI Flags:"))}\n${extensionFlags
					.map((flag) => {
						const value = flag.type === "string" ? " <value>" : "";
						const description = flag.description ?? t("Registered by {path}", { path: flag.extensionPath });
						return `  --${flag.name}${value}`.padEnd(30) + description;
					})
					.join("\n")}\n`
			: "";
	const appendSystemPromptHelp = t("Append text or file contents to the system prompt (can be used multiple times)");
	const azureBaseUrlHelp = t("Azure OpenAI/Cognitive Services base URL (e.g. https://{resource}.openai.azure.com)");
	console.log(`${chalk.bold(APP_NAME)} - ${t("AI coding assistant with read, bash, edit, write tools")}

${chalk.bold(t("Usage:"))}
  ${APP_NAME} [options] [--] [@files...] [messages...]

${chalk.bold(t("Commands:"))}
  ${APP_NAME} install <source> [-l]     ${t("Install extension source and add to settings")}
  ${APP_NAME} remove <source> [-l]      ${t("Remove extension source from settings")}
  ${APP_NAME} uninstall <source> [-l]   ${t("Alias for remove")}
  ${APP_NAME} update [source|self|pi]   ${t("Update pi, extensions, or model catalogs")}
  ${APP_NAME} list                      ${t("List installed extensions from settings")}
  ${APP_NAME} config [-l]               ${t("Open TUI to enable/disable package resources (Tab switches scope)")}
  ${APP_NAME} auth <command>            ${t("Print credentials or check provider readiness")}
  ${APP_NAME} <command> --help          ${t("Show help for install/remove/uninstall/update/list/config/auth")}

${chalk.bold(t("Options:"))}
  --provider <name>              ${t("Provider name (default: google)")}
  --model <pattern>              ${t('Model pattern or ID (supports "provider/id" and optional ":<thinking>")')}
  --api-key <key>                ${t("API key (defaults to env vars)")}
  --system-prompt <text>         ${t("System prompt (default: coding assistant prompt)")}
  --append-system-prompt <text>  ${appendSystemPromptHelp}
  --mode <mode>                  ${t("Output mode: text (default), json, or rpc")}
  --print, -p                    ${t("Non-interactive mode: process prompt and exit")}
  --continue, -c                 ${t("Continue previous session")}
  --resume, -r                   ${t("Select a session to resume")}
  --session <path|id>            ${t("Use specific session file or partial UUID")}
  --session-id <id>              ${t("Use exact project session ID, creating it if missing")}
  --fork <path|id>               ${t("Fork specific session file or partial UUID into a new session")}
  --session-dir <dir>            ${t("Directory for session storage and lookup")}
  --no-session                   ${t("Don't save session (ephemeral)")}
  --name, -n <name>              ${t("Set session display name")}
  --models <patterns>            ${t("Comma-separated model patterns for Ctrl+P cycling")}
                                 ${t("Supports globs (anthropic/*, *sonnet*) and fuzzy matching")}
  --no-tools, -nt                ${t("Disable all tools by default (built-in and extension)")}
  --no-builtin-tools, -nbt       ${t("Disable built-in tools by default but keep extension/custom tools enabled")}
  --tools, -t <tools>            ${t("Comma-separated allowlist of tool names to enable")}
                                 ${t("Applies to built-in, extension, and custom tools")}
  --exclude-tools, -xt <tools>   ${t("Comma-separated denylist of tool names to disable")}
                                 ${t("Applies to built-in, extension, and custom tools")}
  --thinking <level>             ${t("Set thinking level: off, minimal, low, medium, high, xhigh, max")}
  --extension, -e <path>         ${t("Load an extension file (can be used multiple times)")}
  --no-extensions, -ne           ${t("Disable extension discovery (explicit -e paths still work)")}
  --skill <path>                 ${t("Load a skill file or directory (can be used multiple times)")}
  --no-skills, -ns               ${t("Disable skills discovery and loading")}
  --prompt-template <path>       ${t("Load a prompt template file or directory (can be used multiple times)")}
  --no-prompt-templates, -np     ${t("Disable prompt template discovery and loading")}
  --theme <path>                 ${t("Load a theme file or directory (can be used multiple times)")}
  --use-theme <name[/name]>      ${t("Set the initial interactive theme for this run")}
  --no-themes                    ${t("Disable theme discovery and loading")}
  --no-context-files, -nc        ${t("Disable AGENTS.md and CLAUDE.md discovery and loading")}
  --export <file>                ${t("Export session file to HTML and exit")}
  --list-models [search]         ${t("List available models (with optional fuzzy search)")}
  --verbose                      ${t("Force verbose startup (overrides quietStartup setting)")}
  --tui-mode <mode>              ${t("TUI mode: fullscreen (default) or regular")}
  --approve, -a                  ${t("Trust project-local files for this run")}
  --no-approve, -na              ${t("Ignore project-local files for this run")}
  --offline                      ${t("Disable startup network operations (same as PI_OFFLINE=1)")}
  --                             ${t("End option parsing; treat remaining arguments as messages/files")}
  --help, -h                     ${t("Show this help")}
  --version, -v                  ${t("Show version number")}

${t("Extensions can register additional flags (e.g., --plan from plan-mode extension).")}${extensionFlagsText}

${chalk.bold(t("Examples:"))}
  # ${t("Print a provider API key for an external client")}
  ${APP_NAME} auth print-api-key --provider openai

  # ${t("Print an OAuth bearer token for an external client (refreshes if expired)")}
  ${APP_NAME} auth print-bearer-token --provider openai-codex

  # ${t("Interactive mode")}
  ${APP_NAME}

  # ${t("Interactive mode with initial prompt")}
  ${APP_NAME} "List all .ts files in src/"

  # ${t("Include files in initial message")}
  ${APP_NAME} @prompt.md @image.png "What color is the sky?"

  # ${t("Non-interactive mode (process and exit)")}
  ${APP_NAME} -p "List all .ts files in src/"

  # ${t("Prompt beginning with a dash")}
  ${APP_NAME} -p -- "- Summarize these points"

  # ${t("Multiple messages (interactive)")}
  ${APP_NAME} "Read package.json" "What dependencies do we have?"

  # ${t("Continue previous session")}
  ${APP_NAME} --continue "What did we discuss?"

  # ${t("Start a named session")}
  ${APP_NAME} --name "Refactor auth module"

  # ${t("Use different model")}
  ${APP_NAME} --provider openai --model gpt-4o-mini "Help me refactor this code"

  # ${t("Use model with provider prefix (no --provider needed)")}
  ${APP_NAME} --model openai/gpt-4o "Help me refactor this code"

  # ${t("Use model with thinking level shorthand")}
  ${APP_NAME} --model sonnet:high "Solve this complex problem"

  # ${t("Limit model cycling to specific models")}
  ${APP_NAME} --models claude-sonnet,claude-haiku,gpt-4o

  # ${t("Limit to a specific provider with glob pattern")}
  ${APP_NAME} --models "github-copilot/*"

  # ${t("Cycle models with fixed thinking levels")}
  ${APP_NAME} --models sonnet:high,haiku:low

  # ${t("Start with a specific thinking level")}
  ${APP_NAME} --thinking high "Solve this complex problem"

  # ${t("Read-only mode (no file modifications possible)")}
  ${APP_NAME} --tools read,grep,find,ls -p "Review the code in src/"

  # ${t("Disable one tool while keeping the rest available")}
  ${APP_NAME} --exclude-tools ask_question

  # ${t("Export a session file to HTML")}
  ${APP_NAME} --export ~/${CONFIG_DIR_NAME}/agent/sessions/--path--/session.jsonl
  ${APP_NAME} --export session.jsonl output.html

${chalk.bold(t("Environment Variables:"))}
  ANTHROPIC_AUTH_TOKEN             - ${t("Anthropic bearer auth token")}
  ANTHROPIC_API_KEY                - ${t("Anthropic Claude API key")}
  ANTHROPIC_OAUTH_TOKEN            - ${t("Anthropic OAuth token (alternative to API key)")}
  ANT_LING_API_KEY                 - ${t("Ant Ling API key")}
  OPENAI_API_KEY                   - ${t("OpenAI GPT API key")}
  AZURE_OPENAI_API_KEY             - ${t("Azure OpenAI API key")}
  AZURE_OPENAI_BASE_URL            - ${azureBaseUrlHelp}
  AZURE_OPENAI_RESOURCE_NAME       - ${t("Azure OpenAI resource name (alternative to base URL)")}
  AZURE_OPENAI_API_VERSION         - ${t("Azure OpenAI API version (default: v1)")}
  AZURE_OPENAI_DEPLOYMENT_NAME_MAP - ${t("Azure OpenAI model=deployment map (comma-separated)")}
  BAI_API_KEY                      - ${t("B.AI API key")}
  DEEPSEEK_API_KEY                 - ${t("DeepSeek API key")}
  NVIDIA_API_KEY                   - ${t("NVIDIA NIM API key")}
  GEMINI_API_KEY                   - ${t("Google Gemini API key")}
  GROQ_API_KEY                     - ${t("Groq API key")}
  CEREBRAS_API_KEY                 - ${t("Cerebras API key")}
  COMMANDCODE_API_KEY              - ${t("Command Code API key")}
  XAI_API_KEY                      - ${t("xAI Grok API key")}
  FIREWORKS_API_KEY                - ${t("Fireworks API key")}
  TOGETHER_API_KEY                 - ${t("Together AI API key")}
  BASETEN_API_KEY                  - ${t("Baseten API key")}
  OPENROUTER_API_KEY               - ${t("OpenRouter API key")}
  AI_GATEWAY_API_KEY               - ${t("Vercel AI Gateway API key")}
  ZAI_API_KEY                      - ${t("ZAI Coding Plan API key (Global)")}
  ZAI_CODING_CN_API_KEY            - ${t("ZAI Coding Plan API key (China)")}
  MISTRAL_API_KEY                  - ${t("Mistral API key")}
  MINIMAX_API_KEY                  - ${t("MiniMax API key")}
  MOONSHOT_API_KEY                 - ${t("Moonshot AI API key")}
  OPENCODE_API_KEY                 - ${t("OpenCode Zen/OpenCode Go API key")}
  KIMI_API_KEY                     - ${t("Kimi For Coding API key")}
  CLOUDFLARE_API_KEY               - ${t("Cloudflare API token (Workers AI and AI Gateway)")}
  CLOUDFLARE_ACCOUNT_ID            - ${t("Cloudflare account id (required for both)")}
  CLOUDFLARE_GATEWAY_ID            - ${t("Cloudflare AI Gateway slug (required for AI Gateway)")}
  QWEN_TOKEN_PLAN_API_KEY          - ${t("Qwen Token Plan API key (international region)")}
  QWEN_TOKEN_PLAN_CN_API_KEY       - ${t("Qwen Token Plan API key (China region)")}
  XIAOMI_API_KEY                   - ${t("Xiaomi MiMo API key (api.xiaomimimo.com billing)")}
  XIAOMI_TOKEN_PLAN_CN_API_KEY     - ${t("Xiaomi MiMo Token Plan API key (China region)")}
  XIAOMI_TOKEN_PLAN_AMS_API_KEY    - ${t("Xiaomi MiMo Token Plan API key (Amsterdam region)")}
  XIAOMI_TOKEN_PLAN_SGP_API_KEY    - ${t("Xiaomi MiMo Token Plan API key (Singapore region)")}
  AWS_PROFILE                      - ${t("AWS profile for Amazon Bedrock")}
  AWS_ACCESS_KEY_ID                - ${t("AWS access key for Amazon Bedrock")}
  AWS_SECRET_ACCESS_KEY            - ${t("AWS secret key for Amazon Bedrock")}
  AWS_BEARER_TOKEN_BEDROCK         - ${t("Bedrock API key (bearer token)")}
  AWS_REGION                       - ${t("AWS region for Amazon Bedrock (e.g., us-east-1)")}
  ${ENV_AGENT_DIR.padEnd(32)} - ${t("Config directory (default: ~/{dir}/agent)", { dir: CONFIG_DIR_NAME })}
  ${ENV_SESSION_DIR.padEnd(32)} - ${t("Session storage directory (overridden by --session-dir)")}
  PI_PACKAGE_DIR                   - ${t("Override package directory (for Nix/Guix store paths)")}
  PI_OFFLINE                       - ${t("Disable startup network operations when set to 1/true/yes")}
  PI_TELEMETRY                     - ${t("Override install telemetry when set to 1/true/yes or 0/false/no")}
  PI_SHARE_VIEWER_URL              - ${t("Base URL for /share command (default: https://pi.dev/session/)")}

${chalk.bold(t("Built-in Tool Names:"))}
  read       - ${t("Read file contents")}
  bash       - ${t("Execute bash commands")}
  powershell - ${t("Execute PowerShell commands on Windows")}
  edit       - ${t("Edit files with find/replace")}
  write      - ${t("Write files (creates/overwrites)")}
  grep       - ${t("Search file contents (read-only, off by default)")}
  find       - ${t("Find files by glob pattern (read-only, off by default)")}
  ls         - ${t("List directory contents (read-only, off by default)")}
`);
}
