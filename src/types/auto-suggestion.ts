export enum SuggestionType {
	DATABASE = "DATABASE",
	SCHEMATA = "SCHEMATA",
	KEYWORD = "KEYWORD",
	TABLE = "TABLE",
	FIELD = "FIELD",
}
type DatabaseSuggestion = {
	database_name: string;
};
type SchemataSuggestion = {
	schemata_name: string;
	database_name: string;
};
type KeywordSuggestion = {
	keyword: string;
};
type TableSuggestion = {
	database_name: string;
	schemata_name: string;
	table_name: string;
};
type FieldSuggestion = {
	database_name: string;
	schemata_name: string;
	table_name: string;
	field_name: string;
};
type SuggestionKind<Kind extends SuggestionType> =
	Kind extends SuggestionType.DATABASE
		? DatabaseSuggestion
		: Kind extends SuggestionType.SCHEMATA
			? SchemataSuggestion
			: Kind extends SuggestionType.KEYWORD
				? KeywordSuggestion
				: Kind extends SuggestionType.TABLE
					? TableSuggestion
					: Kind extends SuggestionType.FIELD
						? FieldSuggestion
						: never;

export type Suggestion<Kind extends SuggestionType = SuggestionType> = {
	suggestion: SuggestionKind<Kind>;
	suggestion_type: Kind;
};

export type TriggerAutocompleteRequestData = {
	editor_model_id: string;
	connection_type: string;
	connection_id: number;
	block_uuid: string;
	project_id: number;
	sql: string;
};

export type TriggerAutocompleteResponseData = {
	suggestions: Suggestion[];
	editor_model_id: string;
	is_column?: boolean;
	is_table?: boolean;
	project_id: number;
	block_uuid: string;
};
