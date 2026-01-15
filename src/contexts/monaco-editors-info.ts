"use client";
import type {
	IRange,
	languages,
	editor as MonacoEditorType,
} from "monaco-editor";

import type { TriggerAutocompleteResponseData } from "#/types/auto-suggestion";
import type { BotConversationId, NotebookId } from "#/types/general";
import type { NotebookBlockUuid } from "#/types/notebook";
import type { DatabaseConnectionType } from "#/types/databases";

export type MonacoEditorModelId = string;
type BlockUUID = string;

export type MonacoEditorInfo = {
	lastCursorPosition: {
		lineNumber: number;
		column: number;
	} | null;
	serverSuggestionsResponse: TriggerAutocompleteResponseData | null;
	monacoEditor: MonacoEditorType.IStandaloneCodeEditor | null;
	botConversationId: BotConversationId | undefined | null;
	suggestions: languages.CompletionList["suggestions"];
	shouldShowTheSamePreviousAutocomplete: boolean;
	connection_type: DatabaseConnectionType;
	websocketRoundwayTripStartTime: number;
	block_uuid: NotebookBlockUuid;
	project_id: NotebookId;
	connection_id: number;
	range: IRange | null;
	lastWord: string;
	sql: string;
};

type MonacoEditorsInfoStorage = Map<
	MonacoEditorModelId | BlockUUID,
	MonacoEditorInfo
>;

export const allEditorsInfo: MonacoEditorsInfoStorage = new Map();
