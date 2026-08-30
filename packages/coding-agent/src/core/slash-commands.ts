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
}

// Descriptions resolve lazily via getters so t() runs at read time with the
// active locale instead of once at module load.
export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{
		name: "settings",
		get description() {
			return t("Open settings menu");
		},
	},
	{
		name: "model",
		get description() {
			return t("Select model (opens selector UI)");
		},
		argumentHint: "<provider/model>",
	},
	{
		name: "tree",
		get description() {
			return t("Navigate session tree (switch branches)");
		},
	},
	{
		name: "thinking",
		get description() {
			return t("Set thinking level");
		},
		argumentHint: "<level>",
	},
	{
		name: "scoped-models",
		get description() {
			return t("Enable/disable models for Ctrl+P cycling");
		},
	},
	{
		name: "export",
		get description() {
			return t("Export session (HTML default, or specify path: .html/.jsonl)");
		},
	},
	{
		name: "import",
		get description() {
			return t("Import and resume a session from a JSONL file");
		},
	},
	{
		name: "share",
		get description() {
			return t("Share session as a secret GitHub gist");
		},
	},
	{
		name: "copy",
		get description() {
			return t("Copy last agent message to clipboard");
		},
	},
	{
		name: "name",
		get description() {
			return t("Set session display name");
		},
	},
	{
		name: "session",
		get description() {
			return t("Show session info and stats");
		},
	},
	{
		name: "changelog",
		get description() {
			return t("Show changelog entries");
		},
	},
	{
		name: "hotkeys",
		get description() {
			return t("Show all keyboard shortcuts");
		},
	},
	{
		name: "fork",
		get description() {
			return t("Create a new fork from a previous user message");
		},
	},
	{
		name: "clone",
		get description() {
			return t("Duplicate the current session at the current position");
		},
	},
	{
		name: "trust",
		get description() {
			return t("Save project trust decision for future sessions");
		},
	},
	{
		name: "login",
		get description() {
			return t("Configure provider authentication");
		},
		argumentHint: "<provider>",
	},
	{
		name: "logout",
		get description() {
			return t("Remove provider authentication");
		},
	},
	{
		name: "new",
		get description() {
			return t("Start a new session");
		},
	},
	{
		name: "compact",
		get description() {
			return t("Manually compact the session context");
		},
	},
	{
		name: "resume",
		get description() {
			return t("Resume a different session");
		},
	},
	{
		name: "reload",
		get description() {
			return t("Reload keybindings, extensions, skills, prompts, themes, and context files");
		},
	},
	{
		name: "quit",
		get description() {
			return t("Quit {app}", { app: APP_NAME });
		},
	},
];
