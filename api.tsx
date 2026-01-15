/* eslint-disable @typescript-eslint/no-explicit-any */

import type { QueryClient } from "@tanstack/react-query";
import { uniqBy } from "es-toolkit";
import axios, {
	isAxiosError,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { email, number, object, string } from "zod/mini";

import { ToastVariant } from "./components/Toast/ToastVariant";
import { toast } from "./components/Toast/useToast";
import { authStore } from "./contexts/auth/auth";
import {
	databasesSchemaStore,
	type DatabaseConnectionsSchema,
} from "./contexts/databases-schema";
import type { ChatUsageDataResponse } from "./features/chat-usage-dashboard/hooks/fetch/use-chat-fetch-usage-data";
import type { GetToolsResponse } from "./features/sapien/hooks/get/use-fetch-available-tools";
import type { GetBatchTableDataSourcesResponse } from "./features/sapien/hooks/get/use-fetch-batch-table-data-sources";
import type {
	GetBatchTableMetadatasPageRequest,
	GetBatchTableMetadatasResponse,
	PostBatchTableMetadataRequest,
	PostBatchTableMetadataResponse,
} from "./features/sapien/hooks/get/use-fetch-batch-table-metadatas-page";
import type {
	PutBatchTableMetadataRequest,
	PutBatchTableMetadataResponse,
} from "./features/sapien/hooks/put/use-put-batch-table-metadata";
import { normalizeBatchTable } from "./features/sapien/lib/normalize-batch-table";
import { mergeSchemaData } from "./features/schema-tree/helpers/merge-schema-data";
import type { FetchDatabaseDataParams } from "./features/schema-tree/schema-tree";
import { applyNotebookResponseUpdates } from "./helpers/apply-notebook-response-updates";
import {
	createISODate,
	getErrorMessage,
	isRecord,
	isValidNumber,
	sleep,
} from "./helpers/utils";
import {
	slackChannelWithName,
	type AllDatabaseConnections,
	type FetchDatabasesConnectionsResponse,
} from "./hooks/fetch/use-fetch-all-database-connections";
import type {
	GetOrganizationsResponse,
	Organization,
} from "./hooks/fetch/use-fetch-all-organizations";
import type { FetchBetterbrainUserResponse } from "./hooks/fetch/use-fetch-betterbrain-user";
import type { GetBotConversationByIdResponse } from "./hooks/fetch/use-fetch-bot-conversation";
import type {
	GetBotConversationMessagesPageRequest,
	GetBotConversationMessagesPageResponse,
} from "./hooks/fetch/use-fetch-bot-conversation-message-list-page";
import type { GetBotPlanResponse } from "./hooks/fetch/use-fetch-bot-plan";
import type {
	GetAllBotSourcesRequest,
	GetAllBotSourcesResponse,
} from "./hooks/fetch/use-fetch-bot-sources-page";
import type {
	GetAllBotsRequest,
	GetAllBotsResponse,
} from "./hooks/fetch/use-fetch-bots-page";
import type {
	GetConnectionDataRequest,
	GetConnectionDataResponse,
} from "./hooks/fetch/use-fetch-connection-data";
import type {
	DatabaseDataRequest,
	FetchSchemaResponse,
} from "./hooks/fetch/use-fetch-database-data";
import { MimeType } from "./hooks/fetch/use-fetch-file-by-id";
import type { FetchNotebookResponse } from "./hooks/fetch/use-fetch-notebook";
import type {
	FetchNotebookListPageParams,
	FetchNotebookListPageResponse,
} from "./hooks/fetch/use-fetch-notebook-list-page";
import type {
	FetchOrganizationUsersRequest,
	FetchOrganizationUsersResponse,
} from "./hooks/fetch/use-fetch-org-users-page";
import type {
	GetOrganizationFilesRequest,
	GetOrganizationFilesResponse,
} from "./hooks/fetch/use-fetch-organization-files";
import type { FetchTagsResponse } from "./hooks/fetch/use-fetch-organization-tags";
import type { GetPresignedUrlByFileIdResponse } from "./hooks/fetch/use-fetch-pdf-file-by-id";
import type {
	GetPDFOrCSVFilesPageRequest,
	GetPDFOrCSVFilesPageResponse,
} from "./hooks/fetch/use-fetch-pdf-or-csv-files-page";
import type { SettingsReturnType } from "./hooks/fetch/use-fetch-settings";
import type {
	GetWebCrawlsPageRequest,
	GetWebCrawlsPageResponse,
} from "./hooks/fetch/use-fetch-web-crawls-page";
import type { OrganizationMember } from "./hooks/mutation/use-invite-user-to-org";
import type { BatchTable } from "./types/batch-table";
import type { Plan } from "./types/chat";
import {
	DatabaseAction,
	DatabaseConnectionType,
	EntityType,
	type AirtableDatabaseConnection,
	type ClickUpConnectionType,
	type DatabaseConnection,
	type GoogleDriveDatabaseConnection,
	type NormalDatabaseConnection,
	type PlaidConnection,
	type SlackConnectionDataWithDefinedChannels,
} from "./types/databases";
import type {
	BatchTableId,
	BotConversationId,
	FileId,
	NotebookId,
	OrganizationId,
} from "./types/general";
import type { BetterbrainUserId, PdfId } from "./types/notebook";
import { queryKeyFactory } from "./hooks/query-keys";

const BACKEND_API = process.env.NEXT_PUBLIC_PROD_BACKEND_URL;

if (!BACKEND_API) {
	throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export const clientAPI_V1 = axios.create({
	baseURL: `${BACKEND_API}/api/v1`,
});

export const clientAPI_V2 = axios.create({
	baseURL: `${BACKEND_API}/api/v2`,
});

export const clientBareAPI = axios.create({
	baseURL: BACKEND_API,
});

async function putAuthTokenOnHeader(config: InternalAxiosRequestConfig<any>) {
	try {
		const headerAuth = await getHeaderAuth();

		Object.assign(config.headers, headerAuth);
	} catch (error) {
		console.error("Error getting token on clientAPI interceptor!", error);
	}

	return config;
}
function putAuthTokenOnHeaderError(error: any) {
	return Promise.reject(error);
}

function showUserNotfications(res: AxiosResponse) {
	const hasUserNotifications = Boolean(
		res?.data &&
			isRecord(res.data) &&
			"user_notifications" in res.data &&
			Array.isArray(res.data.user_notifications) &&
			res.data.user_notifications.length > 0,
	);

	if (hasUserNotifications) {
		const notifications = res.data.user_notifications as string[];

		notifications.forEach((title) => {
			toast({
				variant: ToastVariant.Default,
				title,
			});
		});
	}
}

function showErrors(res: AxiosResponse) {
	const hasErrorsOnData = Boolean(
		res?.data && isRecord(res.data) && "error" in res.data && res.data.error,
	);

	if (hasErrorsOnData) {
		toast({
			variant: ToastVariant.Destructive,
			title: res.data.error,
		});
	}

	const hasErrorsOnActionOutput = Boolean(
		res?.data &&
			isRecord(res.data) &&
			"action_output" in res.data &&
			isRecord(res.data.action_output) &&
			"error" in res.data.action_output &&
			res.data.action_output.error,
	);

	if (hasErrorsOnActionOutput) {
		toast({
			title: res.data.action_output.error,
			variant: ToastVariant.Destructive,
		});
	}
}

function errorsAndNotificationsOnResponse(res: AxiosResponse) {
	showUserNotfications(res);
	showErrors(res);

	return res;
}

function handleErrors(error: any) {
	// Pass the error along so we can show it to the user.
	if (isAxiosError(error)) {
		if (error.response) {
			showUserNotfications(error.response);
		}

		const hasError =
			error.response?.data &&
			isRecord(error.response.data) &&
			"error" in error.response.data &&
			error.response.data.error;

		if (hasError && error.response?.data.error) {
			error.message = error.response.data.error;
		}
	}

	throw error;
}

const validatedTokenResponseSchema = object({
	user_email: string().check(email()),
	organization_name: string(),
	organization_id: number(),
	user_id: number(),
	token: object({
		expires_at: string(),
		token: string(),
	}),
});

export async function validateTokenToSetItOnApiHeader(token: string) {
	try {
		const response = await fetch(
			`${BACKEND_API}/api/v1/validate-short-lived-token`,
			{
				body: JSON.stringify({ token }),
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			},
		);

		if (response.status !== 200) {
			throw new Error("HTTP error!");
		}

		return validatedTokenResponseSchema.parse(await response.json());
	} catch (error) {
		console.error("Error validating token! Please, try again.", error);

		toast({
			title: "Error validating token! Please, try again.",
			description: getErrorMessage(error),
			variant: ToastVariant.Destructive,
		});

		throw error;
	}
}

export enum AuthTokenType {
	Bearer = "Bearer",
	ApiKey = "ApiKey",
}

export async function getHeaderAuth() {
	const headers: Record<string, string> = {};

	const token = await getAuthToken();

	switch (token.type) {
		case AuthTokenType.Bearer: {
			headers.Authorization = `Bearer ${token.token}`;

			break;
		}

		case AuthTokenType.ApiKey: {
			if (!token.token) {
				console.error("No token found for auth!", { token });

				throw new Error("No token found for auth!");
			}

			headers["API-KEY"] = token.token;

			break;
		}
	}

	return headers;
}

export async function getAuthToken() {
	const authState = authStore.getState();

	if (authState.clerkApiToken) {
		return { token: authState.clerkApiToken, type: AuthTokenType.Bearer };
	} else if (authState.token) {
		return { token: authState.token, type: AuthTokenType.ApiKey };
	} else if (authState.isUsingLocalClerk) {
		if (!window?.Clerk) {
			throw new Error("Clerk is not defined on window.");
		}

		const start = performance.now();
		const clerkToken = await window.Clerk.session?.getToken({
			template: "basicToken",
		});
		const timeTaken = performance.now() - start;
		if (timeTaken > 700) {
			console.log("Got clerk token in");
		}

		return { token: clerkToken, type: AuthTokenType.Bearer };
	} else {
		throw new Error("No token found for auth!");
	}
}

clientAPI_V1.interceptors.request.use(
	putAuthTokenOnHeader,
	putAuthTokenOnHeaderError,
);
clientAPI_V1.interceptors.response.use(
	errorsAndNotificationsOnResponse,
	handleErrors,
);
clientAPI_V2.interceptors.request.use(
	putAuthTokenOnHeader,
	putAuthTokenOnHeaderError,
);
clientAPI_V2.interceptors.response.use(
	errorsAndNotificationsOnResponse,
	handleErrors,
);
clientBareAPI.interceptors.request.use(
	putAuthTokenOnHeader,
	putAuthTokenOnHeaderError,
);
clientBareAPI.interceptors.response.use(
	errorsAndNotificationsOnResponse,
	handleErrors,
);

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

export const api = {
	get: {
		"org-member": async (
			organizationId: OrganizationId,
			userId: BetterbrainUserId,
		) => {
			const res = await clientAPI_V1.get<OrganizationMember>(
				`/organizations/${organizationId}/users/${userId}`,
			);

			return res.data;
		},

		"bot-plan": async (
			botConversationId: BotConversationId,
			organizationId: OrganizationId,
			notebookId: NotebookId,
		) => {
			if (botConversationId === (Number.EPSILON as BotConversationId)) {
				return null;
			}

			const start = performance.now();

			const path = `/bot-conversations/${botConversationId}/active-plan`;

			const res = await clientAPI_V1.get<GetBotPlanResponse>(path);

			const { updates, plan } = res.data;

			const sortedSubSteps = plan?.sub_tasks?.toSorted(
				(a, b) => a.step_num - b.step_num,
			);

			const newPlan = plan
				? ({ ...plan, sub_tasks: sortedSubSteps } satisfies Plan)
				: null;

			if (updates && updates.length > 0) {
				applyNotebookResponseUpdates({
					organizationId,
					response: {
						bot_conversation_id: botConversationId,
						timestamp: createISODate(),
						project_id: notebookId,
						updates,
					},
				});
			}

			console.log(
				`useFetchActivePlan(botConversationId = ${botConversationId}) took ${performance.now() - start}ms`,
			);

			return newPlan;
		},

		"batch-table-data-sources": async (organizationId: OrganizationId) => {
			const res = await clientAPI_V1.get<GetBatchTableDataSourcesResponse>(
				`/organizations/${organizationId}/data-sources`,
			);

			return res.data;
		},

		"batch-table": async (
			batchTableId: BatchTableId,
			organizationId: OrganizationId,
		) => {
			const startFetching = performance.now();

			const path = `/organizations/${organizationId}/batch-tables/${batchTableId}?include_data=true`;

			const res = await clientAPI_V1.get<BatchTable>(path);

			const endFetching = performance.now();

			const rawBatchTable = res.data;

			const startNormalizing = performance.now();

			const normalizedBatchTable = normalizeBatchTable(rawBatchTable);

			const endNormalizing = performance.now();

			console.log({
				normalizedBatchTable,
				"fetch took": endFetching - startFetching,
				"normalizing data took": endNormalizing - startNormalizing,
			});

			return normalizedBatchTable;
		},

		"available-tools": async (organizationId: OrganizationId) => {
			const res = await clientAPI_V1.get<GetToolsResponse>(
				`/organizations/${organizationId}/tools`,
			);

			return res.data.results;
		},

		"batch-table-metadata-page": async (
			pageParam: GetBatchTableMetadatasPageRequest,
			organizationId: OrganizationId,
		) => {
			try {
				const objForUrlSearchParams: typeof pageParam = {
					...pageParam,
				};

				for (const key in objForUrlSearchParams) {
					// @ts-expect-error => ignore
					const value = objForUrlSearchParams[key]!;

					if (value === null || value === undefined) {
						Reflect.deleteProperty(objForUrlSearchParams, key);
					}
				}

				const queryParamsString = new URLSearchParams(
					objForUrlSearchParams as any as Record<string, string>,
				).toString();

				const res = await clientAPI_V1.get<GetBatchTableMetadatasResponse>(
					`/organizations/${organizationId}/batch-tables?${queryParamsString}`,
				);

				return res.data;
			} catch (error) {
				console.error("Error fetching projects of organization:", {
					pageParam,
					error,
				});

				const currentPage = Math.floor(pageParam.offset / pageParam.limit) + 1;

				toast({
					title: `Error getting batch tables, page ${currentPage}`,
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"chat-usage-data": async (organizationId: OrganizationId) => {
			try {
				const path = `/organizations/${organizationId}/chat/usage`;

				const res = await clientAPI_V1.get<ChatUsageDataResponse>(path);

				return res.data.results;
			} catch (error) {
				toast({
					title: "Error getting chat usage data!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"web-crawls-page": async (pageParam: GetWebCrawlsPageRequest) => {
			try {
				const { organizationId, ...rest } = pageParam;

				// @ts-expect-error => URLSearchParams does accept number values:
				const searchParams = new URLSearchParams(rest);

				const path = `/organizations/${organizationId}/web-crawls?${searchParams.toString()}`;

				const res = await clientAPI_V1.get<GetWebCrawlsPageResponse>(path);

				return res.data;
			} catch (error) {
				console.error("webCrawlsPageQuery error:", error);

				toast({
					description: getErrorMessage(error),
					title: "Error getting web crawls!",
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"pdf-or-csv-files-page": async (pageParam: GetPDFOrCSVFilesPageRequest) => {
			try {
				const { organizationId, ...rest } = pageParam;

				// @ts-expect-error => URLSearchParams does accept number values:
				const searchParams = new URLSearchParams(rest);

				const path = `/organizations/${organizationId}/files?${searchParams.toString()}`;

				const res = await clientAPI_V1.get<GetPDFOrCSVFilesPageResponse>(path);

				return res.data;
			} catch (error) {
				console.error("pdfOrCSVFilesPageQuery error:", error);

				toast({
					title: `Error getting ${pageParam.file_type} files!`,
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"all-organization-files": async (
			organizationId: OrganizationId,
			queryParams: GetOrganizationFilesRequest,
		) => {
			try {
				for (const key in queryParams) {
					// @ts-expect-error => ignore
					const value = queryParams[key]!;

					if (value === null || value === undefined) {
						Reflect.deleteProperty(queryParams, key);
					}
				}

				const searchParams = new URLSearchParams(
					queryParams as any as Record<string, string>,
				);

				const res = await clientAPI_V1.get<GetOrganizationFilesResponse>(
					`organizations/${organizationId}/files?${searchParams.toString()}`,
				);

				return res.data;
			} catch (error) {
				console.error(error);

				toast({
					title: "Error getting organization files page!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"bots-page": async (pageParam: GetAllBotsRequest, signal: AbortSignal) => {
			try {
				const { organizationId, ...rest } = pageParam;

				for (const key in rest) {
					// @ts-expect-error => ignore
					const value = rest[key]!;

					if (value === null || value === undefined) {
						Reflect.deleteProperty(rest, key);
					}
				}

				// @ts-expect-error => URLSearchParams does accept number values:
				const searchParams = new URLSearchParams(rest);

				const path = `/organizations/${organizationId}/bots?${searchParams.toString()}`;

				const res = await clientAPI_V1.get<GetAllBotsResponse>(path, {
					signal,
				});

				return res.data;
			} catch (error) {
				if (signal.aborted) throw error;

				console.error("fetchBotsPageQuery error:", error);

				toast({
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
					title: "Error getting bots page!",
				});

				throw error;
			}
		},

		"bot-sources-page": async (pageParam: GetAllBotSourcesRequest) => {
			try {
				const { organizationId, ...rest } = pageParam;

				// @ts-expect-error => URLSearchParams does accept number values:
				const searchParams = new URLSearchParams(rest);

				const path = `/organizations/${organizationId}/sources?${searchParams.toString()}`;

				const res = await clientAPI_V1.get<GetAllBotSourcesResponse>(path);

				return res.data;
			} catch (error) {
				console.error("botSourcesPageQuery error:", error);

				toast({
					title: "Error getting bot sources!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"connection-data": async (queryParams: GetConnectionDataRequest) => {
			try {
				const searchParams = new URLSearchParams(
					queryParams as any as Record<string, string>,
				);

				const res = await clientBareAPI.get<GetConnectionDataResponse>(
					`connection?${searchParams.toString()}`,
				);

				return res.data;
			} catch (error) {
				toast({
					title: "Error fetching connection data!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"database-data": async (dbParams: FetchDatabaseDataParams) => {
			try {
				const entity_type =
					"entity_type" in dbParams
						? dbParams.entity_type
						: EntityType.DATA_SCHEMA;
				const entity_id =
					"entity_id" in dbParams
						? dbParams.entity_id
						: dbParams.db.data_schema_id;

				const queryBody: DatabaseDataRequest = {
					connection_type: dbParams.db.type,
					action: DatabaseAction.GET_SCHEMA,
					connection_id: dbParams.db.id,
					metadata: {},
					action_inputs: {
						entity_type,
						entity_id,
					},
				};

				type PostQueryResponse = {
					request_id: string;
					status: "pending";
				};

				const queryResponse = await clientBareAPI.post<PostQueryResponse>(
					"/v2/query",
					queryBody,
				);

				const pollData = {
					request_uuid: queryResponse.data.request_id,
					connection_id: dbParams.db.id,
				};
				let querySchemaResponse = queryResponse.data as FetchSchemaResponse;

				{
					while (querySchemaResponse.status === "pending") {
						await sleep(1_000);

						const pollResponse = await clientBareAPI.post<FetchSchemaResponse>(
							"poll-query",
							pollData,
						);

						querySchemaResponse = pollResponse.data;
					}
				}

				if (querySchemaResponse.error) {
					toast({
						description: querySchemaResponse.error,
						variant: ToastVariant.Destructive,
						title: "Failed to fetch schema",
					});

					throw new Error(querySchemaResponse.error);
				}

				const connectionType = querySchemaResponse.connection_type;
				const schema = querySchemaResponse.action_outputs;

				if (!(schema && connectionType)) {
					console.error("No schema/connectionType was returned!", {
						querySchemaResponse,
						dbParams,
					});

					toast({
						description: (
							<p>
								<span className="italic underline underline-offset-2">
									{dbParams.db.name}
								</span>{" "}
								— we don&apos;t have the schema at all, so there are no tables
								to show!
							</p>
						),
						title: "Error fetching database schema",
						variant: ToastVariant.Destructive,
					});

					return;
				}

				databasesSchemaStore.setState((prev) => {
					const newSchema: DatabaseConnectionsSchema = {
						databaseId: dbParams.db.id,
						connectionType,
						schema,
					};

					const dbIndex = prev.databasesSchema.findIndex(
						(item) =>
							item.databaseId === dbParams.db.id &&
							dbParams.db.type === item.connectionType,
					);

					if (dbIndex === -1) {
						return {
							databasesSchema: prev.databasesSchema.concat(newSchema),
						};
					} else {
						const mergedSchemaData = mergeSchemaData(
							prev.databasesSchema,
							dbIndex,
							newSchema,
						);

						return { databasesSchema: mergedSchemaData };
					}
				});

				return querySchemaResponse;
			} catch (error) {
				console.error("Error fetching database data!", {
					dbParams,
					error,
				});

				toast({
					title: "Error fetching database data!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"organization-users": async (
			organizationId: OrganizationId,
			queryParams: FetchOrganizationUsersRequest | null,
			queryClient: QueryClient,
		) => {
			try {
				const searchParams = new URLSearchParams(
					queryParams as unknown as Record<string, string>,
				).toString();

				const res = await clientAPI_V1.get<FetchOrganizationUsersResponse>(
					`/organizations/${organizationId}/users?${searchParams}`,
				);

				queryClient.setQueryData<Array<Organization>>(
					queryKeyFactory.get["all-organizations"].queryKey,
					(prevAllOrganizations) => {
						if (!prevAllOrganizations) return [];

						const prevOrganizationIndex = prevAllOrganizations.findIndex(
							(organization) => organization.id === organizationId,
						);

						const prevOrganization =
							prevAllOrganizations[prevOrganizationIndex];

						if (!prevOrganization) return prevAllOrganizations;

						const nextAllOrganizations: typeof prevAllOrganizations = [
							...prevAllOrganizations,
						];

						const nextUsers = uniqBy(
							prevOrganization.members.users.concat(res.data.results),
							(user) => user.id,
						);

						nextAllOrganizations[prevOrganizationIndex] = {
							...prevOrganization,
							members: {
								total: res.data.total_results,
								offset: res.data.offset,
								limit: res.data.limit,
								users: nextUsers,
							},
						};

						return nextAllOrganizations;
					},
				);

				return res.data;
			} catch (error) {
				toast({
					title: "Error getting organization users!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		"all-organizations": async () => {
			try {
				const res =
					await clientAPI_V1.get<GetOrganizationsResponse>("/organizations");

				return res.data.results;
			} catch (error) {
				console.error("allOrganizatinosQuery error:", error);

				toast({
					title: "Error getting all organizations!",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				throw error;
			}
		},

		// 		"download-file": async (file: FileToDownload) => {
		// 			const canFetch = Boolean(
		// 				file.aws_bucket && file.executed && file.aws_key,
		// 			);
		//
		// 			if (!canFetch) {
		// 				throw new Error("No file to download!", { cause: { file } });
		// 			}
		//
		// 			const res = await clientToApiForServerToServerRequests.get(
		// 				`get-aws-file-as-binary-string?aws_bucket=${file.aws_bucket}&aws_key=${file.aws_key}`,
		// 			);
		//
		// 			const fileAsBase64String = `data:text/csv;base64,${res.data}`;
		//
		// 			const blob = await fetch(fileAsBase64String).then((res) => res.blob());
		//
		// 			const fileUrl = URL.createObjectURL(blob);
		//
		// 			return fileUrl;
		// 		},

		"all-database-connections": async (organizationId: OrganizationId) => {
			if (!isValidNumber(organizationId)) {
				throw new Error(`Invalid organizationId: "${organizationId}"`);
			}

			const path = `connections/?organization_id=${organizationId}`;

			const res =
				await clientBareAPI.get<FetchDatabasesConnectionsResponse>(path);

			const allDatabaseConnections = res.data.results;

			const isNormalDatabaseConnection = (
				db: DatabaseConnection,
			): db is NormalDatabaseConnection =>
				db.type === DatabaseConnectionType.ExternalDatasource ||
				db.type === DatabaseConnectionType.OracleDatabase ||
				db.type === DatabaseConnectionType.Snowflake ||
				db.type === DatabaseConnectionType.BigQuery ||
				db.type === DatabaseConnectionType.Postgres;

			const isBotDatabaseConnection = (
				db: DatabaseConnection,
			): db is SlackConnectionDataWithDefinedChannels =>
				db.type === DatabaseConnectionType.Slack;

			const isPlaidConnection = (
				db: DatabaseConnection,
			): db is PlaidConnection => db.type === DatabaseConnectionType.Plaid;

			const isClickUpConnection = (
				db: DatabaseConnection,
			): db is ClickUpConnectionType =>
				db.type === DatabaseConnectionType.ClickUp;

			const isAirtableDatabaseConnection = (
				db: DatabaseConnection,
			): db is AirtableDatabaseConnection =>
				db.type === DatabaseConnectionType.Airtable;

			const isGoogleDriveDatabaseConnection = (
				db: DatabaseConnection,
			): db is GoogleDriveDatabaseConnection =>
				db.type === DatabaseConnectionType.GoogleDrive;

			const store: AllDatabaseConnections = {
				allDatabaseConnections,

				// Derived values from `allDatabaseConnections`:
				airtableDatabaseConnections: allDatabaseConnections.filter(
					isAirtableDatabaseConnection,
				),
				normalDatabases: allDatabaseConnections.filter(
					isNormalDatabaseConnection,
				),
				googleDriveDatabases: allDatabaseConnections.filter(
					isGoogleDriveDatabaseConnection,
				),
				botDatabaseConnections: allDatabaseConnections
					.filter(isBotDatabaseConnection)
					.map((oldDb) => {
						const newDb = { ...oldDb };

						// Only channels with name defined matters to us:
						newDb.channels = newDb.channels.filter(slackChannelWithName);

						return newDb;
					}),
				clickUpConnections: allDatabaseConnections.filter(isClickUpConnection),
				plaidConnections: allDatabaseConnections.filter(isPlaidConnection),
			};

			return store;
		},

		"bot-conversation-message-list-page": async (
			pageParam: GetBotConversationMessagesPageRequest,
		) => {
			const { botConversationId, ...searchParamsObj } = pageParam;

			// Casting here because JS converts number to string here:
			const searchParams = new URLSearchParams(
				searchParamsObj as unknown as Record<string, string>,
			);

			const path = `/bot-conversations/${botConversationId}/messages?${searchParams.toString()}`;

			const res =
				await clientAPI_V1.get<GetBotConversationMessagesPageResponse>(path);

			return res.data;
		},

		"notebook-by-id": async (notebookId: NotebookId) => {
			if (!isValidNumber(notebookId)) {
				throw new Error("projectIdOrUuid is undefined.");
			}

			const start = performance.now();

			const res = await clientAPI_V1.get<FetchNotebookResponse>(
				`/projects/${notebookId}`,
			);

			console.log(
				`useFetchNotebook(notebookId = ${notebookId}) took ${performance.now() - start}ms`,
			);

			return res.data;
		},

		"notebook-list-page": async (
			pageParam: FetchNotebookListPageParams,
			organizationId: OrganizationId,
		) => {
			const objForUrlSearchParams: typeof pageParam = {
				...pageParam,
			};

			for (const key in objForUrlSearchParams) {
				// @ts-expect-error => ignore
				const value = objForUrlSearchParams[key]!;

				if (value === null || value === undefined) {
					Reflect.deleteProperty(objForUrlSearchParams, key);
				}
			}

			const queryParamsString = new URLSearchParams(
				objForUrlSearchParams as unknown as Record<string, string>,
			).toString();

			const res = await clientAPI_V1.get<FetchNotebookListPageResponse>(
				`/organizations/${organizationId}/projects?${queryParamsString}`,
			);

			return res.data;
		},

		"bot-conversation": async (botConversationId: BotConversationId) => {
			const path = `/bot-conversations/${botConversationId}`;

			const res = await clientAPI_V1.get<GetBotConversationByIdResponse>(path);

			return res.data;
		},

		"betterbrain-user": async () => {
			const res = await clientAPI_V1.get<FetchBetterbrainUserResponse>("/user");

			const user = res.data;

			return user;
		},

		settings: async (
			organizationId: OrganizationId,
			notebookId: NotebookId | undefined,
		) => {
			const path = `/organizations/${organizationId}/settings${
				isValidNumber(notebookId) ? `?project_id=${notebookId}` : ""
			}`;

			const res = await clientAPI_V1.get<SettingsReturnType>(path);

			return res.data;
		},

		// 		"aws-image": async (aws_bucket: string, aws_key: string) => {
		// 			if (
		// 				!aws_bucket ||
		// 				!aws_key ||
		// 				aws_bucket === "undefined" ||
		// 				aws_key === "undefined"
		// 			) {
		// 				throw new Error("aws_bucket and aws_key query params are required.");
		// 			}
		//
		// 			const response = await clientToApiForServerToServerRequests.get<string>(
		// 				`get-aws-file-as-binary-string?aws_bucket=${aws_bucket}&aws_key=${aws_key}`,
		// 			);
		//
		// 			if (response.status !== 200) {
		// 				throw new Error("Error fetching AWS image!");
		// 			}
		//
		// 			const imageType = aws_key.split(".").at(-1);
		//
		// 			return `data:image/${imageType};base64,${response.data}`;
		// 		},

		"pdf-file-by-id": async (pdfFileId: FileId | PdfId | undefined) => {
			try {
				const presignedUrlResponse =
					await clientAPI_V1.get<GetPresignedUrlByFileIdResponse>(
						`/files/${pdfFileId}`,
					);

				if (presignedUrlResponse.status !== 200) {
					throw new Error("Failed to fetch presigned URL");
				}

				const presigned_url = presignedUrlResponse.data.presigned_url;

				const fileResponse = await axios.get(presigned_url, {
					responseType: "arraybuffer",
				});

				if (fileResponse.status !== 200) {
					throw new Error("Failed to fetch file");
				}

				const blob = new Blob([fileResponse.data], {
					type: MimeType.Pdf,
				});
				const fileUrl = URL.createObjectURL(blob);

				return { fileUrl, fileName: presignedUrlResponse.data.file_name };
			} catch (error) {
				console.log("Error fetching pdf:", error);

				toast({
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
					title: "Error fetching PDF file",
				});

				throw error;
			}
		},

		"organization-tag-list": async (organizationId: OrganizationId) => {
			const path = `/organizations/${organizationId}/tags`;

			const res = await clientAPI_V1.get<FetchTagsResponse>(path);

			return res.data.results;
		},
	},

	post: {
		"create-batch-table": async (
			organizationId: OrganizationId,
			body: PostBatchTableMetadataRequest,
		) => {
			const res = await clientAPI_V1.post<
				PostBatchTableMetadataRequest,
				AxiosResponse<PostBatchTableMetadataResponse>
			>(`/organizations/${organizationId}/batch-tables`, body);

			return res.data;
		},
	},

	put: {
		"edit-batch-table-metadata": async (
			batchTableId: BatchTableId,
			organizationId: OrganizationId,
			body: PutBatchTableMetadataRequest,
		) => {
			if (!isValidNumber(batchTableId)) {
				throw new Error("No batch table selected!", {
					cause: `Expected a valid number for "batchTableId" but got: "${batchTableId}"`,
				});
			}

			if (!isValidNumber(organizationId)) {
				throw new Error("No organization selected!", {
					cause: `Expected a valid number for "organizationId" but got: "${organizationId}"`,
				});
			}

			const path = `/organizations/${organizationId}/batch-tables/${batchTableId}`;

			const res = await clientAPI_V1.put<
				PutBatchTableMetadataRequest,
				AxiosResponse<PutBatchTableMetadataResponse>
			>(path, body);

			return res.data;
		},
	},
};
