import { invariant, range } from "es-toolkit";
import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import {
	useTableUIStore,
	useWithOpenedColumnContextMenu,
	WithOpenedColumnContextMenu,
	type UndoRedo,
} from "../contexts/table-ui";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
	type BatchTablePatchUpdateRequest,
} from "../hooks/patch/use-patch-batch-table-by-id";
import {
	createBatchTableColumnUuid,
	getErrorMessage,
	isValidNumber,
} from "#/helpers/utils";
import {
	BatchTableMetadataColumnType,
	type BatchTableColumnIndex,
} from "#/types/batch-table";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { Popover, PopoverContent } from "#/components/Popover";
import { matchIcon } from "#/icons/match-icon";
import { Loader } from "#/components/Loader";
import { Circle } from "lucide-react";

export function ColumnContextMenuPopover() {
	return (
		<WithOpenedColumnContextMenu>
			<ColumnCtxMenuWithAllDefined />
		</WithOpenedColumnContextMenu>
	);
}

function ColumnCtxMenuWithAllDefined() {
	const [isDeletingColumns, setIsDeletingColumns] = useState(false);

	const { left, columnIndex, top } = useWithOpenedColumnContextMenu();
	const tableUIStore = useTableUIStore();
	const pushToUndoStackAndRun = tableUIStore.use.pushToUndoStackAndRun();
	const gridSelection = tableUIStore.use.gridSelection();
	const runPatchBatchTable = usePatchBatchTableById();

	const columnsSelected = gridSelection?.columns.length ?? 0;
	const shouldCtxMenuActOnSelectionRange = columnsSelected > 1;

	function closeCtxMenu() {
		tableUIStore.setState({
			openedColumnContextMenu: null,
		});
	}

	function handleClearColumn() {
		// We're gonna clear all cells in this column.

		const { cells } = tableUIStore.getState().getBatchTableData();

		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		for (const cell of cells.values()) {
			const cellColumnIndex = cell.column.column_index;

			if (cellColumnIndex !== columnIndex) continue;

			const cellRowIndex = cell.row.row_index;

			if (!isValidNumber(cellRowIndex)) {
				console.error("Invalid cell row index! This shouldn't happen!");

				continue;
			}

			undoRedo.undos.push({
				type: BatchTablePatchType.UpdateCell,
				data: {
					column_index: columnIndex,
					row_index: cellRowIndex,
					formula: cell.formula,
					format: cell.format,
					value: cell.value,
					uuid: cell.uuid,
				},
			});

			undoRedo.redos.push({
				type: BatchTablePatchType.UpdateCell,
				data: {
					column_index: columnIndex,
					row_index: cellRowIndex,
					uuid: cell.uuid,
					formula: null,
					format: null,
					value: null,
				},
			});
		}

		pushToUndoStackAndRun(undoRedo, true);

		closeCtxMenu();
	}

	async function handleDeleteColumns() {
		if (isDeletingColumns) return;

		const firstCol = gridSelection?.columns.first() ?? columnIndex;
		const lastCol = gridSelection?.columns.last() ?? columnIndex;
		const max = Math.max(firstCol, lastCol);
		const min = Math.min(firstCol, lastCol);
		const numberOfColumnsToDelete = max - min + 1;

		invariant(
			numberOfColumnsToDelete > 0,
			"No columns to delete! This should never happen!",
		);

		const { getBatchTableData, organizationId, batchTableId } =
			tableUIStore.getState();
		const batchTable = getBatchTableData();

		const updates = range(numberOfColumnsToDelete)
			.map((i) => {
				const columnIndex = (min + i) as BatchTableColumnIndex;
				const batchTableColumn = batchTable.columns.get(columnIndex);
				const columnUuid = batchTableColumn?.uuid;

				console.log({
					columnIndex,
					batchTableColumn,
					columnUuid,
				});

				if (!columnUuid) return null;

				return {
					type: BatchTablePatchType.DeleteColumn,
					data: { uuid: columnUuid },
				} satisfies BatchTablePatchUpdateRequest;
			})
			.filter(Boolean) as Array<BatchTablePatchUpdateRequest>;

		try {
			setIsDeletingColumns(true);

			await runPatchBatchTable.mutateAsync({
				ignoreUpdates: false,
				organizationId,
				batchTableId,
				updates,
			});

			closeCtxMenu();
		} catch (error) {
			console.log("Error deleting column(s)!", {
				batchTable,
				error,
			});

			toast({
				description: getErrorMessage(error),
				title: "Error deleting column(s)!",
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsDeletingColumns(false);
		}
	}

	function handleInsertColumnsLeft(howMuch: number) {
		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		const start = (
			columnIndex - howMuch - 1 < 0 ? 0 : columnIndex - howMuch - 1
		) as BatchTableColumnIndex;
		const end = (
			columnIndex - 1 < 0 ? 0 : columnIndex - 1
		) as BatchTableColumnIndex;

		invariant(
			start !== end && start >= 0 && end >= 0 && start <= end,
			`Invalid start and end indexes. start: ${start}, end: ${end}`,
		);

		for (let i = start; i < columnIndex; ++i) {
			const newColumnUuid = createBatchTableColumnUuid();

			undoRedo.undos.push({
				type: BatchTablePatchType.DeleteColumn,
				data: {
					uuid: newColumnUuid,
				},
			});

			undoRedo.redos.push({
				type: BatchTablePatchType.AddColumn,
				data: {
					column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
					uuid: newColumnUuid,
					column_index: i,
				},
			});
		}

		tableUIStore.getState().pushToUndoStackAndRun(undoRedo, true);

		closeCtxMenu();
	}

	function handleInsertColumnsRight(howMuch: number) {
		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		const start = (columnIndex + 1) as BatchTableColumnIndex;
		const end = (start + howMuch) as BatchTableColumnIndex;

		invariant(
			end >= 0 && start <= end,
			`Invalid end index. start: ${start}, end: ${end}`,
		);

		for (let i = start; i < end; ++i) {
			const newColumnUuid = createBatchTableColumnUuid();

			undoRedo.undos.push({
				type: BatchTablePatchType.DeleteColumn,
				data: {
					uuid: newColumnUuid,
				},
			});

			undoRedo.redos.push({
				type: BatchTablePatchType.AddColumn,
				data: {
					column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
					uuid: newColumnUuid,
					column_index: i,
				},
			});
		}

		tableUIStore.getState().pushToUndoStackAndRun(undoRedo, true);

		closeCtxMenu();
	}

	return (
		<Popover open modal>
			<PopoverPrimitive.Anchor
				className="fixed size-1 pointer-events-none"
				style={{ left, top }}
				data-anchor-row
			/>

			<PopoverContent
				className="flex flex-col gap-1 select-none max-h-[50vh] min-w-64 p-1 rounded-md list-none text-primary"
				onInteractOutside={closeCtxMenu}
				onEscapeKeyDown={closeCtxMenu}
				collisionPadding={50}
				sideOffset={-6}
				avoidCollisions
				align="start"
				side="bottom"
			>
				{shouldCtxMenuActOnSelectionRange ? (
					<>
						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertColumnsLeft(columnsSelected)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{columnsSelected}
								</span>{" "}
								colums on the left
							</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertColumnsRight(columnsSelected)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{columnsSelected}
								</span>{" "}
								colums on the right
							</span>
						</button>
					</>
				) : (
					<>
						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={handleClearColumn}
							type="button"
						>
							<Circle className="size-4 stroke-1" />

							<span>Clear column</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertColumnsLeft(1)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>Insert one colum left</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertColumnsRight(1)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>Insert one colum right</span>
						</button>
					</>
				)}

				<hr className="border-border-smooth  w-full" />

				<button
					className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-hidden onfocus:bg-destructive onfocus:text-accent-foreground gap-2 hover:bg-destructive active:brightness-125 group"
					onClick={handleDeleteColumns}
					type="button"
				>
					{isDeletingColumns ? (
						<Loader className="group-hover:border-t-secondary" />
					) : (
						matchIcon("trash", "group-hover:stroke-accent-foreground")
					)}

					<div className="flex flex-col items-start group-hover:text-white group-onfocus:text-white">
						<span>Delete column{columnsSelected > 1 ? "s" : ""}</span>

						<span className="text-xs text-muted-foreground group-hover:text-white group-onfocus:text-white">
							Can&apos;t be undone
						</span>
					</div>
				</button>
			</PopoverContent>
		</Popover>
	);
}
