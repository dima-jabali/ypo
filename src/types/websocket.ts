import type { EmptyObject, Tagged } from "type-fest";

import type { PatchProjectResponse } from "#/hooks/mutation/use-patch-notebook-blocks";
import type {
	BatchTableId,
	FileId,
	ISODateString,
	NotebookId,
	UUID,
} from "./general";
import type {
	BetterbrainUser,
	IndexingFileStep,
	NotebookBlockUuid,
	SimilarQuery,
} from "./notebook";
import type {
	TriggerAutocompleteRequestData,
	TriggerAutocompleteResponseData,
} from "./auto-suggestion";

export enum WebsocketAction {
	UnsubscribeBotConversation = "UNSUBSCRIBE_BOT_CONVERSATION",
	SubscribeBotConversation = "SUBSCRIBE_BOT_CONVERSATION",
	UnsubscribeBatchTableInputs = "UNSUBSCRIBE_BATCH_TABLE",
	SubscribeBatchTableInputs = "SUBSCRIBE_BATCH_TABLE",
	UnsubscribeProject = "UNSUBSCRIBE_PROJECT",
	UnsubscribeFileInputs = "UNSUBSCRIBE_FILE",
	StopStreamingGeneration = "STOP_STREAM",
	SubscribeProject = "SUBSCRIBE_PROJECT",
	SubscribeFileInputs = "SUBSCRIBE_FILE",
	SqlAutocomplete = "SQL_AUTOCOMPLETE",
	CheckAuth = "CHECK_AUTH",
	Auth = "AUTH",
}

export enum WebsocketEvent {
	UnsubscribeBotConversationResponse = "UNSUBSCRIBE_BOT_CONVERSATION_RESPONSE",
	SubscribeBotConversationResponse = "SUBSCRIBE_BOT_CONVERSATION_RESPONSE",
	UnsubscribeBatchTableOutputs = "UNSUBSCRIBE_BATCH_TABLE_RESPONSE",
	SubscribeBatchTableOutputs = "SUBSCRIBE_BATCH_TABLE_RESPONSE",
	UnsubscribeProjectResponse = "UNSUBSCRIBE_PROJECT_RESPONSE",
	PatchBatchTableWSMessage = "PATCH_BATCH_TABLE_RESPONSE",
	SubscribeProjectResponse = "SUBSCRIBE_PROJECT_RESPONSE",
	UnsubscribeFileResponse = "UNSUBSCRIBE_FILE_RESPONSE",
	SqlAutocompleteResponse = "SQL_AUTOCOMPLETE_RESPONSE",
	PDFIndexingProgressV2 = "PDF_INDEXING_PROGRESS_V2",
	SubscribeFileResponse = "SUBSCRIBE_FILE_RESPONSE",
	PatchProjectResponse = "PATCH_PROJECT_RESPONSE",
	CheckAuthResponse = "CHECK_AUTH_RESPONSE",
	UpdateBotSource = "UPDATE_BOT_SOURCE",
	RelevantQueries = "RELEVANT_QUERIES",
	StatusMessage = "STATUS_MESSAGE",
	AuthResponse = "AUTH_RESPONSE",
}

export type AuthActionData = {
	api_key?: string;
	auth_token?: string;
	token?: string;
};

export type SubscribeNotebookActionData = {
	project_id: NotebookId;
};

export type UnsubscribeNotebookActionData = {
	project_id: NotebookId;
};

export type SubscribeConversationActionData = {
	bot_conversation_id: number;
};

export type UnsubscribeConversationActionData = {
	bot_conversation_id: number;
};

export type UnsubscribeFileActionData = {
	file_id: FileId;
};

export type SubscribeFileActionData = {
	file_id: FileId;
};

export type StopStreamingGenerationActionData = {
	stream_uuid: string;
};

export type RequestId = Tagged<string, "RequestId">;

type WebSocketMessagePayload<
	TData,
	TType extends WebsocketAction | WebsocketEvent,
> = {
	message_payload: TData;
	message_type: TType;
};
type WebSocketMessageBase = {
	timestamp: ISODateString;
	request_id: RequestId;
	tab_id: UUID;
};
type WebSocketMessage<
	TData,
	TType extends WebsocketAction | WebsocketEvent,
