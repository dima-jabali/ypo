import { ChevronDown, SparklesIcon, Trash } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo, useState } from "react";

import {
	useTableUIStore,
	useWithOpenedCellContextMenu,
	WithOpenedCellContextMenu,
} from "../contexts/table-ui";
import {
	useBatchTableCellByCoords,
	useIsFromFileColumn,
} from "../hooks/get/use-fetch-batch-table-by-id";
import {
	BatchTablePatchType,
	RunAgentDataType,
	usePatchBatchTableById,
} from "../hooks/patch/use-patch-batch-table-by-id";
import { makeCellCoords } from "../lib/utils";
import { calcSelectedCells } from "./canvas-table/utils";
import { Popover, PopoverContent } from "#/components/Popover";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/dropdown-menu";

export function CellContextMenuPopover() {
	return (
		<WithOpenedCellContextMenu>
			<CellCtxMenuWithAllDefined />
		</WithOpenedCellContextMenu>
	);
}

enum RunSelectionMode {
	RunSelectionIfError = "Run selection only if there's an error",
	RunSelectionIfFailed = "Run selection only if it failed",
	ForceRunSelection = "Force run selection",
	RunSelection = "Run selection",
}

function CellCtxMenuWithAllDefined() {
	const [runMode, setRunMode] = useState<RunSelectionMode>(
		RunSelectionMode.RunSelection,
	);

	const { left, columnIndex, top, rowIndex } = useWithOpenedCellContextMenu();
	const tableUIStore = useTableUIStore();
	const pushToUndoStackAndRun = tableUIStore.use.pushToUndoStackAndRun();
	const isFromFileColumn = useIsFromFileColumn(columnIndex);
	const organizationId = tableUIStore.use.organizationId();
	const gridSelection = tableUIStore.use.gridSelection();
	const batchTableId = tableUIStore.use.batchTableId();
	const runPatchBatchTable = usePatchBatchTableById();

	const cellCoords = makeCellCoords(rowIndex, columnIndex);
	const batchTableCell = useBatchTableCellByCoords(cellCoords);

	const selectedTableCells = useMemo(
		() => calcSelectedCells(gridSelection),
		[gridSelection],
	);

	if (!gridSelection) return null;

	const shouldCtxMenuActOnSelectionRange = selectedTableCells.length > 1;

	function closeCtxMenu() {
		tableUIStore.setState({
			openedCellContextMenu: null,
		});
	}

	function handleRunSelectedCells() {
		const onlyIfFailed = runMode === RunSelectionMode.RunSelectionIfFailed;
		const onlyIfError = runMode === RunSelectionMode.RunSelectionIfError;
		const force = runMode === RunSelectionMode.ForceRunSelection;

		runPatchBatchTable.mutate({
			ignoreUpdates: false,
			organizationId,
			batchTableId,
			updates: [
				{
					type: BatchTablePatchType.RunAgent,
					data: {
						data: [
							{
								type: RunAgentDataType.SelectCells,
								data: {
									cell_coordinates: selectedTableCells,
								},
							},
						],
						only_try_errored_cells: onlyIfError,
						only_try_failed_cells: onlyIfFailed,
						force,
					},
				},
			],
		});

		closeCtxMenu();
	}

	function handleRunThisCell() {
		const onlyIfFailed = runMode === RunSelectionMode.RunSelectionIfFailed;
		const onlyIfError = runMode === RunSelectionMode.RunSelectionIfError;
		const force = runMode === RunSelectionMode.ForceRunSelection;

		runPatchBatchTable.mutate({
			ignoreUpdates: false,
			organizationId,
			batchTableId,
			updates: [
				{
					type: BatchTablePatchType.RunAgent,
					data: {
						data: [
							{
								type: RunAgentDataType.SelectCells,
								data: {
									cell_coordinates: [
										{
											column_index: columnIndex,
											row_index: rowIndex,
										},
									],
								},
							},
						],
						only_try_errored_cells: onlyIfError,
						only_try_failed_cells: onlyIfFailed,
						force,
					},
				},
			],
		});

		closeCtxMenu();
	}

	function handleDeleteFiles() {
		if (!isFromFileColumn) return;

		pushToUndoStackAndRun(
			{
				undos: [
					{
						type: BatchTablePatchType.UpdateCell,
						data: {
							formula: batchTableCell?.formula,
							format: batchTableCell?.format,
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
							row_index: rowIndex,
							formula: null,
							format: null,
							value: null,
						},
					},
				],
			},
			true,
		);

		closeCtxMenu();
	}

	function ForceRunCells() {
		const onClick = shouldCtxMenuActOnSelectionRange
			? handleRunSelectedCells
			: handleRunThisCell;

		return (
			<DropdownMenu>
				<div className="flex items-center gap-1">
					<button
						className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm button-hover-accent gap-2 font-bold group w-full"
						onClick={onClick}
					>
						<SparklesIcon className="size-3.5 stroke-warning group-hover:stroke-white group-focus:stroke-white" />

						<span className="whitespace-nowrap">{runMode}</span>
					</button>

					<DropdownMenuTrigger
						className="flex cursor-default select-none items-center justify-center rounded-sm text-sm button-hover-accent gap-2 font-bold group h-8 aspect-square"
						title="Run mode"
					>
						<ChevronDown className="size-3.5" />
					</DropdownMenuTrigger>
				</div>

				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						onValueChange={(value) => setRunMode(value as RunSelectionMode)}
						value={runMode}
					>
						<DropdownMenuRadioItem value={RunSelectionMode.RunSelection}>
							{RunSelectionMode.RunSelection}
						</DropdownMenuRadioItem>

						<DropdownMenuRadioItem value={RunSelectionMode.ForceRunSelection}>
							{RunSelectionMode.ForceRunSelection}
						</DropdownMenuRadioItem>

						<DropdownMenuRadioItem value={RunSelectionMode.RunSelectionIfError}>
							{RunSelectionMode.RunSelectionIfError}
						</DropdownMenuRadioItem>

						<DropdownMenuRadioItem
							value={RunSelectionMode.RunSelectionIfFailed}
						>
							{RunSelectionMode.RunSelectionIfFailed}
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
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
				side="bottom"
				align="start"
			>
				{isFromFileColumn ? (
					<button
						className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-white gap-2 hover:bg-accent hover:text-white group"
						onClick={handleDeleteFiles}
					>
						<Trash className="size-3.5 stroke-destructive group-hover:text-white group-focus:text-white" />

						<span>Delete files from this cell</span>
					</button>
				) : (
					// eslint-disable-next-line react-hooks/static-components
					<ForceRunCells />
				)}
			</PopoverContent>
		</Popover>
	);
}
