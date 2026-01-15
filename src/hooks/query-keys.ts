import { createQueryKeyStore } from "@lukemorales/query-key-factory";

import { api } from "#/api";
import type { FetchDatabaseDataParams } from "#/features/schema-tree/schema-tree";
import type { GetOrganizationFilesRequest } from "#/hooks/fetch/use-fetch-organization-files";
import type { PDFOrCSVSourceType } from "#/types/bot-source";
import type {
	BatchTableId,
	BotConversationId,
	FileId,
	NotebookId,
	OrganizationId,
} from "#/types/general";
import type {
	BetterbrainUserId,
	NotebookBlockUuid,
	PdfId,
} from "#/types/notebook";
import type { GetBotConversationMessagesPageRequest } from "./fetch/use-fetch-bot-conversation-message-list-page";
import type { GetAllBotSourcesRequest } from "./fetch/use-fetch-bot-sources-page";
import type { GetAllBotsRequest } from "./fetch/use-fetch-bots-page";
import type { GetConnectionDataRequest } from "./fetch/use-fetch-connection-data";
import type { FetchNotebookListPageParams } from "./fetch/use-fetch-notebook-list-page";
import type { GetPDFOrCSVFilesPageRequest } from "./fetch/use-fetch-pdf-or-csv-files-page";
import type { GetWebCrawlsPageRequest } from "./fetch/use-fetch-web-crawls-page";

