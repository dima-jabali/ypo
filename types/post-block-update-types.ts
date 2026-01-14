import type { EmptyObject } from "type-fest";

import type { PaginateDataframeOutput } from "#/hooks/mutation/use-paginate-dataframe";
import type {
	BotConversationMessage,
	BotConversationMessageUuid,
	Plan,
	PlanStep,
} from "./chat";
import type { ISODateString, StreamUuid, UUID } from "./general";
import type {
	BetterbrainUser,
	NotebookBlock,
	NotebookBlockUuid,
} from "./notebook";
import type { DatabaseConnectionType } from "./databases";

export enum PostBlockActionType {
	PdfGeneratePresignedUploadUrl = "PDF_GENERATE_PRESIGNED_UPLOAD_URL",
	GeneratePresignedUploadUrl = "GENERATE_PRESIGNED_UPLOAD_URL",
	StopQueryGeneration = "STOP_QUERY_GENERATION",
	GenerateDescription = "GENERATE_DESCRIPTION",
	StopCodeGeneration = "STOP_CODE_GENERATION",
	EditResultVariable = "EDIT_RESULT_VARIABLE",
	AnswerPdfQuestion = "ANSWER_PDF_QUESTION",
	PaginateDataframe = "PAGINATE_DATAFRAME",
	RunPythonBlock = "RUN_PYTHON_BLOCK",
	RunChartBlock = "RUN_CHART_BLOCK",
	RunTableBlock = "RUN_TABLE_BLOCK",
	UnverifyQuery = "UNVERIFY_QUERY",
	FixPython = "AUTO_FIX_PYTHON",
	RunCsvBlock = "RUN_CSV_BLOCK",
	RunSqlBlock = "RUN_SQL_BLOCK",
	UpdateBlock = "UPDATE_BLOCK",
	WritePython = "WRITE_PYTHON",
	VerifyQuery = "VERIFY_QUERY",
	DownloadCsv = "DOWNLOAD_CSV",
	DownloadSql = "DOWNLOAD_SQL",
	FixSql = "AUTO_FIX_SQL",
	IndexPDF = "INDEX_PDF",
	WriteSql = "WRITE_SQL",
}

export enum PostBlockActionWithoutTimestampType {
	FixPython = "AUTO_FIX_PYTHON",
	WritePython = "WRITE_PYTHON",
	FixSql = "AUTO_FIX_SQL",
	WriteSql = "WRITE_SQL",
}

export type WriteSqlActionInfo = {
	old_query: string;
	prompt: string;
};

export type WriteSqlAction = {
	action_type: PostBlockActionType.WriteSql;
	action_info: WriteSqlActionInfo;
};

export type WritePythonActionInfo = {
	old_code: string;
	prompt: string;
};

export type WritePythonAction = {
	action_type: PostBlockActionType.WritePython;
	action_info: WritePythonActionInfo;
};

export type TextItem = {
	text: string;
};
// TODO: not fully sure about this, shouldn't this be the same as
// patch project update block?
export type PostBlockUpdateBlockActionInfo = {
	value: string | { rich_text: TextItem[] };
	block_uuid: string;
	key: string;
};

export type PostBlockUpdateBlockAction = {
	action_type: PostBlockActionType.UpdateBlock;
	action_info: PostBlockUpdateBlockActionInfo;
};

export type EditResultVariableActionInfo = {
	new_name: string;
	old_name: string;
};

export type EditResultVariableAction = {
	action_type: PostBlockActionType.EditResultVariable;
	action_info: EditResultVariableActionInfo;
};

export type PostBlockActionWithTimestamp =
	// | EditResultVariableAction
	// | VerifyQueryAction
	// | DownloadCsvAction
	// | DownloadSqlAction
	// | UnverifyQueryAction
	// | PaginateDataFrameAction
	// | GenerateDescriptionAction
	| WriteSqlAction
	// | RunCsvBlockAction
	// | RunPythonBlockAction
	| WritePythonAction
	| PostBlockUpdateBlockAction;
// | GeneratePresignedUploadUrlAction
// | PdfGeneratePresignedUploadUrlAction
// | AnswerPdfQuestionAction
// | IndexPDFAction
// | RunCsvBlockAction;

export enum ResponseProjectActionType {
	// BotConversationMessage:
	CreateBotConversationMessage = "CREATE_BOT_CONVERSATION_MESSAGE",
	DeleteBotConversationMessage = "DELETE_BOT_CONVERSATION_MESSAGE",
	UpdateBotConversationMessage = "UPDATE_BOT_CONVERSATION_MESSAGE",
	UpdateBotConversation = "UPDATE_BOT_CONVERSATION",
	CreatePlanStep = "CREATE_PLAN_STEP",
	UpdatePlanStep = "UPDATE_PLAN_STEP",
	UpdatePlan = "UPDATE_PLAN",
	CreatePlan = "CREATE_PLAN",
	// Project:
	UpdateProject = "UPDATE_PROJECT",
	// Block:
	CreateBlock = "CREATE_BLOCK",
	UpdateBlock = "UPDATE_BLOCK",
	DeleteBlock = "DELETE_BLOCK",
}

export type CreateBotConversationMessageResponseAction = {
	action_type: ResponseProjectActionType.CreateBotConversationMessage;
	action_payload: {
		bot_conversation_message: BotConversationMessage;
	};
};

export type DeleteBotConversationMessageResponseAction = {
	action_type: ResponseProjectActionType.DeleteBotConversationMessage;
	action_payload: {
		message_uuid: BotConversationMessageUuid;
	};
};

export type CreatePlanStep = {
	action_type: ResponseProjectActionType.CreatePlanStep;
	action_payload: {
		plan_step: PlanStep;
	};
};

