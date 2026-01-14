import {
	BatchTableMode,
	type BatchTable,
	type BatchTableCell,
	type BatchTableColumn,
	type BatchTableColumnIndex,
	type BatchTableRow,
	type BatchTableRowIndex,
} from "#/types/batch-table";
import {
	DEFAULT_CELL_WIDTH,
	DEFAULT_EXCEL_COLUMNS_NUMBER,
	DEFAULT_EXCEL_ROWS_NUMBER,
	DEFAULT_ROW_HEIGHT,
} from "../components/canvas-table/utils";
import type { NormalizedBatchTable } from "../hooks/get/use-fetch-batch-table-by-id";
import { makeCellCoords } from "./utils";

const DEFAULT_COLUMN_FORMAT: BatchTableColumn["column_format"] = {
	width: DEFAULT_CELL_WIDTH,
	isVisible: true,
};
const DEFAULT_ROW_FORMAT: BatchTableRow["format"] = {
	height: DEFAULT_ROW_HEIGHT,
};

function sortCols(a: BatchTableColumn, b: BatchTableColumn) {
	return a.column_index - b.column_index;
}

function sortRows(a: BatchTableRow, b: BatchTableRow) {
	return a.row_index - b.row_index;
}

function sortCellsRowMajor(a: BatchTableCell, b: BatchTableCell) {
	const aRow = a.row.row_index!;
	const bRow = b.row.row_index!;

	// First, compare by row index.
	// If a's row is less than b's, 'a' comes first.
	if (aRow !== bRow) {
		return aRow - bRow;
	}

	const aCol = a.column.column_index!;
	const bCol = b.column.column_index!;

	// If the rows are the same, compare by column index.
	// This handles the tie-breaker to ensure correct row-major order.
	return aCol - bCol;
}

export function normalizeBatchTable(batchTable: BatchTable) {
	const normalized = { ...batchTable } as unknown as NormalizedBatchTable;

	const cells = batchTable.cells?.sort(sortCellsRowMajor) ?? [];
	const cols = batchTable.columns?.sort(sortCols) ?? [];
	const rows = batchTable.rows?.sort(sortRows) ?? [];

	let lastDefinedColumnIndex = 0 as BatchTableColumnIndex;

	normalized.columns = new Map(
		cols.map((column) => {
			if (column.column_index! > lastDefinedColumnIndex) {
				lastDefinedColumnIndex = column.column_index!;
			}

			column.column_format ??= DEFAULT_COLUMN_FORMAT;

			return [column.column_index, column];
		}),
	);

	let lastDefinedRowIndex = 0 as BatchTableRowIndex;

	normalized.rows = new Map(
		rows.map((row) => {
			if (row.row_index! > lastDefinedRowIndex) {
				lastDefinedRowIndex = row.row_index!;
			}

			row.format ??= DEFAULT_ROW_FORMAT;

			return [row.row_index, row];
		}),
	);

	normalized.lastDefinedColumnIndex = lastDefinedColumnIndex;
	normalized.lastDefinedRowIndex = lastDefinedRowIndex;

	if (normalized.batch_table_mode === BatchTableMode.Table) {
		normalized.columnsLength = lastDefinedColumnIndex;
		normalized.rowsLength = lastDefinedRowIndex;
	} else {
		normalized.columnsLength =
			lastDefinedColumnIndex < DEFAULT_EXCEL_COLUMNS_NUMBER
				? DEFAULT_EXCEL_COLUMNS_NUMBER
				: lastDefinedColumnIndex;
		normalized.rowsLength =
			lastDefinedRowIndex < DEFAULT_EXCEL_ROWS_NUMBER
				? DEFAULT_EXCEL_ROWS_NUMBER
				: lastDefinedRowIndex;
	}

	normalized.columnsWidthAccumulation =
		calculateAccumulatedColumnWidth(normalized);
	normalized.rowsHeightAccumulation = calculateAccumulatedRowHeight(normalized);

	normalized.cells = new Map(
		cells.map((cell) => [
			makeCellCoords(cell.row.row_index, cell.column.column_index),
			cell,
		]),
	);

	return normalized;
}

export function calculateAccumulatedColumnWidth(
	normalized: NormalizedBatchTable,
) {
	const columnsWidthAccumulation: number[] = [];

	let lastAccumulatedWidth = 0;

	for (let i = 0 as BatchTableColumnIndex; i < normalized.columnsLength; ++i) {
		const column = normalized.columns.get(i);
		const width = column?.column_format.width ?? DEFAULT_CELL_WIDTH;

		lastAccumulatedWidth += width;

		columnsWidthAccumulation.push(lastAccumulatedWidth);
	}

	return columnsWidthAccumulation;
}

export function calculateAccumulatedRowHeight(
	normalized: NormalizedBatchTable,
) {
	const rowsHeightAccumulation: number[] = [];

	let lastAccumulatedHeight = 0;

	for (let i = 0 as BatchTableRowIndex; i < normalized.rowsLength; ++i) {
		const row = normalized.rows.get(i);
		const height = row?.format.height ?? DEFAULT_ROW_HEIGHT;

		lastAccumulatedHeight += height;

		rowsHeightAccumulation.push(lastAccumulatedHeight);
	}

	return rowsHeightAccumulation;
}