> = WebSocketMessagePayload<TData, TType> & WebSocketMessageBase;
type WebSocketMessageFromPayload<TPayload extends Record<string, unknown>> =
	TPayload & WebSocketMessageBase;

export type WebSocketCheckAuthPayload = WebSocketMessagePayload<
	EmptyObject,
	WebsocketAction.CheckAuth
>;
export type WebSocketCheckAuthAction =
	WebSocketMessageFromPayload<WebSocketCheckAuthPayload>;

export type WebSocketSubscribeBatchTableInputsPayload = WebSocketMessagePayload<
	{ batch_table_id: number },
	WebsocketAction.SubscribeBatchTableInputs
>;
export type WebSocketSubscribeBatchTableInputsAction =
	WebSocketMessageFromPayload<WebSocketSubscribeBatchTableInputsPayload>;

export type WebSocketUnsubscribeBatchTableInputsPayload =
	WebSocketMessagePayload<
		{ batch_table_id: number },
		WebsocketAction.UnsubscribeBatchTableInputs
	>;
export type WebSocketUnsubscribeBatchTableInputsAction =
	WebSocketMessageFromPayload<WebSocketUnsubscribeBatchTableInputsPayload>;

export type WebSocketAuthPayload = WebSocketMessagePayload<
	AuthActionData,
	WebsocketAction.Auth
>;
export type WebSocketAuthAction =
	WebSocketMessageFromPayload<WebSocketAuthPayload>;

export type WebSocketAutocompletePayload = WebSocketMessagePayload<
	TriggerAutocompleteRequestData,
	WebsocketAction.SqlAutocomplete
>;
export type WebSocketSqlAutocompleteAction =
	WebSocketMessageFromPayload<WebSocketAutocompletePayload>;

export type WebSocketSubscribeProjectPayload = WebSocketMessagePayload<
	SubscribeNotebookActionData,
	WebsocketAction.SubscribeProject
>;
export type WebSocketSubscribeProjectAction =
	WebSocketMessageFromPayload<WebSocketSubscribeProjectPayload>;

export type WebSocketUnsubscribeProjectPayload = WebSocketMessagePayload<
	UnsubscribeNotebookActionData,
	WebsocketAction.UnsubscribeProject
>;
export type WebSocketUnsubscribeProjectAction =
	WebSocketMessageFromPayload<WebSocketUnsubscribeProjectPayload>;

export type WebSocketSubscribeConversationPayload = WebSocketMessagePayload<
	SubscribeConversationActionData,
	WebsocketAction.SubscribeBotConversation
>;
export type WebSocketSubscribeConversationAction =
	WebSocketMessageFromPayload<WebSocketSubscribeConversationPayload>;

export type WebSocketUnsubscribeConversationPayload = WebSocketMessagePayload<
	UnsubscribeConversationActionData,
	WebsocketAction.UnsubscribeBotConversation
>;
export type WebSocketUnsubscribeConversationAction =
	WebSocketMessageFromPayload<WebSocketUnsubscribeConversationPayload>;

export type WebSocketUnsubscribeFilePayload = WebSocketMessagePayload<
	UnsubscribeFileActionData,
	WebsocketAction.UnsubscribeFileInputs
>;
export type WebSocketUnsubscribeFileAction =
	WebSocketMessageFromPayload<WebSocketUnsubscribeFilePayload>;

export type WebSocketSubscribeFilePayload = WebSocketMessagePayload<
	SubscribeFileActionData,
	WebsocketAction.SubscribeFileInputs
>;
export type WebSocketSubscribeFileAction =
	WebSocketMessageFromPayload<WebSocketSubscribeFilePayload>;

export type WebSocketStopGenerationPayload = WebSocketMessagePayload<
	StopStreamingGenerationActionData,
	WebsocketAction.StopStreamingGeneration
>;
export type WebSocketStopStreamingGenerationAction =
	WebSocketMessageFromPayload<WebSocketStopGenerationPayload>;

