import type { FilterOperator } from "#/components/Tables/TableMaker/filters/utilityTypes";
import type {
	BatchTableColumnChildFilter,
	BatchTableColumnId,
	BatchTableConditionalExecutionFilterGroup,
} from "#/types/batch-table";

export type ChildFilter = {
	value_operator: ColumnOptionsValueOperator;
	column_id: BatchTableColumnId | undefined;
	caseSensitive: boolean;
	parent: FilterGroup;
	value: unknown;
};

export type FilterGroup = {
	children: Array<ChildFilter | FilterGroup>;
	parent: FilterGroup | undefined;
	filter_operator: FilterOperator;
};

export type Filter = ChildFilter | FilterGroup;

export type SerializedFilterGroup = BatchTableConditionalExecutionFilterGroup;
export type SerializedChildFilter = BatchTableColumnChildFilter;

export type SerializedFilter = SerializedChildFilter | SerializedFilterGroup;

export type EntriesOfFilter = [
	keyof FilterGroup | keyof ChildFilter,
	FilterGroup[keyof FilterGroup] | ChildFilter[keyof ChildFilter],
][];

export enum ColumnOptionsValueOperator {
	GREATER_OR_EQUAL_THAN = "GREATER_OR_EQUAL_THAN",
	LESS_OR_EQUAL_THAN = "LESS_OR_EQUAL_THAN",
	DOES_NOT_CONTAIN = "DOES_NOT_CONTAIN",
	DOES_NOT_EQUAL = "DOES_NOT_EQUAL",
	IS_NOT_EMPTY = "IS_NOT_EMPTY",
	GREATER_THAN = "GREATER_THAN",
	STARTS_WITH = "STARTS_WITH",
	ENDS_WITH = "ENDS_WITH",
	LESS_THAN = "LESS_THAN",
	CONTAINS = "CONTAINS",
	IS_EMPTY = "IS_EMPTY",
	EQUALS = "EQUALS",
}

export const COLUMN_OPTIONS_VALUE_OPERATORS = Object.values(
	ColumnOptionsValueOperator,
);
