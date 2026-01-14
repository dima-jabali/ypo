import { Popover as PopoverPrimitive } from "radix-ui";
import { invariant, range } from "es-toolkit";
import { Circle } from "lucide-react";
import { useState } from "react";

import { Loader } from "#/components/Loader";
import { Popover, PopoverContent } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	createBatchTableRowUuid,
	getErrorMessage,
	isValidNumber,
} from "#/helpers/utils";
import { matchIcon } from "#/icons/match-icon";
import type { BatchTableRowIndex } from "#/types/batch-table";
import {
	useTableUIStore,
	useWithOpenedRowHeaderContextMenu,
	WithOpenedRowHeaderContextMenu,
	type UndoRedo,
} from "../contexts/table-ui";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
	type BatchTablePatchUpdateRequest,
} from "../hooks/patch/use-patch-batch-table-by-id";
import { useQuery } from "@tanstack/react-query";
import { CompactSelection } from "@glideapps/glide-data-grid";

export function RowContextMenuPopover() {
	return (
		<WithOpenedRowHeaderContextMenu>
			<RowCtxMenuWithAllDefined />
		</WithOpenedRowHeaderContextMenu>
	);
}

function RowCtxMenuWithAllDefined() {
	const [isDeletingRows, setIsDeletingRows] = useState(false);

	const tableUIStore = useTableUIStore();
	const pushToUndoStackAndRun = tableUIStore.use.pushToUndoStackAndRun();
	const { left, rowIndex, top } = useWithOpenedRowHeaderContextMenu();
	const gridSelection = tableUIStore.use.gridSelection();
	const runPatchBatchTable = usePatchBatchTableById();

	const rowsSelected = gridSelection?.rows.length ?? 0;
	const shouldCtxMenuActOnSelectionRange = rowsSelected > 1;
	const hasNoRowsSelected = rowsSelected === 0;

	useQuery({
		queryKey: [
			"row-context-menu-popover",
			"make-sure-at-least-one-row-is-selected",
			hasNoRowsSelected,
			rowIndex,
		],
		refetchOnWindowFocus: false,
		enabled: hasNoRowsSelected,
		refetchOnReconnect: false,
		staleTime: 0,
		gcTime: 0,
		queryFn: async () => {
			tableUIStore.setState({
				gridSelection: {
					rows: CompactSelection.fromSingleSelection(rowIndex),
					columns: CompactSelection.empty(),
				},
			});

			return null;
		},
	});

	function closeCtxMenu() {
		tableUIStore.setState({
			openedRowHeaderContextMenu: null,
		});
	}

	function handleClearRow() {
		// We're gonna clear all cells in this column.

		const { cells } = tableUIStore.getState().getBatchTableData();

		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		for (const cell of cells.values()) {
			const cellRowIndex = cell.row.row_index;

			if (cellRowIndex !== rowIndex) continue;

			const cellColumnIndex = cell.column.column_index;

			if (!isValidNumber(cellRowIndex)) {
				console.error("Invalid cell row index! This shouldn't happen!");

				continue;
			}

			undoRedo.undos.push({
				type: BatchTablePatchType.UpdateCell,
				data: {
					column_index: cellColumnIndex,
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
					column_index: cellColumnIndex,
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

	async function handleDeleteRows() {
		if (isDeletingRows) return;

		const firstRow = gridSelection?.rows.first() ?? rowIndex;
		const lastRow = gridSelection?.rows.last() ?? rowIndex;
		const max = Math.max(firstRow, lastRow);
		const min = Math.min(firstRow, lastRow);
		const numberOfRowsToDelete = max - min + 1;

		invariant(
			numberOfRowsToDelete > 0,
			"No rows to delete! This should never happen!",
		);

		const { getBatchTableData, organizationId, batchTableId } =
			tableUIStore.getState();
		const batchTable = getBatchTableData();

		const updates = range(numberOfRowsToDelete)
			.map((i) => {
				const rowIndex = (min + i) as BatchTableRowIndex;
				const batchTableColumn = batchTable.rows.get(rowIndex);
				const rowUuid = batchTableColumn?.uuid;

				console.log({
					rowIndex,
					batchTableColumn,
					rowUuid,
				});

				if (!rowUuid) return null;

				return {
					type: BatchTablePatchType.DeleteRow,
					data: { uuid: rowUuid },
				} satisfies BatchTablePatchUpdateRequest;
			})
			.filter(Boolean) as Array<BatchTablePatchUpdateRequest>;

		try {
			setIsDeletingRows(true);

			await runPatchBatchTable.mutateAsync({
				ignoreUpdates: false,
				organizationId,
				batchTableId,
				updates,
			});

			closeCtxMenu();
		} catch (error) {
			console.log("Error deleting row(s)!", {
				batchTable,
				error,
			});

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error deleting row(s)!",
			});
		} finally {
			setIsDeletingRows(false);
		}
	}

	function handleInsertRowsAbove(howMuch: number) {
		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		const start = (
			rowIndex - howMuch - 1 < 0 ? 0 : rowIndex - howMuch - 1
		) as BatchTableRowIndex;
		const end = (rowIndex - 1 < 0 ? 0 : rowIndex - 1) as BatchTableRowIndex;

		invariant(
			start !== end && start >= 0 && end >= 0 && start <= end,
			`Invalid start and end indexes. start: ${start}, end: ${end}`,
		);

		for (let i = start; i < rowIndex; ++i) {
			const newRowUuid = createBatchTableRowUuid();

			undoRedo.undos.push({
				type: BatchTablePatchType.DeleteRow,
				data: {
					uuid: newRowUuid,
				},
			});

			undoRedo.redos.push({
				type: BatchTablePatchType.AddRow,
				data: {
					uuid: newRowUuid,
					row_index: i,
				},
			});
		}

		tableUIStore.getState().pushToUndoStackAndRun(undoRedo, true);

		closeCtxMenu();
	}

	function handleInsertRowsBelow(howMuch: number) {
		const undoRedo: UndoRedo = {
			undos: [],
			redos: [],
		};

		const start = (rowIndex + 1) as BatchTableRowIndex;
		const end = (start + howMuch) as BatchTableRowIndex;

		invariant(
			end >= 0 && start <= end,
			`Invalid end index. start: ${start}, end: ${end}`,
		);

		for (let i = start; i < end; ++i) {
			const newRowUuid = createBatchTableRowUuid();

			undoRedo.undos.push({
				type: BatchTablePatchType.DeleteRow,
				data: {
					uuid: newRowUuid,
				},
			});

			undoRedo.redos.push({
				type: BatchTablePatchType.AddRow,
				data: {
					uuid: newRowUuid,
					row_index: i,
				},
			});
		}

		tableUIStore.getState().pushToUndoStackAndRun(undoRedo, true);

		closeCtxMenu();
	}

	return (
		<Popover open onOpenChange={closeCtxMenu}>
			<PopoverPrimitive.Anchor
				className="fixed size-1 pointer-events-none"
				style={{ left, top }}
			/>

			<PopoverContent
				className="flex flex-col gap-1 select-none max-h-[50vh] z-50 flex-1 min-w-64 p-1 rounded-md list-none text-primary"
				collisionPadding={50}
				sideOffset={-6}
				align="start"
				side="bottom"
			>
				{shouldCtxMenuActOnSelectionRange ? (
					<>
						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertRowsAbove(rowsSelected)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{rowsSelected}
								</span>{" "}
								rows above
							</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertRowsBelow(rowsSelected)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{rowsSelected}
								</span>{" "}
								rows below
							</span>
						</button>
					</>
				) : (
					<>
						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={handleClearRow}
							type="button"
						>
							<Circle className="size-4 stroke-1" />

							<span>Clear row</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertRowsAbove(1)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{rowsSelected}
								</span>{" "}
								row above
							</span>
						</button>

						<button
							className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm button-hover-accent gap-2 group"
							onClick={() => handleInsertRowsBelow(1)}
							type="button"
						>
							{matchIcon("+", "group-hover:stroke-accent-foreground")}

							<span>
								Insert{" "}
								<span className="text-accent group-hover:text-accent-foreground">
									{rowsSelected}
								</span>{" "}
								row below
							</span>
						</button>
					</>
				)}

				<hr className="border-border-smooth  w-full" />

				<button
					className="relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-hidden onfocus:bg-destructive onfocus:text-accent-foreground gap-2 hover:bg-destructive active:brightness-125 group"
					onClick={handleDeleteRows}
					type="button"
				>
					{isDeletingRows ? (
						<Loader className="group-hover:border-t-secondary" />
					) : (
						matchIcon("trash", "group-hover:stroke-accent-foreground")
					)}

					<div className="flex flex-col items-start group-hover:text-white group-onfocus:text-white">
						<span>Delete row{rowsSelected > 1 ? "s" : ""}</span>

						<span className="text-xs text-muted-foreground group-hover:text-white group-onfocus:text-white">
							Can&apos;t be undone
						</span>
					</div>
				</button>
			</PopoverContent>
		</Popover>
	);
}