export type WebSocketActionPayload =
	| WebSocketUnsubscribeBatchTableInputsPayload
	| WebSocketSubscribeBatchTableInputsPayload
	| WebSocketUnsubscribeConversationPayload
	| WebSocketSubscribeConversationPayload
	| WebSocketUnsubscribeProjectPayload
	| WebSocketSubscribeProjectPayload
	| WebSocketUnsubscribeFilePayload
	| WebSocketStopGenerationPayload
	| WebSocketSubscribeFilePayload
	| WebSocketAutocompletePayload
	| WebSocketCheckAuthPayload
	| WebSocketAuthPayload;
export type WebSocketActionData =
	| WebSocketUnsubscribeBatchTableInputsAction
	| WebSocketSubscribeBatchTableInputsAction
	| WebSocketUnsubscribeConversationAction
	| WebSocketStopStreamingGenerationAction
	| WebSocketSubscribeConversationAction
	| WebSocketUnsubscribeProjectAction
	| WebSocketSubscribeProjectAction
	| WebSocketUnsubscribeFileAction
	| WebSocketSqlAutocompleteAction
	| WebSocketSubscribeFileAction
	| WebSocketCheckAuthAction
	| WebSocketAuthAction;

export type CheckAuthResponseData = {
	is_authenticated?: boolean;
	is_authorized?: boolean;
};
export type WebSocketCheckAuthResponse = WebSocketMessage<
	CheckAuthResponseData,
	WebsocketEvent.CheckAuthResponse
>;

export enum WebSocketAuthStatus {
	Success = "success",
}
export type AuthResponseData = {
	status: WebSocketAuthStatus;
	error: string | null;
};

export type WebSocketAuthResponse = WebSocketMessage<
	AuthResponseData,
	WebsocketEvent.AuthResponse
>;

export type WebSocketSQLAutocompleteResponse = WebSocketMessage<
	TriggerAutocompleteResponseData,
	WebsocketEvent.SqlAutocompleteResponse
>;

type WebSocketStatusMessageResponse = WebSocketMessage<
	EmptyObject,
	WebsocketEvent.StatusMessage
>;

type WebSocketSubscribeBatchTableOutputsResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.SubscribeBatchTableOutputs
>;

type WebSocketUnsubscribeFileResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.UnsubscribeFileResponse
>;

type WebSocketSubscribeFileResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.SubscribeFileResponse
>;

export type WebSocketPatchResponse = WebSocketMessage<
	PatchProjectResponse,
	WebsocketEvent.PatchProjectResponse
>;

export type WebSocketSubscribeResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.SubscribeProjectResponse
>;
export type WebSocketUnsubscribeResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.UnsubscribeProjectResponse
>;

export type WebSocketSubscribeConversationResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.SubscribeBotConversationResponse
>;
export type WebSocketUnsubscribeConversationResponse = WebSocketMessage<
	{ status: WebSocketAuthStatus; error: string | null },
	WebsocketEvent.UnsubscribeBotConversationResponse
>;

export type WebSocketPDFIndexingProgressV2WSResponse = WebSocketMessage<
	{
		overall_progress_percent: number;
		indexing_step: IndexingFileStep;
		file_id: FileId;
	},
	WebsocketEvent.PDFIndexingProgressV2
>;

export type WebSocketVerifyQueryResponse = WebSocketMessage<
	{
		block_uuid: NotebookBlockUuid;
		queries: SimilarQuery[];
		project_id: NotebookId;
		user: BetterbrainUser;
	},
	WebsocketEvent.RelevantQueries
>;


export type WebSocketUpdateBotSourceResponse = WebSocketMessage<
	{
		organization_id: number;
		user: BetterbrainUser;
		source_id: number;
	},
	WebsocketEvent.UpdateBotSource
>;

export type WebSocketEventData =
	| WebSocketSubscribeBatchTableOutputsResponse
	| WebSocketUnsubscribeConversationResponse
	| WebSocketPDFIndexingProgressV2WSResponse
	| WebSocketSubscribeConversationResponse
	| WebSocketSQLAutocompleteResponse
	| WebSocketUnsubscribeFileResponse
	| WebSocketUpdateBotSourceResponse
	| WebSocketStatusMessageResponse
	| WebSocketSubscribeFileResponse
	| WebSocketUnsubscribeResponse
	| WebSocketVerifyQueryResponse
	| WebSocketCheckAuthResponse
	| WebSocketSubscribeResponse
	| WebSocketPatchResponse
	| WebSocketAuthResponse;
