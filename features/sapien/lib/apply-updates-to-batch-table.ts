/* eslint-disable no-unused-labels, no-debugger */

import { invariant } from "es-toolkit";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	assertUnreachable,
	createBatchTableCellUuid,
	createBatchTableColumnUuid,
	createBatchTableRowUuid,
	createISODate,
	dbg,
	isValidNumber,
} from "#/helpers/utils";
import {
	AIFillStatus,
	BatchTableMetadataColumnType,
	BatchTableToolSettingsInheritanceType,
	type BatchTable,
	type BatchTableCell,
	type BatchTableCellId,
	type BatchTableCellUuid,
	type BatchTableColumn,
	type BatchTableColumnId,
	type BatchTableColumnIndex,
	type BatchTableRow,
	type BatchTableRowId,
	type BatchTableRowIndex,
	type BatchTableToolSettingsId,
} from "#/types/batch-table";
import type { BatchTableId, OrganizationId } from "#/types/general";
import type { BetterbrainUser } from "#/types/notebook";
import { sendRefreshTableCanvasEvent } from "../contexts/window-events";
import {
	BatchTablePatchType,
	type BatchTablePatchUpdateRequest,
	type BatchTablePatchUpdateResponse,
} from "../hooks/patch/use-patch-batch-table-by-id";
import { makeCellCoords } from "./utils";

const SKIPPING_UPDATE_MSG =
	"Skipping this update because it is older than local one.";

const KEYS_TO_IGNORE_WHEN_UPDATING_TABLE: Array<keyof BatchTable> = [
	"columns",
	"cells",
	"rows",
];

