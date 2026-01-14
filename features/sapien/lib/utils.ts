import type {
	BatchTableColumnIndex,
	BatchTableRowIndex,
	CellCoords,
} from "#/types/batch-table";

export function makeCellCoords(
	rowIndex: BatchTableRowIndex,
	columnIndex: BatchTableColumnIndex,
) {
	return `${rowIndex}-${columnIndex}` as CellCoords;
}
export function getRowAndColFromCellCoods(cellCoords: CellCoords) {
	return cellCoords.split("-").map(Number) as [
		BatchTableRowIndex,
		BatchTableColumnIndex,
	];
}

export const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	day: "numeric",
	month: "short",
});
