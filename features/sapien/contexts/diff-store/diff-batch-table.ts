import {
	BatchTableMetadataColumnType,
	type BatchTableColumn,
} from "#/types/batch-table";
import { isEqual } from "es-toolkit";
import type { NormalizedBatchTable } from "../../hooks/get/use-fetch-batch-table-by-id";
import {
	BatchTablePatchType,
	type BatchTablePatchUpdateRequest,
} from "../../hooks/patch/use-patch-batch-table-by-id";
import { isValidNumber } from "#/helpers/utils";
import { makeCellCoords } from "../../lib/utils";

const KEYS_TO_CHECK_FOR_COLUMN_UPDATES_TO_SEND: Partial<
	keyof BatchTableColumn
>[] = [
	"column_format",
	"tool_settings",
	"column_index",
	"column_type",
	"description",
	"use_ai",
	"prompt",
	"name",
] as const;

export const diffBatchTable = (
	prevBatchTable: NormalizedBatchTable,
	currBatchTable: NormalizedBatchTable,
) => {
	const patchUpdates: Array<BatchTablePatchUpdateRequest> = [];

	// Columns check:
	{
		const start = performance.now();

		const prevColumnsByUuid = prevBatchTable.columns;
		const currColumnsByUuid = currBatchTable.columns;

		// We do not check for deleted columns! They should be removed in sync!
		// Check if columns have been added:
		for (const currColumn of currColumnsByUuid.values()) {
			const prevColumn = prevColumnsByUuid.get(currColumn.column_index);

			const isNegativeColumnIndex = currColumn.column_index < 0;

			if (isNegativeColumnIndex) {
				console.error("Column index is negative! This should not happen!", {
					prevBatchTable,
					currBatchTable,
					currColumn,
					prevColumn,
				});

				continue;
			}

			if (prevColumn) {
				// Check if column has been updated:
				const update: BatchTablePatchUpdateRequest = {
					type: BatchTablePatchType.UpdateColumn,
					data: currColumn,
				};

				let willUpdateColumn = false;

				for (const key of KEYS_TO_CHECK_FOR_COLUMN_UPDATES_TO_SEND) {
					const prevColumnValue = prevColumn[key];
					const currColumnValue = currColumn[key];

					switch (typeof prevColumnValue) {
						case "undefined":
						case "boolean":
						case "number":
						case "bigint":
						case "string": {
							if (prevColumnValue !== currColumnValue) {
								willUpdateColumn = true;

								// @ts-expect-error => ignore
								update.data[key] = currColumnValue;
							}

							break;
						}

						default: {
							if (!isEqual(prevColumnValue, currColumnValue)) {
								willUpdateColumn = true;

								// @ts-expect-error => ignore
								update.data[key] = currColumnValue;
							}

							break;
						}
					}
				}

				if (willUpdateColumn) {
					patchUpdates.push(update);
				}
			} else {
				// Column has been added:
				// Assume we have all needed values:
				patchUpdates.push({
					type: BatchTablePatchType.AddColumn,
					data: {
						...currColumn,
						column_type:
							currColumn.column_type ||
							BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
					},
				});
			}
		}

		const colsDiffTime = performance.now() - start;

		console.log("Columns diff took", colsDiffTime, "ms");
	}

	// Rows check:
	{
		const start = performance.now();

		const prevRowsByUuid = prevBatchTable.rows;
		const currRowsByUuid = currBatchTable.rows;

		// We do not check for deleted rows! They should be removed in sync!
		// Check if rows have been added/modified:
		for (const currRow of currRowsByUuid.values()) {
			const prevRow = prevRowsByUuid.get(currRow.row_index);

			const isNegativeRowIndex = currRow.row_index < 0;

			if (isNegativeRowIndex) {
				console.error("Row index is negative! This should not happen!", {
					prevBatchTable,
					currBatchTable,
					currRow,
					prevRow,
				});

				continue;
			}

			if (prevRow) {
				// Check if row has been updated:

				if (currRow.row_index !== prevRow.row_index) {
					patchUpdates.push({
						type: BatchTablePatchType.UpdateRow,
						data: currRow,
					});
				}
			} else {
				// Row has been added:
				patchUpdates.push({
					type: BatchTablePatchType.AddRow,
					data: {
						row_index: currRow.row_index,
						uuid: currRow.uuid,
					},
				});
			}
		}

		const rowsDiffTime = performance.now() - start;

		console.log("Rows diff took", rowsDiffTime, "ms");
	}

	// Cells check:
	{
		const start = performance.now();

		const prevCells = prevBatchTable.cells;
		const currCells = currBatchTable.cells;

		// Check if rows have been added/updated:
		for (const currCell of currCells.values()) {
			const colIndex = currCell.column.column_index;
			const rowIndex = currCell.row.row_index;

			if (!isValidNumber(colIndex) || !isValidNumber(rowIndex)) {
				console.error("Cell indexes are not valid!", {
					prevBatchTable,
					currBatchTable,
					currCell,
				});

				continue;
			}

			const prevCell = prevCells.get(makeCellCoords(rowIndex, colIndex));

			const update: BatchTablePatchUpdateRequest = {
				type: BatchTablePatchType.UpdateCell,
				data: {
					value: currCell.value === undefined ? null : currCell.value,
					formula: currCell.formula,
					column_index: colIndex,
					format: currCell.format,
					row_index: rowIndex,
					uuid: currCell.uuid,
				},
			};

			if (prevCell) {
				// Check if cell has been updated:

				if (prevCell.formula !== currCell.formula) {
					patchUpdates.push(update);

					continue;
				}

				const prevCellValue = prevCell.value;
				const currCellValue = currCell.value;

				switch (typeof currCellValue) {
					case "undefined":
					case "boolean":
					case "number":
					case "bigint":
					case "string": {
						if (prevCellValue !== currCellValue) {
							patchUpdates.push(update);

							continue;
						}

						break;
					}

					default: {
						if (!isEqual(prevCellValue, currCellValue)) {
							patchUpdates.push(update);

							continue;
						}

						break;
					}
				}

				if (!isEqual(prevCell.format, currCell.format)) {
					patchUpdates.push(update);
				}
			} else {
				// Cell has been added (we just send an update request):
				patchUpdates.push(update);
			}
		}

		const cellsDiffTime = performance.now() - start;

		console.log("Cells diff took", cellsDiffTime, "ms");
	}

	// Make sure all "ADD_COLUMN" comes last, otherwise a unique column index constraint error
	// will be thrown if we try to insert a column where there was a previous existing one!
	patchUpdates.sort((a, b) => {
		if (a.type === b.type) return 0;

		if (
			a.type === BatchTablePatchType.AddColumn ||
			a.type === BatchTablePatchType.AddRow
		)
			return 1;

		return -1;
	});

	return patchUpdates;
};
