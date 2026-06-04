import { APP_NAME } from "../config.ts";
import { t } from "../i18n/i18n.ts";
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
}

export function getBuiltinSlashCommands(): ReadonlyArray<BuiltinSlashCommand> {
	return [
		{ name: "settings", description: t("slash.settings") },
		{ name: "model", description: t("slash.model") },
		{ name: "scoped-models", description: t("slash.scoped-models") },
		{ name: "export", description: t("slash.export") },
		{ name: "import", description: t("slash.import") },
		{ name: "share", description: t("slash.share") },
		{ name: "copy", description: t("slash.copy") },
		{ name: "name", description: t("slash.name") },
		{ name: "session", description: t("slash.session") },
		{ name: "changelog", description: t("slash.changelog") },
		{ name: "hotkeys", description: t("slash.hotkeys") },
		{ name: "fork", description: t("slash.fork") },
		{ name: "clone", description: t("slash.clone") },
		{ name: "tree", description: t("slash.tree") },
		{ name: "login", description: t("slash.login") },
		{ name: "logout", description: t("slash.logout") },
		{ name: "new", description: t("slash.new") },
		{ name: "compact", description: t("slash.compact") },
		{ name: "resume", description: t("slash.resume") },
		{ name: "reload", description: t("slash.reload") },
		{ name: "quit", description: t("slash.quit", { app: APP_NAME }) },
	];
}
