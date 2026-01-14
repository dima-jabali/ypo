import {
	CompactSelection,
	DataEditor,
	GridCellKind,
	type BaseGridCell,
	type CellArray,
	type GridCell,
	type UriCell,
} from "@glideapps/glide-data-grid";
import { invariant } from "es-toolkit";
import type { DataEditorAllProps } from "node_modules/@glideapps/glide-data-grid/dist/dts/data-editor-all";
import { useLayoutEffect, useMemo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { stringifyCellValue } from "#/helpers/utils";
import {
	AIFillStatus,
	BatchTableMetadataColumnType,
	type BatchTableColumnIndex,
	type BatchTableRowIndex,
	type CellCoords,
} from "#/types/batch-table";
import { ColorScheme, type Mutable } from "#/types/general";
import { useMentionablesStore } from "../../contexts/mentionables/mentionables-context";
import { useTableUIStore } from "../../contexts/table-ui";
import {
	useColumnsForGlide,
	useRowsCount,
	type NormalizedBatchTable,
} from "../../hooks/get/use-fetch-batch-table-by-id";
import { BatchTablePatchType } from "../../hooks/patch/use-patch-batch-table-by-id";
import { makeCellCoords } from "../../lib/utils";
import { EditCellPopover } from "../edit-cell-popover/edit-cell-popover";
import { DEFAULT_ROW_HEIGHT, HEADER_ICONS } from "./utils";

import "@glideapps/glide-data-grid/dist/index.css";

declare module "@glideapps/glide-data-grid" {
	interface BaseGridCell {
		meta: {
			aiFillStatus: AIFillStatus | undefined | null;
		};
	}
}

export function CanvasTable() {
	useLayoutEffect(() => {
		// Cell editor popover needed by Glide
		if (!document.getElementById("portal")) {
			const portal = document.createElement("div");

			portal.className = "fixed top-0 left-0 z-100";
			portal.id = "portal";

			document.body.appendChild(portal);

			return () => {
				document.body.removeChild(portal);
			};
		}

		return;
	}, []);

	return (
		<div className="[grid-area:table] overflow-hidden border rounded-lg border-border-smooth">
			<Table />
		</div>
	);
}

function Table() {
	const isDark = generalContextStore.use.colorScheme() === ColorScheme.dark;
	const tableUIStore = useTableUIStore();
	const rerenderCanvas = tableUIStore.use.rerenderCanvas();
	const gridSelection = tableUIStore.use.gridSelection();
	const mentionablesStore = useMentionablesStore();
	const theme = tableUIStore.use.theme();
	const columns = useColumnsForGlide();
	const rowsCount = useRowsCount();

	const {
		onGridSelectionChange,
		getCellsForSelection,
		onHeaderContextMenu,
		onColumnResizeEnd,
		onHeaderMenuClick,
		onCellContextMenu,
		isOutsideClick,
		getCellContent,
		onColumnResize,
		provideEditor,
		onCellEdited,
		drawCell,
	} = useMemo(() => {
		console.log("Rerendering canvas", rerenderCanvas);

		function getBatchTableData() {
			const { getBatchTable, organizationId, batchTableId } =
				generalContextStore.getState();

			invariant(organizationId, "Expected a valid number for organizationId");
			invariant(batchTableId, "Expected a valid number for batchTableId");

			const batchTable = getBatchTable(organizationId, batchTableId);

			invariant(batchTable, "Expected a batch table to getCellContent");

			return batchTable;
		}

		const getCellContent: DataEditorAllProps["getCellContent"] = (cell) => {
			const cellCoords = makeCellCoords(
				cell[1] as BatchTableRowIndex,
				cell[0] as BatchTableColumnIndex,
			);

			const batchTable = getBatchTableData();

			return makeCellGrid(
				batchTable,
				cellCoords,
				cell[0] as BatchTableColumnIndex,
			);
		};

		const onClickUri: NonNullable<UriCell["onClickUri"]> = (args) => {
			window.open((args as unknown as { cell: UriCell }).cell.data, "_blank");
		};

		function makeCellGrid(
			batchTable: NormalizedBatchTable,
			cellCoords: CellCoords,
			columnIndex: BatchTableColumnIndex,
		): GridCell {
			const batchTableColumn = batchTable.columns.get(columnIndex);
			const batchTableCell = batchTable.cells.get(cellCoords);
			const isFromFileColumn =
				batchTableColumn?.column_type === BatchTableMetadataColumnType.FILE;

			const displayValue = stringifyCellValue(
				batchTableCell?.value,
				isFromFileColumn,
				mentionablesStore.getState().mentionables,
			);

			const isLink = displayValue.startsWith("http");
			const meta: BaseGridCell["meta"] = {
				aiFillStatus: batchTableCell?.ai_fill_status,
			};

			if (isLink) {
				return {
					displayData: displayValue,
					kind: GridCellKind.Uri,
					allowOverlay: true,
					data: displayValue,
					hoverEffect: true,
					readonly: false,
					meta,
					onClickUri,
				};
			}

			switch (batchTableColumn?.column_type) {
				case BatchTableMetadataColumnType.BOOLEAN: {
					return {
						data: batchTableCell?.value as boolean | undefined | null,
						kind: GridCellKind.Boolean,
						allowOverlay: false,
						readonly: false,
						meta,
					};
				}

				case BatchTableMetadataColumnType.FILE:
				case BatchTableMetadataColumnType.JSON: {
					return {
						displayData: displayValue,
						kind: GridCellKind.Text,
						allowOverlay: true,
						data: displayValue,
						readonly: false,
						meta,
					};
				}

				case BatchTableMetadataColumnType.NUMBER: {
					const data = Number(displayValue || undefined);

					return {
						displayData: `${displayValue}`,
						kind: GridCellKind.Number,
						allowOverlay: true,
						readonly: false,
						data,
						meta,
					};
				}

				default: {
					return {
						displayData: displayValue,
						kind: GridCellKind.Text,
						allowOverlay: true,
						data: displayValue,
						readonly: false,
						meta,
					};
				}
			}
		}

		const onColumnResizeEnd: DataEditorAllProps["onColumnResizeEnd"] = (
			_column,
			_newSize,
			colIndex,
			newSizeWithGrow,
		) => {
			const batchTable = getBatchTableData();

			const batchTableColumn = batchTable.columns.get(
				colIndex as BatchTableColumnIndex,
			);

			if (!batchTableColumn) {
				return;
			}

			tableUIStore.getState().pushToUndoStackAndRun({
				undos: [],
				redos: [
					{
						type: BatchTablePatchType.UpdateColumn,
						data: {
							column_index: colIndex as BatchTableColumnIndex,
							uuid: batchTableColumn.uuid,
							column_format: {
								...batchTableColumn.column_format,
								width: newSizeWithGrow,
							},
						},
					},
				],
			});
		};

		const onColumnResize: DataEditorAllProps["onColumnResize"] = (
			_column,
			_newSize,
			colIndex,
			newSizeWithGrow,
		) => {
			const batchTable = getBatchTableData();

			const batchTableColumn = batchTable.columns.get(
				colIndex as BatchTableColumnIndex,
			);

			if (!batchTableColumn) {
				return;
			}

			const newCol: typeof batchTableColumn = {
				...batchTableColumn,
				column_format: {
					...batchTableColumn.column_format,
					width: newSizeWithGrow,
				},
			};

			const newColumns = new Map(batchTable.columns);

			newColumns.set(colIndex as BatchTableColumnIndex, newCol);

			const newBatchTable: NormalizedBatchTable = {
				...batchTable,
				columns: newColumns,
			};

			const { setBatchTable, organizationId, batchTableId } =
				generalContextStore.getState();

			setBatchTable(newBatchTable, organizationId, batchTableId!);
		};

		const getCellsForSelection: DataEditorAllProps["getCellsForSelection"] = (
			selection,
		): CellArray => {
			const cellArray: Mutable<CellArray> = [];
			const batchTable = getBatchTableData();

			// Calculate the end boundaries (exclusive)
			const endRow = selection.y + selection.height;
			const endCol = selection.x + selection.width;

			// Outer loop iterates through the rows (y-axis)
			for (let row = selection.y as BatchTableRowIndex; row < endRow; ++row) {
				const rowCells: Array<GridCell> = [];

				// Inner loop iterates through the columns (x-axis)
				for (
					let col = selection.x as BatchTableColumnIndex;
					col < endCol;
					++col
				) {
					const gridCell: GridCell = makeCellGrid(
						batchTable,
						makeCellCoords(row, col),
						col,
					);

					rowCells.push(gridCell);
				}

				cellArray.push(rowCells);
			}

			return cellArray;
		};

		const onHeaderMenuClick: DataEditorAllProps["onHeaderMenuClick"] = (
			col,
			screenPosition,
		) => {
			tableUIStore.setState({
				openedColumnOptions: {
					left: screenPosition.x + screenPosition.width - 20,
					top: screenPosition.y + screenPosition.height - 20,
					columnIndex: col as BatchTableColumnIndex,
				},
				openedHoverCardCellWithUUID: null,
				openedRowHeaderContextMenu: null,
				openedUploadFileCellCoords: null,
				openedColumnContextMenu: null,
				openedCellContextMenu: null,
			});
		};

		const onHeaderContextMenu: DataEditorAllProps["onHeaderContextMenu"] = (
			colIndex,
			event,
		) => {
			if (colIndex < 0) return;

			event.preventDefault();

			tableUIStore.setState((p) => {
				const isClickedColumnSelected =
					p.gridSelection?.columns.hasIndex(colIndex) ?? false;
				const ret: Partial<typeof p> = {
					openedColumnContextMenu: {
						columnIndex: colIndex as BatchTableColumnIndex,
						left: event.bounds.x + event.localEventX,
						top: event.bounds.y + event.localEventY,
					},
					openedHoverCardCellWithUUID: null,
					openedRowHeaderContextMenu: null,
					openedUploadFileCellCoords: null,
					openedCellContextMenu: null,
					openedColumnOptions: null,
				};

				if (!isClickedColumnSelected) {
					ret.gridSelection = {
						columns: CompactSelection.fromSingleSelection(colIndex),
						rows: CompactSelection.empty(),
					};
				}

				return ret;
			});
		};

		const onGridSelectionChange: DataEditorAllProps["onGridSelectionChange"] = (
			newSelection,
		) => {
			tableUIStore.setState({
				gridSelection: newSelection,
			});
		};

		const onCellEdited: DataEditorAllProps["onCellEdited"] = (
			cell,
			newValue,
		) => {
			const columnIndex = cell[0] as BatchTableColumnIndex;
			const rowIndex = cell[1] as BatchTableRowIndex;

			const batchTable = getBatchTableData();
			const isFileColumn =
				batchTable.columns.get(columnIndex)?.column_type ===
				BatchTableMetadataColumnType.FILE;

			if (isFileColumn) {
				// We handle file column changes elsewhere.
				return;
			}

			const cellCoords = makeCellCoords(rowIndex, columnIndex);

			const batchTableCell = batchTable.cells.get(cellCoords);

			tableUIStore.getState().pushToUndoStackAndRun({
				undos: [
					{
						type: BatchTablePatchType.UpdateCell,
						data: {
							value: batchTableCell?.value,
							uuid: batchTableCell?.uuid,
							column_index: columnIndex,
							row_index: rowIndex,
						},
					},
				],
				redos: [
					{
						type: BatchTablePatchType.UpdateCell,
						data: {
							uuid: batchTableCell?.uuid,
							column_index: columnIndex,
							value: newValue.data,
							row_index: rowIndex,
						},
					},
				],
			});
		};

		const provideEditor: DataEditorAllProps["provideEditor"] = () => {
			return {
				editor: EditCellPopover,
				disablePadding: true,
			};
		};

		const isOutsideClick: DataEditorAllProps["isOutsideClick"] = () => {
			return false;
		};

		const onCellContextMenu: DataEditorAllProps["onCellContextMenu"] = (
			cell,
			event,
		) => {
			event.preventDefault();

			const columnIndex = cell[0] as BatchTableColumnIndex;
			const rowIndex = cell[1] as BatchTableRowIndex;

			if (columnIndex === -1) {
				// Row header.

				tableUIStore.setState({
					openedRowHeaderContextMenu: {
						left: event.bounds.x + event.localEventX,
						top: event.bounds.y + event.localEventY,
						rowIndex,
					},
					openedHoverCardCellWithUUID: null,
					openedUploadFileCellCoords: null,
					openedColumnContextMenu: null,
					openedCellContextMenu: null,
					openedColumnOptions: null,
				});
			} else {
				tableUIStore.setState({
					openedCellContextMenu: {
						left: event.bounds.x + event.localEventX,
						top: event.bounds.y + event.localEventY,
						columnIndex,
						rowIndex,
					},
					openedHoverCardCellWithUUID: null,
					openedRowHeaderContextMenu: null,
					openedUploadFileCellCoords: null,
					openedColumnContextMenu: null,
					openedColumnOptions: null,
				});
			}
		};

		const drawCell: NonNullable<DataEditorAllProps["drawCell"]> = (
			args,
			draw,
		) => {
			draw(); // draw up front to draw over the cell

			const { aiFillStatus } = args.cell.meta;

			if (!aiFillStatus) return;

			const {
				ctx,
				rect: { x, y, width },
			} = args;

			const counterClockwise = false;
			const centerX = x + width - 8;
			const endAngle = Math.PI * 2;
			const centerY = y + 8;
			const startAngle = 0;
			const radius = 2;

			// 3. Start drawing a path
			ctx.save();
			ctx.beginPath();

			// 4. Define the circle path using arc()
			// arc(x, y, radius, startAngle, endAngle, counterClockwise)
			ctx.arc(centerX, centerY, radius, startAngle, endAngle, counterClockwise);

			switch (aiFillStatus) {
				case AIFillStatus.InProgress: {
					ctx.fillStyle = isDark ? "#efd700" : "#7e7a05";

					break;
				}

				case AIFillStatus.TimedOut: {
					ctx.fillStyle = "#5eb3de";

					break;
				}

				case AIFillStatus.Complete: {
					ctx.fillStyle = isDark ? "#00ff80" : "#2b7a47";

					break;
				}

				case AIFillStatus.Aborted: {
					ctx.fillStyle = isDark ? "#ff83fb" : "#4d00a5";

					break;
				}

				case AIFillStatus.Failed: {
					ctx.fillStyle = isDark ? "#f76e6e" : "#7f1d1d";

					break;
				}

				default: {
					ctx.fillStyle = isDark ? "#ffffff4f" : "#0000004f";

					break;
				}
			}

			// 6. Draw the circle
			ctx.fill(); // Fills the defined path with the fillStyle
			ctx.restore();

			return;
		};

		return {
			onGridSelectionChange,
			getCellsForSelection,
			onHeaderContextMenu,
			onColumnResizeEnd,
			onHeaderMenuClick,
			onCellContextMenu,
			isOutsideClick,
			onColumnResize,
			getCellContent,
			provideEditor,
			onCellEdited,
			drawCell,
		};
	}, [mentionablesStore, tableUIStore, isDark, rerenderCanvas]);

	console.log({ columns, rowsCount, gridSelection });

	return (
		<DataEditor
			onGridSelectionChange={onGridSelectionChange}
			getCellsForSelection={getCellsForSelection}
			onHeaderContextMenu={onHeaderContextMenu}
			onColumnResizeEnd={onColumnResizeEnd}
			onHeaderMenuClick={onHeaderMenuClick}
			onCellContextMenu={onCellContextMenu}
			cellActivationBehavior="double-click"
			getCellContent={getCellContent}
			onColumnResize={onColumnResize}
			isOutsideClick={isOutsideClick}
			rowHeight={DEFAULT_ROW_HEIGHT}
			provideEditor={provideEditor}
			gridSelection={gridSelection}
			className="transition-none"
			onCellEdited={onCellEdited}
			headerIcons={HEADER_ICONS}
			columnSelect="multi"
			drawCell={drawCell}
			rowSelect="multi"
			columns={columns}
			rowMarkers="both"
			rows={rowsCount}
			theme={theme}
			smoothScrollX
			smoothScrollY
			editOnType
			trapFocus
			onPaste
		/>
	);
}