export function applyPatchUpdateResponsesToBatchTable(payload: {
	updates: Array<BatchTablePatchUpdateResponse>;
	organizationId: OrganizationId;
	batchTableId: BatchTableId;
}) {
	if (payload.updates.length === 0) {
		return;
	}

	const { getBatchTable, setBatchTable, lastServerBatchTables } =
		generalContextStore.getState();

	const prevBatchTable = getBatchTable(
		payload.organizationId,
		payload.batchTableId,
	);

	invariant(
		prevBatchTable,
		`Could not find batch table with id ${payload.batchTableId} on query client.`,
	);

	const prevServerBatchTable = lastServerBatchTables.get(
		`${payload.batchTableId}-${payload.organizationId}`,
	);

	invariant(
		prevServerBatchTable,
		"Expected a prevServerBatchTable to apply updates to.",
	);

	const nextServerBatchTable = { ...prevServerBatchTable };
	const nextBatchTable: typeof prevBatchTable = {
		...prevBatchTable,
		columns: new Map(prevBatchTable.columns),
		cells: new Map(prevBatchTable.cells),
		rows: new Map(prevBatchTable.rows),
	};

	const errorCause = {
		payload,
	};

	payload.updates.forEach((updateFromBackend) => {
		switch (updateFromBackend.type) {
			case BatchTablePatchType.UpdateColumn:
			case BatchTablePatchType.AddColumn: {
				const columnFromBackend = updateFromBackend.data;
				const prevColumn = nextBatchTable.columns.get(
					columnFromBackend.column_index,
				);

				server: {
					nextServerBatchTable.columns.set(
						columnFromBackend.column_index,
						columnFromBackend,
					);
				}

				if (
					prevColumn &&
					prevColumn.updated_at &&
					columnFromBackend.updated_at
				) {
					const prevColumnWasLastUpdatedAt = new Date(
						prevColumn.updated_at,
					).getTime();
					const newColumnWasLastUpdatedAt = new Date(
						columnFromBackend.updated_at,
					).getTime();

					const isNewColumnTheLatest =
						newColumnWasLastUpdatedAt >= prevColumnWasLastUpdatedAt;

					if (!isNewColumnTheLatest) {
						dbg(SKIPPING_UPDATE_MSG, { updateFromBackend, prevColumn });

						break;
					}
				}

				console.log("Updating/Adding column", {
					columnFromBackend,
					prevColumn,
				});

				nextBatchTable.columns.set(
					columnFromBackend.column_index,
					columnFromBackend,
				);

				break;
			}

			case BatchTablePatchType.DeleteColumn: {
				const columnUuid = updateFromBackend.data.uuid;
				let prevColumn: BatchTableColumn | null = null;

				for (const [columnIndex, column] of nextBatchTable.columns) {
					if (column.uuid === columnUuid) {
						server: {
							nextServerBatchTable.columns.delete(columnIndex);
						}

						nextBatchTable.columns.delete(columnIndex);
						prevColumn = column;

						break;
					}
				}

				if (!prevColumn) {
					console.warn("No column found to delete!", {
						columnUuid,
					});

					break;
				}

				// Delete all cells that belong to this column:
				nextBatchTable.cells.forEach((cell) => {
					if (cell.column.uuid === columnUuid) {
						const columnIndex = cell.column.column_index;
						const rowIndex = cell.row.row_index;

						if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
							nextBatchTable.cells.delete(
								makeCellCoords(rowIndex, columnIndex),
							);
						}
					}
				});

				server: {
					nextServerBatchTable.cells.forEach((cell) => {
						if (cell.column.uuid === columnUuid) {
							const columnIndex = cell.column.column_index;
							const rowIndex = cell.row.row_index;

							if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
								nextServerBatchTable.cells.delete(
									makeCellCoords(rowIndex, columnIndex),
								);
							}
						}
					});
				}

				break;
			}

			case BatchTablePatchType.UpdateRow:
			case BatchTablePatchType.AddRow: {
				const rowFromBackend = updateFromBackend.data;
				const prevRow = nextBatchTable.rows.get(rowFromBackend.row_index);

				server: {
					nextServerBatchTable.rows.set(
						rowFromBackend.row_index,
						rowFromBackend,
					);
				}

				if (prevRow?.updated_at && rowFromBackend.updated_at) {
					const prevRowWasLastUpdatedAt = new Date(
						prevRow.updated_at,
					).getTime();
					const newRowWasLastUpdatedAt = new Date(
						rowFromBackend.updated_at,
					).getTime();

					const isNewRowTheLatest =
						newRowWasLastUpdatedAt >= prevRowWasLastUpdatedAt;

					if (!isNewRowTheLatest) {
						dbg(SKIPPING_UPDATE_MSG, { prevRow, updateFromBackend });

						break;
					}
				}

				console.log("Updating/Adding row", {
					rowFromBackend,
					prevRow,
				});

				nextBatchTable.rows.set(rowFromBackend.row_index, rowFromBackend);

				break;
			}

			case BatchTablePatchType.DeleteRow: {
				const rowUuid = updateFromBackend.data.uuid;
				let prevRow: BatchTableRow | null = null;

				for (const [rowIndex, row] of nextBatchTable.rows) {
					if (row.uuid === rowUuid) {
						server: {
							nextServerBatchTable.rows.delete(rowIndex);
						}

						nextBatchTable.rows.delete(rowIndex);
						prevRow = row;

						break;
					}
				}

				if (!prevRow) {
					break;
				}

				// Delete all cells that belong to this column:
				nextBatchTable.cells.forEach((cell) => {
					if (cell.row.uuid === rowUuid) {
						const columnIndex = cell.column.column_index;
						const rowIndex = cell.row.row_index;

						if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
							nextBatchTable.cells.delete(
								makeCellCoords(rowIndex, columnIndex),
							);
						}
					}
				});

				server: {
					nextServerBatchTable.cells.forEach((cell) => {
						if (cell.row.uuid === rowUuid) {
							const columnIndex = cell.column.column_index;
							const rowIndex = cell.row.row_index;

							if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
								nextServerBatchTable.cells.delete(
									makeCellCoords(rowIndex, columnIndex),
								);
							}
						}
					});
				}

				break;
			}

			case BatchTablePatchType.CreateCell:
			case BatchTablePatchType.UpdateCell: {
				const newCell = updateFromBackend.data;
				const newCellCoords = makeCellCoords(
					newCell.row.row_index!,
					newCell.column.column_index!,
				);
				const prevCell = nextBatchTable.cells.get(newCellCoords);

				server: {
					nextServerBatchTable.cells.set(newCellCoords, newCell);
				}

				if (prevCell && prevCell.updated_at) {
					const prevRowWasLastUpdatedAt = new Date(
						prevCell.updated_at,
					).getTime();
					const newCellWasLastUpdatedAt = new Date(
						newCell.updated_at,
					).getTime();

					const isNewCellTheLatest =
						newCellWasLastUpdatedAt >= prevRowWasLastUpdatedAt;

					if (!isNewCellTheLatest) {
						dbg(SKIPPING_UPDATE_MSG, { prevCell, updateFromBackend });

						break;
					}
				}

				const column = nextBatchTable.columns.get(newCell.column.column_index!);
				const row = nextBatchTable.rows.get(newCell.row.row_index!);

				if (!column || !row) {
					debugger;

					throw new Error(
						`Column or row not found for updating/creating cell ${newCell.uuid} on update response. This should never happen!`,
					);
				}

				nextBatchTable.cells.set(newCellCoords, newCell);

				break;
			}

			case BatchTablePatchType.UpdateTable: {
				for (const [key, value] of Object.entries(updateFromBackend.data)) {
					if (
						KEYS_TO_IGNORE_WHEN_UPDATING_TABLE.includes(key as keyof BatchTable)
					) {
						continue;
					}

					Reflect.set(nextBatchTable, key, value);
				}

				break;
			}

			case BatchTablePatchType.RunAgent: {
				console.log("Not doing anything with run agent", errorCause);

				break;
			}

			case BatchTablePatchType.BulkAddRowsWithCellValues: {
				console.log(
					"Not doing anything with BulkAddRowsWithCellValues",
					errorCause,
				);

				break;
			}

			case BatchTablePatchType.ApproveEntitySuggestions: {
				console.log("Not doing anything yet with suggestions", errorCause);

				break;
			}

			default: {
				assertUnreachable(updateFromBackend);

				break;
			}
		}
	});

	server: {
		console.log("Setting last server batch table...");

		lastServerBatchTables.set(
			`${payload.batchTableId}-${payload.organizationId}`,
			nextBatchTable,
		);
	}

	setBatchTable(nextBatchTable, payload.organizationId, payload.batchTableId);

	sendRefreshTableCanvasEvent(payload.batchTableId, payload.organizationId);
}