export const queryKeyFactory = createQueryKeyStore({
	get: {
		"file-by-presigned-url": null,
		"search-user-by-email": null,
		"all-conversations": null,
		"aws-base64-file": null,
		"search-schema": null,
		"aws-csv-file": null,
		"aws-image": null,

		"org-member": (
			organizationId: OrganizationId,
			userId: BetterbrainUserId,
		) => ({
			queryFn: () => api.get["org-member"](organizationId, userId),
			queryKey: [organizationId, userId],
		}),

		"bot-plan": (
			botConversationId: BotConversationId,
			organizationId: OrganizationId,
			notebookId: NotebookId,
		) => ({
			queryFn: () =>
				api.get["bot-plan"](botConversationId, organizationId, notebookId),
			queryKey: [botConversationId, organizationId, notebookId],
		}),

		"web-crawls-page": (organizationId: OrganizationId) => ({
			queryFn: ({ pageParam }: { pageParam: GetWebCrawlsPageRequest }) =>
				api.get["web-crawls-page"](pageParam),
			queryKey: [organizationId],
		}),

		"pdf-or-csv-files-page": (
			organizationId: OrganizationId,
			file_type: PDFOrCSVSourceType,
		) => ({
			queryFn: ({ pageParam }: { pageParam: GetPDFOrCSVFilesPageRequest }) =>
				api.get["pdf-or-csv-files-page"](pageParam),
			queryKey: [organizationId, file_type],
		}),

		"all-organization-files": (
			organizationId: OrganizationId,
			queryParams: GetOrganizationFilesRequest,
		) => ({
			queryFn: () =>
				api.get["all-organization-files"](organizationId, queryParams),
			queryKey: [organizationId, queryParams],
		}),

		"bots-page": (organizationId: OrganizationId) => ({
			queryFn: ({
				pageParam,
				signal,
			}: {
				pageParam: GetAllBotsRequest;
				signal: AbortSignal;
			}) => api.get["bots-page"](pageParam, signal),
			queryKey: [organizationId],
		}),

		"bot-sources-page": (organizationId: OrganizationId) => ({
			queryFn: ({ pageParam }: { pageParam: GetAllBotSourcesRequest }) =>
				api.get["bot-sources-page"](pageParam),
			queryKey: [organizationId],
		}),

		"connection-data": (queryParams: GetConnectionDataRequest) => ({
			queryFn: () => api.get["connection-data"](queryParams),
			queryKey: [queryParams],
		}),

		"database-data": (dbParams: FetchDatabaseDataParams) => ({
			queryFn: () => api.get["database-data"](dbParams),
			queryKey: [dbParams],
		}),

		"organization-users": (organizationId: OrganizationId) => ({
			queryKey: [organizationId],
		}),

		"all-organizations": {
			queryFn: () => api.get["all-organizations"](),
			queryKey: null,
		},

		"all-database-connections": (organizationId: OrganizationId) => ({
			queryFn: () => api.get["all-database-connections"](organizationId),
			queryKey: [organizationId],
		}),

		"bot-conversation-message-list-page": (
			botConversationId: BotConversationId,
		) => ({
			queryFn: ({
				pageParam,
			}: {
				pageParam: GetBotConversationMessagesPageRequest;
			}) => api.get["bot-conversation-message-list-page"](pageParam),
			queryKey: [botConversationId],
		}),

		"notebook-by-id": (notebookId: NotebookId) => ({
			queryFn: () => api.get["notebook-by-id"](notebookId),
			queryKey: [notebookId],
		}),

		"notebook-list-page": (organizationId: OrganizationId) => ({
			queryFn: ({ pageParam }: { pageParam: FetchNotebookListPageParams }) =>
				api.get["notebook-list-page"](pageParam, organizationId),
			queryKey: [organizationId],
		}),

		"bot-conversation": (botConversationId: BotConversationId) => ({
			queryFn: () => api.get["bot-conversation"](botConversationId),
			queryKey: [botConversationId],
		}),

		"betterbrain-user": ({
			isUsingLocalClerk,
			clerkApiToken,
			token,
		}: {
			isUsingLocalClerk: boolean;
			clerkApiToken: string;
			token: string;
		}) => ({
			queryKey: [isUsingLocalClerk, clerkApiToken, token],
			queryFn: () => api.get["betterbrain-user"](),
		}),

		"chat-usage-data": (organizationId: OrganizationId) => ({
			queryFn: () => api.get["chat-usage-data"](organizationId),
			queryKey: [organizationId],
		}),

		"active-plan": (botConversationId: BotConversationId) => ({
			queryKey: [botConversationId],
		}),

		settings: (
			organizationId: OrganizationId,
			notebookId: NotebookId | undefined,
		) => ({
			queryFn: () => api.get["settings"](organizationId, notebookId),
			queryKey: [organizationId, notebookId],
		}),

		"pdf-file-by-id": (pdfFileId: FileId | PdfId | undefined) => ({
			queryFn: () => api.get["pdf-file-by-id"](pdfFileId),
			queryKey: [pdfFileId],
		}),

		"organization-tag-list": (organizationId: OrganizationId) => ({
			queryFn: () => api.get["organization-tag-list"](organizationId),
			queryKey: [organizationId],
		}),
	},

	post: {
		"intelligent-column-type-detection": null,
		"create-bot-communication-config": null,
		"create-batch-table-data-source": null,
		"upload-file-as-base64-to-aws": null,
		"ask-to-generate-python-code": null,
		"ask-to-generate-sql-code": null,
		"create-bot-communication": null,
		"bot-conversation-message": null,
		"mark-good-bad-response": null,
		"upload-and-index-files": null,
		"batch-table-metadata": null,
		"upload-csv-to-sapien": null,
		"update-file-metadata": null,
		"invite-user-to-org": null,
		"upload-file-to-aws": null,
		"create-integration": null,
		"update-bot-source": null,
		"create-bot-source": null,
		"index-web-source": null,
		"create-web-crawl": null,
		"approve-bot-plan": null,
		"send-chat-files": null,
		"create-website": null,
		"edit-bot-plan": null,
		"create-tag": null,
		"create-bot": null,
		organization: null,
		notebook: null,

		"update-result-variable": (blockUuid: NotebookBlockUuid) => ({
			queryKey: [blockUuid],
		}),

		"block-request": {
			queryKey: ["action" as const],
			contextQueries: {
				"run-csv": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"upload-csv": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"run-sql": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"run-table-block": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"fix-python": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"fix-sql": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"upload-pdf": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"run-python": (blockUuid: NotebookBlockUuid) => ({
					queryKey: [blockUuid],
				}),
				"generate-sql-description": null,
				"paginate-dataframe": null,
				"unverify-sql-code": null,
				"verify-sql-code": null,
				"download-csv": null,
				"download-sql": null,
				"index-pdf": null,
			},
		},
	},

	put: {
		"add-batch-table-data-source-to-column": null,
		"edit-batch-table-data-source": null,
		"batch-table-metadata": null,
		"update-organization": null,
		"update-integration": null,
		"update-org-user": null,
		"add-user-to-org": null,
		"index-web-crawl": null,
		"sync-connection": null,
		"sync-clickup": null,
		notebook: null,
		settings: null,
	},

	patch: {
		"batch-table-by-id": null,
		"notebook-blocks": null,
	},

	delete: {
		"delete-aws-file": null,
		"user-from-org": null,
		"bot-plan": null,
	},
});
