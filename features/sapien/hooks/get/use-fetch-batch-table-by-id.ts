import { type GridColumn, type Theme } from "@glideapps/glide-data-grid";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
	generalContextStore,
	useWithBatchTableId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { identity } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import {
	AIFillStatus,
	BatchTableMetadataColumnType,
	type BatchTable,
	type BatchTableCell,
	type BatchTableColumn,
	type BatchTableColumnIndex,
	type BatchTableEntitySuggestion,
	type BatchTableRow,
	type BatchTableRowIndex,
	type CellCoords,
} from "#/types/batch-table";
import {
	DEFAULT_CELL_WIDTH,
	DEFAULT_EXCEL_COLUMNS_NUMBER,
	DEFAULT_EXCEL_ROWS_NUMBER,
} from "../../components/canvas-table/utils";

export type NormalizedBatchTable = Omit<
	BatchTable,
	"columns" | "cells" | "rows"
> & {
	columns: Map<BatchTableColumnIndex, BatchTableColumn>;
	rows: Map<BatchTableRowIndex, BatchTableRow>;
	cells: Map<CellCoords, BatchTableCell>;

	lastDefinedColumnIndex: BatchTableColumnIndex;
	lastDefinedRowIndex: BatchTableRowIndex;
	columnsWidthAccumulation: Array<number>;
	rowsHeightAccumulation: Array<number>;
	columnsLength: number;
	rowsLength: number;
};

export type GetBatchTableByIdResponse = NormalizedBatchTable;

export function useFetchBatchTableById<
	SelectedData = GetBatchTableByIdResponse,
>(
	select: (data: GetBatchTableByIdResponse) => SelectedData = identity<
		GetBatchTableByIdResponse,
		SelectedData
	>,
) {
	const organizationId = useWithOrganizationId();
	const batchTableId = useWithBatchTableId();

	const queryOptions = useMemo(() => {
		const queryOptions = queryKeyFactory.get["batch-table"](
			organizationId,
			batchTableId,
		);

		const originalQueryFn = queryOptions.queryFn;
		queryOptions.queryFn = async (args) => {
			const normalizedBatchTable = await originalQueryFn(args);

			console.log("Setting last server batch table...");

			generalContextStore
				.getState()
				.lastServerBatchTables.set(
					`${batchTableId}-${organizationId}`,
					normalizedBatchTable,
				);

			return normalizedBatchTable;
		};

		return queryOptions;
	}, [organizationId, batchTableId]);

	return useSuspenseQuery({
		...queryOptions,
		staleTime: Infinity,
		gcTime: Infinity,
		select,
	}).data;
}

const selectSapienOrgId = (data: GetBatchTableByIdResponse) =>
	data.organization?.id;
export function useDownloadedSapienOrganizationId() {
	return useFetchBatchTableById(selectSapienOrgId);
}

export function useBatchTableColumnByIndex(columnIndex: BatchTableColumnIndex) {
	const select = useCallback(
		(data: GetBatchTableByIdResponse) => {
			return data.columns.get(columnIndex);
		},
		[columnIndex],
	);

	return useFetchBatchTableById(select);
}

function selectColumnsArray(data: GetBatchTableByIdResponse) {
	return [...data.columns.values()];
}
export function useBatchTableColumnsArray() {
	return useFetchBatchTableById(selectColumnsArray);
}

function selectColumns(data: GetBatchTableByIdResponse) {
	return data.columns;
}
export function useBatchTableColumns() {
	return useFetchBatchTableById(selectColumns);
}

function selectSortedColumnsArray(data: GetBatchTableByIdResponse) {
	return [...data.columns.values()].sort(
		(a, b) => a.column_index - b.column_index,
	);
}
export function useSortedBatchTableColumns() {
	return useFetchBatchTableById(selectSortedColumnsArray);
}

function selectSortedRowsArray(data: GetBatchTableByIdResponse) {
	return [...data.rows.values()].sort((a, b) => a.row_index - b.row_index);
}
export function useSortedRows() {
	return useFetchBatchTableById(selectSortedRowsArray);
}

function selectIsTableEmpty(data: GetBatchTableByIdResponse) {
	return data.columns.size === 0;
}
export function useIsTableEmpty() {
	return useFetchBatchTableById(selectIsTableEmpty);
}

function selectColumnsCount(data: GetBatchTableByIdResponse) {
	return Math.max(
		data.columns.size,
		DEFAULT_EXCEL_COLUMNS_NUMBER,
	) as BatchTableColumnIndex;
}
export function useColumnsCount() {
	return useFetchBatchTableById(selectColumnsCount);
}