function makeEmptyColumn(
	partialColumn: Partial<BatchTableColumn> & { column_index: number },
	user: BetterbrainUser,
): BatchTableColumn {
	const emptyColumn: BatchTableColumn = {
		tool_settings: {
			inheritance_type: BatchTableToolSettingsInheritanceType.INHERIT,
			id: NaN as BatchTableToolSettingsId,
			tool_configurations: [],
			use_all_columns: false,
			source_columns: [],
		},
		column_format: {
			isVisible: true,
			width: 150,
		},
		column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
		uuid: createBatchTableColumnUuid(),
		id: NaN as BatchTableColumnId,
		column_type_specific_info: {},
		derived_from_column: null,
		execution_condition: null,
		last_modified_by: user,
		derivation_path: null,
		derivation_type: null,
		default_value: null,
		name: "New column",
		is_derived: false,
		created_by: user,
		created_at: null,
		description: "",
		use_ai: true,
		prompt: "",
		...partialColumn,
		updated_at: createISODate(),
	};

	return emptyColumn;
}

function makeEmptyRow(
	partialRow: Partial<BatchTableRow> & { row_index: number },
	user: BetterbrainUser,
): BatchTableRow {
	const emptyRow: BatchTableRow = {
		format: {
			height: 50,
		},
		uuid: createBatchTableRowUuid(),
		id: NaN as BatchTableRowId,
		last_modified_by: user,
		created_by: user,
		created_at: null,
		...partialRow,
		updated_at: createISODate(),
	};

	return emptyRow;
}

function makeEmptyCell(
	partialCell: Partial<BatchTableCell> & {
		column_index: BatchTableColumnIndex;
		row_index: BatchTableRowIndex;
		column_id: BatchTableColumnId;
		uuid?: BatchTableCellUuid;
		row_id: BatchTableRowId;
	},
	user: BetterbrainUser,
) {
	const { column_id, row_id, ...partialValues } = partialCell;
	const date = createISODate();
	const emptyCell: BatchTableCell = {
		column: {
			column_index: partialCell.column_index,
			id: column_id,
		},
		row: {
			row_index: partialCell.row_index,
			id: row_id,
		},
		ai_fill_status: AIFillStatus.NotStarted,
		ai_fill_status_last_changed_at: null,
		uuid: createBatchTableCellUuid(),
		id: NaN as BatchTableCellId,
		ai_last_attempt_at: null,
		ai_able_to_fill: false,
		last_modified_by: user,
		results_cache: null,
		created_at: date,
		updated_at: date,
		value_text: null,
		formula: null,
		sources: null,
		format: null,
		value: null,
		...partialValues,
	};

	return emptyCell;
}