export type CreatePlan = {
	action_type: ResponseProjectActionType.CreatePlan;
	action_payload: {
		plan: Plan;
	};
};

export type UpdatePlanStep = {
	action_type: ResponseProjectActionType.UpdatePlanStep;
	action_payload: {
		value: string | Record<string, unknown> | unknown[] | number | boolean;
		plan_step_id: number;
		key: string[];
	};
};

export type UpdatePlan = {
	action_type: ResponseProjectActionType.UpdatePlan;
	action_payload: {
		value: string | Record<string, unknown> | unknown[] | number | boolean;
		plan_step_id: number;
		key: string[];
	};
};

export type UpdateBotConversationAction = {
	action_type: ResponseProjectActionType.UpdateBotConversation;
	action_payload: {
		value: boolean;
		key: string[];
		id: number;
	};
};

export type UpdateActionValue<T = unknown> =
	| { is_incremental_string_change?: false | null; value: T }
	| {
			is_incremental_string_change: true;
			value: string;
	  };

export type UpdateBotConversationMessageResponseAction = {
	action_type: ResponseProjectActionType.UpdateBotConversationMessage;
	action_payload: {
		message_uuid: BotConversationMessageUuid;
		stream_uuid: StreamUuid;
		key: string[];
	} & UpdateActionValue<
		string | Record<string, string> | unknown[] | number | boolean
	>;
};

export type UpdateProjectResponseAction = {
	action_type: ResponseProjectActionType.UpdateProject;
	action_payload: {
		project_uuid: string;
		key: string[];
	} & UpdateActionValue;
	timestamp: string;
};

export type CreateBlockResponseAction = {
	action_type: ResponseProjectActionType.CreateBlock;
	action_payload: {
		block: NotebookBlock;
	};
};

export type DeleteBlockResponseAction = {
	action_type: ResponseProjectActionType.DeleteBlock;
	action_payload: {
		block_uuid: NotebookBlockUuid;
	};
};

export type UpdateBlockResponseAction<T = unknown> = {
	action_type: ResponseProjectActionType.UpdateBlock;
	action_payload: {
		block_uuid: NotebookBlockUuid;
		backend_overrides?: true;
		stream_uuid?: string;
		key: string[];
	} & UpdateActionValue<T>;
	timestamp: string;
};

export type PatchProjectResponseAction =
	// BotConversation:
	| CreateBotConversationMessageResponseAction
	| DeleteBotConversationMessageResponseAction
	| UpdateBotConversationMessageResponseAction
	| UpdateBotConversationAction
	| CreatePlanStep
	| UpdatePlanStep
	| CreatePlan
	| UpdatePlan
	// Project:
	| UpdateProjectResponseAction
	// Block:
	| CreateBlockResponseAction
	| DeleteBlockResponseAction
	| UpdateBlockResponseAction;

export type BasePostBlockActionOutput = {
	notebook_updates?: PatchProjectResponseAction[];
	error?: string | null;
	sources?: unknown[];
	answer?: string;
};
export type PostBlockResponse<T> = {
	action_output: BasePostBlockActionOutput & T;
	timestamp: ISODateString;
};

export type GenerateSqlDescriptionResponse = PostBlockResponse<{
	description: string;
}>;

export type QuerySqlResponse = PostBlockResponse<{ query: Query }>;
export type WriteSqlResponse = PostBlockResponse<{
	sql: string;
	error: string;
	completion_error: string;
}>;

export enum CollectionIDTypes {
	python_code = "python_code",
	sql_query = "sql_query",
}

export enum AnswerType {
	SqlQuery = "SQL_QUERY",
}

type QueryNote = {
	collaborators: BetterbrainUser[];
	created_by: BetterbrainUser;
	created_at: ISODateString;
	updated_at: ISODateString;
	text: string;
	query: Query;
	id: number;
};

export enum QuerySource {
	METABASE = "METABASE",
	SELF = "SELF",
}

export enum QueryEntityType {
	MODE_DEFINITION = "MODE_DEFINITION",
	ROOT_DATA_SCHEMA = "DATA_SCHEMA",
	METABASE_CARD = "METABASE_CARD",
	MODE_QUERY = "MODE_QUERY",
	SQL_QUERY = "SQL_QUERY",
}

export type Query = {
	id: number;
	query_uuid: UUID;
	connection_type: DatabaseConnectionType;
	collection_id: CollectionIDTypes;
	prompt: string;
	answer_type: AnswerType;
	answer: string;
	user: BetterbrainUser;
	connection_id: number;
	stored_in_milvus: boolean;
	should_be_indexed: boolean;
	verified: boolean;
	generator: Generator;
	updated_at: string;
	created_at: string;
	project_id: string;
	/* If this is null, means the block no longer exists! */
	block_uuid: UUID | null;
	/* If this is null, means the project no longer exists! */
	project_uuid: UUID | null;
	title?: string;
	verified_by: BetterbrainUser | null;
	favorited: boolean;
	notes: QueryNote[];
	source: QuerySource;
	entity_type: QueryEntityType;
	tags?: string[];
};

export type RunTableBlockResponse<T = unknown> = PostBlockResponse<
	PaginateDataframeOutput<T>
>;

export type WritePythonResponse = PostBlockResponse<{
	code: string;
	notes: string[];
}>;

export type GeneratePresignedUploadURLResponse = PostBlockResponse<{
	upload_url: string;
}>;

export type IndexPdfResponse = PostBlockResponse<EmptyObject>;

export type PostBlockActionResponse =
	| GenerateSqlDescriptionResponse
	| WriteSqlResponse
	// | RunSqlResponse
	// | PaginateDataframeResponse
	| GeneratePresignedUploadURLResponse
	// | RunCsvBlockResponse
	// | RunPythonResponse
	| WritePythonResponse;
