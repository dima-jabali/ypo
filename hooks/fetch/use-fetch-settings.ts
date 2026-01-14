import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
	generalContextStore,
	type GeneralContextData,
} from "#/contexts/general-ctx/general-context";
import { selectNothing } from "#/helpers/utils";
import { ColorScheme } from "#/types/general";
import { camelCase } from "scule";
import type { CamelCase } from "type-fest";
import { queryKeyFactory } from "../query-keys";

export type SettingsBase = {
	/** Only present on user_settings and project_settings */
	inheritance_type?: InheritanceType;
	details: {
		default:
			| string
			| number
			| boolean
			| Array<unknown>
			| Record<string, unknown>;
		show_as_project_setting?: boolean;
		show_as_user_setting?: boolean;
		allowed_values?: Array<string>;
		readable_name: string;
		description: string;
		type: DetailsType;
	};
} & SpecificSetting;

enum DefaultProduct {
	BETTERBRAIN_NOTEBOOK = "BETTERBRAIN_NOTEBOOK",
	SAPIEN_TABLE_AGENTS = "SAPIEN_TABLE_AGENTS",
	BANK_RECONCILIATION = "BANK_RECONCILIATION",
}

type SpecificSetting =
	| {
			value: Omit<unknown, "inheritance_type">;
			key: SettingsKey.TOOL_SETTINGS;
	  }
	| {
			key: SettingsKey.DEFAULT_PRODUCT;
			value: DefaultProduct;
	  }
	| {
			key: SettingsKey;
			value:
				| string
				| number
				| boolean
				| Array<unknown>
				| Record<string, unknown>
				| undefined;
	  };

export enum SettingsKey {
	SHOW_CREATE_NEW_ORGANIZATION_TO_ADMINS_IN_IFRAME = "SHOW_CREATE_NEW_ORGANIZATION_TO_ADMINS_IN_IFRAME",
	SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_IFRAME = "SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_IFRAME",
	SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_BB = "SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_BB",
	REQUIRE_APPROVAL_FOR_CONVERSATION_PLANS = "REQUIRE_APPROVAL_FOR_CONVERSATION_PLANS",
	SHOW_MANAGE_USERS_TO_ADMINS_IN_IFRAME = "SHOW_MANAGE_USERS_TO_ADMINS_IN_IFRAME",
	REPLACE_REFERENCE_NUMBERS_WITH_ICONS = "REPLACE_REFERENCE_NUMBERS_WITH_ICONS",
	SHOW_MANAGE_USERS_TO_USERS_IN_IFRAME = "SHOW_MANAGE_USERS_TO_USERS_IN_IFRAME",
	SHOW_MANAGE_USERS_TO_USERS_IN_BB = "SHOW_MANAGE_USERS_TO_USERS_IN_BB",
	ALLOW_EDITING_CODE_IN_CHAT_MODE = "ALLOW_EDITING_CODE_IN_CHAT_MODE",
	ORGANIZATION_SELECTOR_PLACEMENT = "ORGANIZATION_SELECTOR_PLACEMENT",
	SHOW_EDIT_PROJECT_DESCRIPTION = "SHOW_EDIT_PROJECT_DESCRIPTION",
	TOGGLE_HIDE_PARALLEL_ANSWERS = "TOGGLE_HIDE_PARALLEL_ANSWERS",
	SHOW_EDIT_PROJECT_ASSIGN_TO = "SHOW_EDIT_PROJECT_ASSIGN_TO",
	SHOW_EDIT_PROJECT_PRIORITY = "SHOW_EDIT_PROJECT_PRIORITY",
	SHOW_INTERMEDIATE_MESSAGES = "SHOW_INTERMEDIATE_MESSAGES",
	ONLY_SHOW_USED_REFERENCES = "ONLY_SHOW_USED_REFERENCES",
	DEFAULT_CONVERSATION_VIEW = "DEFAULT_CONVERSATION_VIEW",
	SHOW_EDIT_PROJECT_STATUS = "SHOW_EDIT_PROJECT_STATUS",
	SHOW_REFERENCE_METADATA = "SHOW_REFERENCE_METADATA",
	CLICKUP_SOURCE_ICON_URL = "CLICKUP_SOURCE_ICON_URL",
	SHOW_EDIT_PROJECT_TAGS = "SHOW_EDIT_PROJECT_TAGS",
	SHOW_CODE_IN_CHAT_MODE = "SHOW_CODE_IN_CHAT_MODE",
	AUTO_RUN_NEEDED_BLOCKS = "AUTO_RUN_NEEDED_BLOCKS",
	SHOW_IN_LINE_CITATIONS = "SHOW_IN_LINE_CITATIONS",
	SHOW_INTERNAL_SOURCES = "SHOW_INTERNAL_SOURCES",
	DEFAULT_COLOR_SCHEME = "DEFAULT_COLOR_SCHEME",
	SHOW_SOURCES_SIDEBAR = "SHOW_SOURCES_SIDEBAR",
	PRESS_ENTER_TO_SEND = "PRESS_ENTER_TO_SEND",
	SHOW_THUMBS_UP_DOWN = "SHOW_THUMBS_UP_DOWN",
	CHAT_BOT_AGENT_NAME = "CHAT_BOT_AGENT_NAME",
	TOOL_SELECTION_TYPE = "TOOL_SELECTION_TYPE",
	DEFAULT_PRODUCT = "DEFAULT_PRODUCT",
	TOOL_SETTINGS = "TOOL_SETTINGS",
}

