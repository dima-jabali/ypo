"use client";


import type { Updater } from "@tanstack/react-query";
import type { Tagged } from "type-fest";
import { create } from "zustand";
import {
	createJSONStorage,
	persist,
	subscribeWithSelector,
} from "zustand/middleware";

import type { NormalizedBatchTable } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";
import type {
	GetBatchTableMetadatasPageRequest,
	InfiniteDataBatchTableMetadataList,
} from "#/features/sapien/hooks/get/use-fetch-batch-table-metadatas-page";
import {
	getUserPreferedColorScheme,
	isValidNumber,
	OPTIMISTIC_NEW_NOTEBOOK_ID,
} from "#/helpers/utils";
import type { BotConversationMessageListPageInfiniteResponse } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import type { FetchNotebookListPageInfiniteData } from "#/hooks/fetch/use-fetch-notebook-list-page";
import type { SettingsReturnType } from "#/hooks/fetch/use-fetch-settings";
import { queryKeyFactory } from "#/hooks/query-keys";
import { useWithCurrentOrg } from "#/hooks/use-current-organization";
import type { Plan } from "#/types/chat";
import type {
	BatchTableId,
	BotConversationId,
	ColorScheme,
	NotebookId,
	OrganizationId,
} from "#/types/general";
import type {
	BetterbrainUser,
	BetterbrainUserId,
	BotConversation,
	ChatTools,
	Notebook,
	NotebookBlockUuid,
} from "#/types/notebook";
import { authStore } from "../auth/auth";
import { createReactSelectors } from "../create-zustand-provider";
import { queryClient } from "../query-client";
import type { SortedSimilarQueryToShow } from "#/features/notebook-outline/helpers";

export enum SidebarTab {
	Chats = "Chats",
	Outline = "Outline",
	Sources = "Sources",
}

export const SIDEBAR_TABS = Object.values(SidebarTab);

export enum FilterArchived {
	ONLY_NON_ARCHIVED = "False",
	ONLY_ARCHIVED = "True",
	ALL = "All",
}

export enum ToolSelectionType {
	SINGLE_SELECT = "SINGLE_SELECT",
	MULTI_SELECT = "MULTI_SELECT",
}

export enum MainPage {
	ChatUsageDashboard = "Chat Usage Dashboard",
	DataManager = "Data Manager",
	Notebook = "Notebook",
	Sapien = "Sapien",
	Chats = "Chats",
}

export enum OrganizationSelectorPlacement {
	IN_SIDEBAR = "IN_SIDEBAR",
	TOP_RIGHT = "TOP_RIGHT",
}

export type BatchTableIdAndOrganizationId = `${BatchTableId}-${OrganizationId}`;
export type PageOffset = Tagged<number, "PageOffset">;
export type PageLimit = Tagged<number, "PageLimit">;