export function applyPatchUpdateRequestsToBatchTable(payload: {
	updates: Array<BatchTablePatchUpdateRequest>;
	organizationId: OrganizationId;
	batchTableId: BatchTableId;
}) {
	if (payload.updates.length === 0) {
		return;
	}

	const { getBatchTable, getUser } = generalContextStore.getState();

	const user = getUser();

	invariant(user, "Expected user to be logged in");

	const prevBatchTable = getBatchTable(
		payload.organizationId,
		payload.batchTableId,
	);

	invariant(
		prevBatchTable,
		`Could not find batch table with id ${payload.batchTableId}`,
	);

	const nextBatchTable: typeof prevBatchTable = {
		...prevBatchTable,
		columns: new Map(prevBatchTable.columns),
		cells: new Map(prevBatchTable.cells),
		rows: new Map(prevBatchTable.rows),
	};

	const errorCause = {
		payload,
	};

	payload.updates.forEach((updateRequest) => {
		switch (updateRequest.type) {
			case BatchTablePatchType.UpdateColumn:
			case BatchTablePatchType.AddColumn: {
				const newPartialColumn = updateRequest.data;
				const newColumn = makeEmptyColumn(newPartialColumn, user);

				nextBatchTable.columns.set(newPartialColumn.column_index, newColumn);

				break;
			}

			case BatchTablePatchType.DeleteColumn: {
				const columnUuid = updateRequest.data.uuid;
				let prevColumn: BatchTableColumn | null = null;

				for (const [columnIndex, column] of nextBatchTable.columns) {
					if (column.uuid === columnUuid) {
						nextBatchTable.columns.delete(columnIndex);
						prevColumn = column;

						break;
					}
				}

				if (!prevColumn) {
					console.warn("No column found to delete!", {
						columnUuid,
					});

					break;
				}

				// Delete all cells that belong to this column:
				nextBatchTable.cells.forEach((cell) => {
					if (cell.column.uuid === columnUuid) {
						const columnIndex = cell.column.column_index;
						const rowIndex = cell.row.row_index;

						if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
							nextBatchTable.cells.delete(
								makeCellCoords(rowIndex, columnIndex),
							);
						}
					}
				});

				break;
			}

			case BatchTablePatchType.UpdateRow:
			case BatchTablePatchType.AddRow: {
				const newPartialRow = updateRequest.data;
				const newRow = makeEmptyRow(newPartialRow, user);

				nextBatchTable.rows.set(newPartialRow.row_index, newRow);

				break;
			}

			case BatchTablePatchType.DeleteRow: {
				const rowUuid = updateRequest.data.uuid;
				let prevRow: BatchTableRow | null = null;

				for (const [rowIndex, row] of nextBatchTable.rows) {
					if (row.uuid === rowUuid) {
						nextBatchTable.rows.delete(rowIndex);
						prevRow = row;

						break;
					}
				}

				if (!prevRow) {
					break;
				}

				// Delete all cells that belong to this column:
				nextBatchTable.cells.forEach((cell) => {
					if (cell.row.uuid === rowUuid) {
						const columnIndex = cell.column.column_index;
						const rowIndex = cell.row.row_index;

						if (isValidNumber(rowIndex) && isValidNumber(columnIndex)) {
							nextBatchTable.cells.delete(
								makeCellCoords(rowIndex, columnIndex),
							);
						}
					}
				});

				break;
			}

			case BatchTablePatchType.UpdateCell: {
				const colIndex = updateRequest.data.column_index;
				const rowIndex = updateRequest.data.row_index;

				let column: BatchTableColumn | null = null;
				let row: BatchTableRow | null = null;

				for (const col of nextBatchTable.columns.values()) {
					if (col.column_index === colIndex) {
						column = col;

						break;
					}
				}

				if (!column) {
					// No column found for cell update. Let's create one:
					column = makeEmptyColumn({ column_index: colIndex }, user);

					payload.updates.push({
						type: BatchTablePatchType.AddColumn,
						data: {
							column_index: column.column_index,
							column_type: column.column_type!,
							uuid: column.uuid,
						},
					});
				}

				for (const row_ of nextBatchTable.rows.values()) {
					if (row_.row_index === rowIndex) {
						row = row_;

						break;
					}
				}

				if (!row) {
					// No row found for cell update. Let's create one:
					row = makeEmptyRow({ row_index: rowIndex }, user);

					payload.updates.push({
						type: BatchTablePatchType.AddRow,
						data: {
							row_index: row.row_index,
							uuid: row.uuid,
						},
					});
				}

				// @ts-expect-error => ignore
				const newPartialCell: Parameters<typeof makeEmptyCell>[0] = {
					...updateRequest.data,
					column_id: column.id,
					row_id: row.id,
				};
				const newCellCoords = makeCellCoords(rowIndex, colIndex);
				const newCell = makeEmptyCell(newPartialCell, user);

				nextBatchTable.cells.set(newCellCoords, newCell);

				break;
			}

			case BatchTablePatchType.UpdateTable: {
				for (const [key, value] of Object.entries(updateRequest.data)) {
					if (
						KEYS_TO_IGNORE_WHEN_UPDATING_TABLE.includes(key as keyof BatchTable)
					) {
						continue;
					}

					Reflect.set(nextBatchTable, key, value);
				}

				break;
			}

			case BatchTablePatchType.RunAgent: {
				console.log("Not doing anything with run agent", errorCause);

				break;
			}

			case BatchTablePatchType.BulkAddRowsWithCellValues: {
				console.log(
					"Not doing anything with BulkAddRowsWithCellValues",
					errorCause,
				);

				break;
			}

			case BatchTablePatchType.ApproveEntitySuggestions: {
				console.log("Not doing anything yet with suggestions", errorCause);

				break;
			}

			default: {
				assertUnreachable(updateRequest);

				break;
			}
		}
	});

	generalContextStore
		.getState()
		.setBatchTable(
			nextBatchTable,
			payload.organizationId,
			payload.batchTableId,
		);
}