export enum InheritanceType {
	DEFAULT = "DEFAULT",
	CUSTOM = "CUSTOM",
}

export enum DetailsType {
	BOOLEAN = "BOOLEAN",
	INTEGER = "INTEGER",
	STRING = "STRING",
	FLOAT = "FLOAT",
	ENUM = "ENUM",
	JSON = "JSON",
}

export enum SettingsEntity {
	ORGANIZATION = "ORGANIZATION",
	PROJECT = "PROJECT",
	USER = "USER",
}

export type SettingsReturnType = {
	organization_settings: SettingsBase[];
	/** Only present when project_id is specified as a URL parameter */
	project_settings?: SettingsBase[];
	user_settings: SettingsBase[];
};

const BOOLEAN_SETTINGS_TO_BE_SET = [
	SettingsKey.SHOW_CREATE_NEW_ORGANIZATION_TO_ADMINS_IN_IFRAME,
	SettingsKey.SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_IFRAME,
	SettingsKey.SHOW_CREATE_NEW_ORGANIZATION_TO_USERS_IN_BB,
	SettingsKey.SHOW_MANAGE_USERS_TO_ADMINS_IN_IFRAME,
	SettingsKey.REPLACE_REFERENCE_NUMBERS_WITH_ICONS,
	SettingsKey.SHOW_MANAGE_USERS_TO_USERS_IN_IFRAME,
	SettingsKey.SHOW_MANAGE_USERS_TO_USERS_IN_BB,
	SettingsKey.ALLOW_EDITING_CODE_IN_CHAT_MODE,
	SettingsKey.SHOW_EDIT_PROJECT_DESCRIPTION,
	SettingsKey.TOGGLE_HIDE_PARALLEL_ANSWERS,
	SettingsKey.SHOW_EDIT_PROJECT_ASSIGN_TO,
	SettingsKey.SHOW_EDIT_PROJECT_PRIORITY,
	SettingsKey.SHOW_INTERMEDIATE_MESSAGES,
	SettingsKey.ONLY_SHOW_USED_REFERENCES,
	SettingsKey.SHOW_EDIT_PROJECT_STATUS,
	SettingsKey.SHOW_REFERENCE_METADATA,
	SettingsKey.SHOW_EDIT_PROJECT_TAGS,
	SettingsKey.SHOW_CODE_IN_CHAT_MODE,
	SettingsKey.SHOW_IN_LINE_CITATIONS,
	SettingsKey.SHOW_INTERNAL_SOURCES,
	SettingsKey.SHOW_SOURCES_SIDEBAR,
	SettingsKey.SHOW_THUMBS_UP_DOWN,
	SettingsKey.PRESS_ENTER_TO_SEND,
] as const;
type BooleanSettingsToBeSet = (typeof BOOLEAN_SETTINGS_TO_BE_SET)[number];
type BooleanKeys = CamelCase<BooleanSettingsToBeSet>;