export type GeneralContextData = {
	colorScheme: keyof typeof ColorScheme;
	userId: BetterbrainUserId | null;
	isNotebookMode: boolean;
	sidebarTab: SidebarTab;
	isChatMode: boolean;
	mainPage: MainPage;

	searchTextForSimilarQueries: {
		value: string;
		blockUUID: NotebookBlockUuid;
	} | null;
	botConversationId: BotConversationId | null;
	batchTableId: BatchTableId | null;
	brieflyKeepSidebarOpen: boolean;
	organizationId: OrganizationId;
	notebookId: NotebookId | null;
	pageArchived: FilterArchived;
	keepSidebarOpen: boolean;
	pageOffset: PageOffset;
	pageLimit: PageLimit;
	pageSort: {
		sort_direction: "asc" | "desc" | null;
		sort: string | null;
	};

	similarQueriesToShow: SortedSimilarQueryToShow;
	blockDiffEditor: {
		blockUuid: NotebookBlockUuid;
		value: string;
	} | null;

	lastBatchTableMetadataListQueryParams: Map<
		OrganizationId,
		GetBatchTableMetadatasPageRequest
	>;
	lastServerBatchTables: Map<
		BatchTableIdAndOrganizationId,
		NormalizedBatchTable
	>;

	organizationSelectorPlacement: OrganizationSelectorPlacement;
	showCreateNewOrganizationToAdminsInIframe: boolean;
	showCreateNewOrganizationToUsersInIframe: boolean;
	showCreateNewOrganizationToUsersInBb: boolean;
	replaceReferenceNumbersWithIcons: boolean;
	showManageUsersToAdminsInIframe: boolean;
	showManageUsersToUsersInIframe: boolean;
	toolSelectionType: ToolSelectionType;
	showManageUsersToUsersInBb: boolean;
	showEditProjectDescription: boolean;
	allowEditingCodeInChatMode: boolean;
	toggleHideParallelAnswers: boolean;
	showIntermediateMessages: boolean;
	showEditProjectAssignTo: boolean;
	showEditProjectPriority: boolean;
	onlyShowUsedReferences: boolean;
	showEditProjectStatus: boolean;
	showReferenceMetadata: boolean;
	clickupSourceIconUrl: string;
	showInLineCitations: boolean;
	showInternalSources: boolean;
	showEditProjectTags: boolean;
	showSourcesSidebar: boolean;
	showCodeInChatMode: boolean;
	pressEnterToSend: boolean;
	showThumbsUpDown: boolean;
	chatBotAgentName: string;

	userChatTools: Record<OrganizationId, Array<ChatTools>>;

	getBotConversationMessageListPages: (
		botConversationId: BotConversationId,
	) => BotConversationMessageListPageInfiniteResponse | undefined;
	setBotConversationMessageListPages: (
		botConversationId: BotConversationId,
		newList: Updater<
			BotConversationMessageListPageInfiniteResponse | undefined,
			BotConversationMessageListPageInfiniteResponse | undefined
		>,
	) => void;
	setNotebook: (
		notebookId: NotebookId,
		newNotebook: Updater<Notebook | undefined, Notebook | undefined>,
	) => Notebook | undefined;
	getNotebook: (notebookId: NotebookId) => Notebook | undefined;
	getNotebookListPages: (
		organizationId: OrganizationId,
	) => FetchNotebookListPageInfiniteData | undefined;
	setNotebookListPages: (
		organizationId: OrganizationId,
		newList: Updater<
			FetchNotebookListPageInfiniteData | undefined,
			FetchNotebookListPageInfiniteData | undefined
		>,
	) => void;
	setBotConversation: (
		botConversationId: BotConversationId,
		newBotConversation: Updater<
			BotConversation | undefined,
			BotConversation | undefined
		>,
	) => BotConversation | undefined;
	getBotConversation: (
		botConversationId: BotConversationId,
	) => BotConversation | undefined;
	setBotPlan: (
		botConversationId: BotConversationId,
		organizationId: OrganizationId,
		notebookId: NotebookId,
		newBotPlan: Updater<Plan | undefined, Plan | undefined>,
	) => void;
	setSettings(
		organizationId: OrganizationId,
		notebookId: NotebookId,
		newSettings: Updater<
			SettingsReturnType | undefined,
			SettingsReturnType | undefined
		>,
	): void;
	getBotPlan: (
		botConversationId: BotConversationId,
		organizationId: OrganizationId,
		notebookId: NotebookId,
	) => Plan | undefined;
	getUser: () => BetterbrainUser | undefined;

	getBatchTableMetadataListPages: () =>
		| InfiniteDataBatchTableMetadataList
		| undefined;
	setBatchTableMetadataListPages: (
		newList: Updater<
			InfiniteDataBatchTableMetadataList | undefined,
			InfiniteDataBatchTableMetadataList | undefined
		>,
	) => void;

	getBatchTable(
		organizationId: OrganizationId,
		batchTableId: BatchTableId,
	): NormalizedBatchTable | undefined;
	setBatchTable(
		newBatchTable: Updater<
			NormalizedBatchTable | undefined,
			NormalizedBatchTable | undefined
		>,
		organizationId: OrganizationId,
		batchTableId: BatchTableId,
	): void;
};