function selectRowsCount(data: GetBatchTableByIdResponse) {
	return Math.max(
		data.rows.size,
		DEFAULT_EXCEL_ROWS_NUMBER,
	) as BatchTableRowIndex;
}
export function useRowsCount() {
	return useFetchBatchTableById(selectRowsCount);
}

const DEFAULT_BATCH_TABLE_ENTITY_SUGGESTIONS: ReadonlyArray<BatchTableEntitySuggestion> =
	[];
function selectEntitySuggestions(data: GetBatchTableByIdResponse) {
	return data.entity_suggestions ?? DEFAULT_BATCH_TABLE_ENTITY_SUGGESTIONS;
}
export function useEntitySuggestions() {
	return useFetchBatchTableById(selectEntitySuggestions);
}

export function useBatchTableCellByCoords(coords: CellCoords) {
	const select = useCallback(
		(data: GetBatchTableByIdResponse) => {
			return data.cells.get(coords);
		},
		[coords],
	);

	return useFetchBatchTableById(select);
}

const THEME_OVERRIDE: Partial<
	Record<BatchTableMetadataColumnType, Partial<Theme>>
> = {
	[BatchTableMetadataColumnType.NUMBER]: {
		textDark: "#6947ff",
	},
	[BatchTableMetadataColumnType.JSON]: {
		textDark: "rgb(164,117,0)",
	},
	[BatchTableMetadataColumnType.BOOLEAN]: {
		// textLight: "rgb(164, 117, 0)",
		textMedium: "#6947ff",
	},
	[BatchTableMetadataColumnType.FILE]: {
		bgHeaderHovered: "rgb(22,90,142)",
		bgHeader: "rgb(7,100,172)",
		bgIconHeader: "#fff",
		textHeader: "#fff",
	},
};

function selectColumnsForGlide(
	data: GetBatchTableByIdResponse,
): Array<GridColumn> {
	const numberOfColumns = Math.max(
		data.columns.size,
		DEFAULT_EXCEL_COLUMNS_NUMBER,
	) as BatchTableColumnIndex;

	return Array.from({ length: numberOfColumns }, (_, index) => {
		const column = data.columns.get(index as BatchTableColumnIndex);

		return {
			width: column?.column_format?.width ?? DEFAULT_CELL_WIDTH,
			icon: (column?.column_type || undefined) as string,
			// @ts-expect-error => ignore since it will just return undefined if not found:
			themeOverride: THEME_OVERRIDE[column?.column_type],
			id: `${column?.id ?? index}`,
			title: column?.name ?? "",
			hasMenu: true,
		} satisfies GridColumn;
	});
}
export function useColumnsForGlide() {
	return useFetchBatchTableById(selectColumnsForGlide);
}

export function useIsDerivedColumn(
	columnIndex: BatchTableColumnIndex | undefined,
) {
	const select = useCallback(
		(data: GetBatchTableByIdResponse) => {
			return (
				data.columns.get(columnIndex as BatchTableColumnIndex)?.is_derived ??
				false
			);
		},
		[columnIndex],
	);

	return useFetchBatchTableById(select);
}

export function useColumnType(columnIndex: BatchTableColumnIndex | undefined) {
	const select = useCallback(
		(data: GetBatchTableByIdResponse) => {
			return (
				data.columns.get(columnIndex as BatchTableColumnIndex)?.column_type ??
				undefined
			);
		},
		[columnIndex],
	);

	return useFetchBatchTableById(select);
}

export function useIsFromFileColumn(
	columnIndex: BatchTableColumnIndex | undefined,
) {
	const select = useCallback(
		(data: GetBatchTableByIdResponse) => {
			return (
				data.columns.get(columnIndex as BatchTableColumnIndex)?.column_type ===
				BatchTableMetadataColumnType.FILE
			);
		},
		[columnIndex],
	);

	return useFetchBatchTableById(select);
}

function selectName(data: GetBatchTableByIdResponse) {
	return data.name;
}
export function useBatchTableName() {
	return useFetchBatchTableById(selectName);
}

function selectIsAIThinking(
	data: GetBatchTableByIdResponse,
): Readonly<boolean> {
	let isAIThinking = false;

	for (const cell of data.cells.values()) {
		if (cell.ai_fill_status === AIFillStatus.InProgress) {
			isAIThinking = true;

			break;
		}
	}

	return isAIThinking;
}
export function useIsAIThinking() {
	return useFetchBatchTableById(selectIsAIThinking);
}
