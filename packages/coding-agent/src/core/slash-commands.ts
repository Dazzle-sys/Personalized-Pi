import { t } from "@earendil-works/pi-tui";
import { APP_NAME } from "../config.ts";
import type { SourceInfo } from "./source-info.ts";

export type SlashCommandSource = "extension" | "prompt" | "skill";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	sourceInfo: SourceInfo;
}

export interface BuiltinSlashCommand {
	name: string;
	description: string;
	argumentHint?: string;
	category?: string;
}

// Descriptions resolve lazily via getters so t() runs at read time with the
// active locale instead of once at module load.
export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{
		name: "settings",
		get description() {
			return t("Open settings menu");
		},
		get category() {
			return t("信息");
		},
	},
	{
		name: "model",
		get description() {
			return t("Select model (opens selector UI)");
		},
		get category() {
			return t("模型");
		},
		argumentHint: "<provider/model>",
	},
	{
		name: "tree",
		get description() {
			return t("Navigate session tree (switch branches)");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "thinking",
		get description() {
			return t("Set thinking level");
		},
		get category() {
			return t("模型");
		},
		argumentHint: "<level>",
	},
	{
		name: "scoped-models",
		get description() {
			return t("Enable/disable models for Ctrl+P cycling");
		},
		get category() {
			return t("模型");
		},
	},
	{
		name: "export",
		get description() {
			return t("Export session (HTML default, or specify path: .html/.jsonl)");
		},
		get category() {
			return t("传输");
		},
	},
	{
		name: "import",
		get description() {
			return t("Import and resume a session from a JSONL file");
		},
		get category() {
			return t("传输");
		},
	},
	{
		name: "share",
		get description() {
			return t("Share session as a secret GitHub gist");
		},
		get category() {
			return t("传输");
		},
	},
	{
		name: "copy",
		get description() {
			return t("Copy last agent message to clipboard");
		},
		get category() {
			return t("传输");
		},
	},
	{
		name: "name",
		get description() {
			return t("Set session display name");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "session",
		get description() {
			return t("Show session info and stats");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "changelog",
		get description() {
			return t("Show changelog entries");
		},
		get category() {
			return t("信息");
		},
	},
	{
		name: "hotkeys",
		get description() {
			return t("Show all keyboard shortcuts");
		},
		get category() {
			return t("信息");
		},
	},
	{
		name: "fork",
		get description() {
			return t("Create a new fork from a previous user message");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "clone",
		get description() {
			return t("Duplicate the current session at the current position");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "trust",
		get description() {
			return t("Save project trust decision for future sessions");
		},
		get category() {
			return t("账号");
		},
	},
	{
		name: "login",
		get description() {
			return t("Configure provider authentication");
		},
		get category() {
			return t("账号");
		},
		argumentHint: "<provider>",
	},
	{
		name: "provider",
		get description() {
			return t("Add a custom provider interactively (writes models.json)");
		},
		get category() {
			return t("账号");
		},
	},
	{
		name: "logout",
		get description() {
			return t("Remove provider authentication");
		},
		get category() {
			return t("账号");
		},
	},
	{
		name: "new",
		get description() {
			return t("Start a new session");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "compact",
		get description() {
			return t("Manually compact the session context");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "resume",
		get description() {
			return t("Resume a different session");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "reload",
		get description() {
			return t("Reload keybindings, extensions, skills, prompts, themes, and context files");
		},
		get category() {
			return t("其他");
		},
	},
	{
		name: "revert",
		get description() {
			return t("Revert workspace to session start (aliases: /rollback, /回退)");
		},
		get category() {
			return t("会话");
		},
	},
	{
		name: "quit",
		get description() {
			return t("Quit {app}", { app: APP_NAME });
		},
		get category() {
			return t("其他");
		},
	},
];
