import type {
	BatchTableColumn,
	BatchTableEntitySuggestion,
} from "#/types/batch-table";

export enum HowToAddData {
	Concat = "Concat",
	Merge = "Merge",
}

export type SelectedColumnToAdd = {
	label: string;
	value: string;
	name: string;
	id: string;
};

export type ExistingColumn = { name: string; id: number };
type NameOfNewColumn = string;

export type Options = {
	parsedCSVAsRows: Array<Record<string, string | number>>;
	columnsToJoin: Array<[ExistingColumn, NameOfNewColumn]>;
	columnsToMap: Array<[ExistingColumn, NameOfNewColumn]>;
	columnsToAdd: Array<SelectedColumnToAdd>;
	howToAddData: HowToAddData;
	caseSensitive: boolean;
	file: File | null;
};

export const DEFAULT_COLUMNS_TO_JOIN_OR_MAP: Options["columnsToJoin"] = [
	[{ id: NaN, name: "" } as const, ""] as const,
] as const;

export const DEFAULT_OPTIONS: Options = {
	columnsToJoin: DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
	columnsToMap: DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
	howToAddData: HowToAddData.Concat,
	caseSensitive: false,
	parsedCSVAsRows: [],
	columnsToAdd: [],
	file: null,
};

export type DataToAddToColumn = {
	entitySuggestions?: Array<BatchTableEntitySuggestion>;
	columnToAddDataTo: BatchTableColumn | null;
	bulkAdd: Array<string> | undefined;
};
