import type { Tagged } from "type-fest";

import type {
	GoogleDriveDatabaseConnectionId,
	SlackChannelId,
	SlackChannelWithName,
	SlackConnectionId,
} from "#/types/databases";
import type { FileId, ISODateString } from "#/types/general";
import type { BetterbrainUser } from "#/types/notebook";

export type BotSourceId = Tagged<number, "BotSourceId">;

export type BotSource =
	// | NotionBotSource
	| SlackBotSource
	| PDFBotSource
	| CSVBotSource
	| WebBotSource
	| GoogleDriveBotSource; // | GeneralBotSource;

export type BaseBotSource = {
	last_modified_by: BetterbrainUser;
	created_by: BetterbrainUser;
	source_type: BotSourceType;
	created_at: ISODateString;
	updated_at: ISODateString;
	bots: { id: number }[];
	description: string;
	archived: boolean;
	id: BotSourceId;
	name: string;
};

export enum BotSourceType {
	GoogleDrive = "GOOGLE_DRIVE",
	Slack = "SLACK",
	PDF = "PDF",
	Web = "WEB",
	CSV = "CSV",
}

export type GoogleDriveBotSource = BaseBotSource & {
	google_drive_connection_id: GoogleDriveDatabaseConnectionId;
	google_drive_folder_ids: Array<FileId>;
	source_type: BotSourceType.GoogleDrive;
	direct_children_only: boolean;
};

export type SlackBotSource = BaseBotSource & {
	slack_channels: SlackChannelWithName[];
	slack_connection_id: SlackConnectionId;
	source_type: BotSourceType.Slack;
};

export type PDFBotSource = BaseBotSource & {
	source_type: BotSourceType.PDF;
	pdfs: PDF[];
};

export type PDFOrCSVSourceType =
	| PDFBotSource["source_type"]
	| CSVBotSource["source_type"];

export type PDF = {
	type: PDFOrCSVSourceType;
	file_size_bytes: number;
	presigned_url: string;
	description: string;
	file_name: string;
	indexed: boolean;
	summary: string;
	title: string;
	uuid: string;
	id: number;
};

export type CSVBotSource = BaseBotSource & {
	source_type: BotSourceType.CSV;
	csvs: CSV[];
};

export type CSV = unknown;

export type WebBotSource = BaseBotSource & {
	source_type: BotSourceType.Web;
	web_crawls: WebCrawl[];
	websites?: Website[];
};

export type WebCrawlId = Tagged<number, "WebCrawlId">;
export type CrawlId = Tagged<string, "CrawlId">;

export type WebCrawl = {
	creation_source: WebCrawlCreationSource;
	last_crawl_status_change: ISODateString;
	dynamic_content_wait_seconds: number;
	expand_clickable_elements: string;
	created_by: BetterbrainUser;
	include_url_globs: string[];
	exclude_url_globs: string[];
	initial_concurrency: number;
	aggressive_prune: boolean;
	crawl_status: CrawlStatus;
	created_at: ISODateString;
	updated_at: ISODateString;
	max_concurrency: number;
	max_crawl_depth: number;
	use_sitemaps: boolean;
	start_urls: string[];
	websites: Website[];
	max_results: number;
	description: string;
	max_pages: number;
	archived: boolean;
	crawl_id: CrawlId;
	id: WebCrawlId;
	name: string;
};

export type Website = {
	last_index_status_change: ISODateString | null;
	index_status: GeneralStatus;
	language_code: string;
	is_private: boolean;
	description: string;
	website_url: string;
	author: string;
	title: string;
	id: number;
};

export enum WebCrawlCreationSource {
	Backend = "BACKEND",
	Agent = "AGENT",
	User = "USER",
}

export enum CrawlStatus {
	Not_Started = "NOT_STARTED",
	In_Progress = "IN_PROGRESS",
	Timed_Out = "TIMED_OUT",
	Complete = "COMPLETE",
	Aborted = "ABORTED",
	Failed = "FAILED",
}

export enum GeneralStatus {
	Not_Started = "NOT_STARTED",
	In_Progress = "IN_PROGRESS",
	Timed_Out = "TIMED_OUT",
	Complete = "COMPLETE",
	Aborted = "ABORTED",
	Failed = "FAILED",
}

export type BotCommunicationConfig = {
	communication_type: BotCommunicationType;
	custom_type_info: BotCustomTypeInfo;
	bot_id: number;
	id: number;
};

export enum BotCommunicationType {
	Slack = "SLACK",
}

export enum ChannelConfigType {
	Selected = "SELECTED",
	All = "ALL",
}

type BotCustomTypeInfo = SlackCommunicationConfig;

export type SlackCommunicationConfig = {
	allowed_slack_channel_ids: { id: SlackChannelId; name: string }[];
	channel_config_type: ChannelConfigType;
	slack_connection_id: SlackConnectionId;
};

export enum BotType {
	QuestionsAndAnswers = "Q_AND_A",
}

export type BotId = Tagged<number, "BotId">;

export type Bot = {
	communication_configs: BotCommunicationConfig[];
	created_by: BetterbrainUser;
	updated_at: ISODateString;
	created_at: ISODateString;
	sources: BotSource[];
	description: string;
	archived: boolean;
	type: BotType;
	name: string;
	id: BotId;
};

export enum BotSourceFormAction {
	Create = "Create",
	Edit = "Edit",
}