const generalContextStoreBase = create(
	persist(
		subscribeWithSelector<GeneralContextData>(
			(_set, get) =>
				({
					colorScheme: getUserPreferedColorScheme(),
					sidebarTab: SidebarTab.Chats,
					mainPage: MainPage.Chats,
					isNotebookMode: false,
					isChatMode: true,
					userId: null,

					pageArchived: FilterArchived.ONLY_NON_ARCHIVED,
					organizationId: 417 as OrganizationId,
					searchTextForSimilarQueries: null,
					brieflyKeepSidebarOpen: false,
					pageOffset: 0 as PageOffset,
					pageLimit: 30 as PageLimit,
					showInternalSources: true,
					botConversationId: null,
					keepSidebarOpen: false,
					batchTableId: null,
					notebookId: null,
					pageSort: {
						sort_direction: null,
						sort: null,
					},

					similarQueriesToShow: null,
					blockDiffEditor: null,

					lastBatchTableMetadataListQueryParams: new Map(),
					lastServerBatchTables: new Map(),

					organizationSelectorPlacement:
						OrganizationSelectorPlacement.IN_SIDEBAR,
					toolSelectionType: ToolSelectionType.SINGLE_SELECT,
					showCreateNewOrganizationToAdminsInIframe: false,
					showCreateNewOrganizationToUsersInIframe: false,
					showCreateNewOrganizationToUsersInBb: false,
					replaceReferenceNumbersWithIcons: false,
					showManageUsersToAdminsInIframe: false,
					showManageUsersToUsersInIframe: false,
					showEditProjectDescription: false,
					allowEditingCodeInChatMode: false,
					showManageUsersToUsersInBb: false,
					toggleHideParallelAnswers: false,
					showEditProjectAssignTo: false,
					showEditProjectPriority: false,
					showIntermediateMessages: true,
					onlyShowUsedReferences: false,
					showReferenceMetadata: false,
					showEditProjectStatus: false,
					chatBotAgentName: "Sapien",
					showEditProjectTags: false,
					showInLineCitations: true,
					clickupSourceIconUrl: "",
					showCodeInChatMode: true,
					showSourcesSidebar: true,
					pressEnterToSend: false,
					showThumbsUpDown: false,

					userChatTools: {},

					getBotPlan(botConversationId, organizationId, notebookId) {
						return queryClient.getQueryData<Plan>(
							queryKeyFactory.get["bot-plan"](
								botConversationId,
								organizationId,
								notebookId,
							).queryKey,
						);
					},
					setBotPlan(botConversationId, organizationId, notebookId, newPlan) {
						queryClient.setQueryData<Plan>(
							queryKeyFactory.get["bot-plan"](
								botConversationId,
								organizationId,
								notebookId,
							).queryKey,
							newPlan,
						);
					},
					setBotConversation(botConversationId, newBotConversation) {
						return queryClient.setQueryData<BotConversation>(
							queryKeyFactory.get["bot-conversation"](botConversationId)
								.queryKey,
							newBotConversation,
						);
					},
					getBotConversation(botConversationId) {
						return queryClient.getQueryData<BotConversation>(
							queryKeyFactory.get["bot-conversation"](botConversationId)
								.queryKey,
						);
					},
					getNotebook(notebookId) {
						return queryClient.getQueryData<Notebook>(
							queryKeyFactory.get["notebook-by-id"](notebookId).queryKey,
						);
					},
					setNotebook(notebookId, newNotebook) {
						return queryClient.setQueryData<Notebook>(
							queryKeyFactory.get["notebook-by-id"](notebookId).queryKey,
							newNotebook,
						);
					},
					getNotebookListPages(organizationId) {
						return queryClient.getQueryData<FetchNotebookListPageInfiniteData>(
							queryKeyFactory.get["notebook-list-page"](organizationId)
								.queryKey,
						);
					},
					setNotebookListPages(organizationId, newList) {
						queryClient.setQueryData<FetchNotebookListPageInfiniteData>(
							queryKeyFactory.get["notebook-list-page"](organizationId)
								.queryKey,
							newList,
						);
					},
					getBotConversationMessageListPages(
						botConversationId: BotConversationId,
					) {
						return queryClient.getQueryData<BotConversationMessageListPageInfiniteResponse>(
							queryKeyFactory.get["bot-conversation-message-list-page"](
								botConversationId,
							).queryKey,
						);
					},
					setBotConversationMessageListPages(botConversationId, newList) {
						queryClient.setQueryData<BotConversationMessageListPageInfiniteResponse>(
							queryKeyFactory.get["bot-conversation-message-list-page"](
								botConversationId,
							).queryKey,
							newList,
						);
					},
					setSettings(organizationId, notebookId, newSettings) {
						queryClient.setQueryData<SettingsReturnType>(
							queryKeyFactory.get["settings"](organizationId, notebookId)
								.queryKey,
							newSettings,
						);
					},
					getUser() {
						const { clerkApiToken, isUsingLocalClerk, token } =
							authStore.getState();

						return queryClient.getQueryData<BetterbrainUser>(
							queryKeyFactory.get["betterbrain-user"]({
								isUsingLocalClerk,
								clerkApiToken,
								token,
							}).queryKey,
						);
					},

					getBatchTableMetadataListPages() {
						const { lastBatchTableMetadataListQueryParams, organizationId } =
							get();

						const initialQueryParams =
							lastBatchTableMetadataListQueryParams.get(organizationId);

						if (!initialQueryParams) {
							console.error(
								"No initialQueryParams found! Can't get batch table metadata list.",
							);

							return undefined;
						}

						return queryClient.getQueryData<InfiniteDataBatchTableMetadataList>(
							queryKeyFactory.get["batch-table-metadata-page"](
								organizationId,
								initialQueryParams,
							).queryKey,
						);
					},

					setBatchTableMetadataListPages(newList) {
						const { lastBatchTableMetadataListQueryParams, organizationId } =
							get();

						const initialQueryParams =
							lastBatchTableMetadataListQueryParams.get(organizationId);

						if (!initialQueryParams) {
							console.error(
								"No initialQueryParams found! Can't set batch table metadata list.",
							);

							return undefined;
						}

						queryClient.setQueryData(
							queryKeyFactory.get["batch-table-metadata-page"](
								organizationId,
								initialQueryParams,
							).queryKey,
							newList,
						);
					},

					getBatchTable(organizationId, batchTableId) {
						if (!isValidNumber(batchTableId)) {
							throw new Error(
								`Expected a valid number for "batchTableId" but got: "${batchTableId}"`,
							);
						}
						if (!isValidNumber(organizationId)) {
							throw new Error(
								`Expected a valid number for "organizationId" but got: "${organizationId}"`,
							);
						}

						return queryClient.getQueryData<NormalizedBatchTable>(
							queryKeyFactory.get["batch-table"](organizationId, batchTableId)
								.queryKey,
						);
					},
					setBatchTable(newBatchTable, organizationId, batchTableId) {
						if (!isValidNumber(batchTableId)) {
							throw new Error(
								`Expected a valid number for "batchTableId" but got: "${batchTableId}"`,
							);
						}
						if (!isValidNumber(organizationId)) {
							throw new Error(
								`Expected a valid number for "organizationId" but got: "${organizationId}"`,
							);
						}

						queryClient.setQueryData(
							queryKeyFactory.get["batch-table"](organizationId, batchTableId)
								.queryKey,
							newBatchTable,
						);
					},
				}) satisfies GeneralContextData,
		),
		{
			partialize(state) {
				const botConversationId =
					state.botConversationId ===
					(OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId)
						? null
						: state.botConversationId;
				const batchTableId =
					state.batchTableId ===
					(OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BatchTableId)
						? null
						: state.batchTableId;
				const notebookId =
					state.notebookId === OPTIMISTIC_NEW_NOTEBOOK_ID
						? null
						: state.notebookId;

				return {
					keepSidebarOpen: state.keepSidebarOpen,
					organizationId: state.organizationId,
					userChatTools: state.userChatTools,
					colorScheme: state.colorScheme,
					mainPage: state.mainPage,
					userId: state.userId,
					botConversationId,
					batchTableId,
					notebookId,
				};
			},
			storage: createJSONStorage(() => localStorage),
			name: "general-context",
			version: 0,
		},
	),
);

export const generalContextStore = createReactSelectors(
	generalContextStoreBase,
);

export function useWithGeneralStoreNotebookId() {
	const notebookId = generalContextStore.use.notebookId();

	if (!isValidNumber(notebookId)) {
		throw new Error("NotebookId is null");
	}

	return notebookId;
}

export function useWithOrganizationId() {
	const organizationId = generalContextStore.use.organizationId();

	if (!isValidNumber(organizationId)) {
		throw new Error("OrganizationId is null");
	}

	return organizationId;
}

export function useWithBotConversationId() {
	const botConversationId = generalContextStore.use.botConversationId();

	if (!isValidNumber(botConversationId)) {
		throw new Error("botConversationId is null");
	}

	return botConversationId;
}

export function useWithBatchTableId() {
	const batchTableId = generalContextStore.use.batchTableId();

	if (!isValidNumber(batchTableId)) {
		throw new Error("No batch table selected!", {
			cause: `Expected a valid number for "batchTableId" but got: "${batchTableId}"`,
		});
	}

	return batchTableId;
}

export function useUserChatTools() {
	const org = useWithCurrentOrg();

	return (
		generalContextStore.use.userChatTools()[org.id] ?? org.default_chat_tools
	);
}