const STRING_SETTINGS_TO_BE_SET = [
	SettingsKey.ORGANIZATION_SELECTOR_PLACEMENT,
	SettingsKey.CLICKUP_SOURCE_ICON_URL,
	SettingsKey.CHAT_BOT_AGENT_NAME,
	SettingsKey.TOOL_SELECTION_TYPE,
] as const;
type StringSettingsToBeSet = (typeof STRING_SETTINGS_TO_BE_SET)[number];
type StringKeys = CamelCase<StringSettingsToBeSet>;

export function useFetchSettings<SelectedData = SettingsReturnType>(
	selectFromParams?: (data: SettingsReturnType) => SelectedData,
) {
	const organizationId = generalContextStore.use.organizationId();
	const notebookId = generalContextStore.use.notebookId();

	const queryOptions = useMemo(
		() =>
			queryKeyFactory.get["settings"](organizationId, notebookId ?? undefined),
		[notebookId, organizationId],
	);

	const select = useCallback(
		(settings: SettingsReturnType) => {
			{
				if (selectFromParams) {
					return selectFromParams(settings);
				}

				// Every time this function is called, we want to update the
				// shouldShowInternalSources and shouldShowCodeInChatMode
				// values in the generalContext store.

				const settingsForGeneralContext: Partial<GeneralContextData> = {
					allowEditingCodeInChatMode: false,
					showEditProjectDescription: false,
					toggleHideParallelAnswers: false,
					showIntermediateMessages: false,
					showEditProjectAssignTo: false,
					showEditProjectPriority: false,
					showEditProjectStatus: false,
					showInLineCitations: false,
					showEditProjectTags: false,
					showInternalSources: false,
					showCodeInChatMode: false,
					showSourcesSidebar: false,
					showThumbsUpDown: false,
					pressEnterToSend: false,
				};

				function setGeneralSetting(setting: SettingsBase) {
					if (setting.key === SettingsKey.DEFAULT_COLOR_SCHEME) {
						settingsForGeneralContext.colorScheme = (
							setting.value as string
						).toLowerCase() as keyof typeof ColorScheme;

						return;
					}

					// Boolean settings:
					if (
						BOOLEAN_SETTINGS_TO_BE_SET.includes(
							setting.key as BooleanSettingsToBeSet,
						)
					) {
						const key = camelCase(
							setting.key.toLowerCase() as BooleanSettingsToBeSet,
						) as BooleanKeys;

						// console.log({ key, originalKey: setting.key, value: setting.value });

						settingsForGeneralContext[key] = setting.value as boolean;
					} else if (
						STRING_SETTINGS_TO_BE_SET.includes(
							setting.key as StringSettingsToBeSet,
						)
					) {
						const key = camelCase(
							setting.key.toLowerCase() as StringSettingsToBeSet,
						) as StringKeys;

						// In order to to be able to use both `string | OrganizationSelectorPlacement`
						// we have to cast to any:
						// @ts-expect-error dont know why its failing
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						settingsForGeneralContext[key] = setting.value as any;
					}
				}

				// Order matters, as the last one wins
				// Organization -> User -> Project
				// So we start with organization, then user, then project
				// and overwrite the values as we go.
				settings.organization_settings.forEach(setGeneralSetting);
				settings.user_settings.forEach(setGeneralSetting);
				settings.project_settings?.forEach(setGeneralSetting);

				// console.log({ settingsForGeneralContext });

				generalContextStore.setState(settingsForGeneralContext);
			}

			return settings;
		},
		[selectFromParams],
	);

	return useSuspenseQuery({
		...queryOptions,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		gcTime: Infinity, // Maintain on cache
		select,
	}).data;
}

export function useJustFetchSettings() {
	return useFetchSettings(selectNothing);
}
