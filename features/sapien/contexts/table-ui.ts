import {
	CompactSelection,
	type GridSelection,
	type Theme,
} from "@glideapps/glide-data-grid";
import { invariant } from "es-toolkit";
import { useEffect, useLayoutEffect, type PropsWithChildren } from "react";

import { createZustandProvider } from "#/contexts/create-zustand-provider";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import {
	type BatchTableCellUuid,
	type BatchTableColumnIndex,
	type BatchTableRowIndex,
	type CellCoords,
} from "#/types/batch-table";
import { type BatchTableId, type OrganizationId } from "#/types/general";
import type { NormalizedBatchTable } from "../hooks/get/use-fetch-batch-table-by-id";
import type { BatchTablePatchUpdateRequest } from "../hooks/patch/use-patch-batch-table-by-id";
import { applyPatchUpdateRequestsToBatchTable } from "../lib/apply-updates-to-batch-table";
import type { DiffBatchTableContextData } from "./diff-store/diff-store";
import {
	CustomWindowEvents,
	type RefreshBatchTableCanvasEventDetail,
} from "./window-events";

export type FilesBeingUploaded = Map<
	CellCoords,
	{
		bytesParagraphRef: React.RefObject<HTMLParagraphElement | null> | null;
		progressRef: React.RefObject<HTMLProgressElement | null> | null;
	}
>;

export type TableRange = {
	startCol: BatchTableColumnIndex;
	endCol: BatchTableColumnIndex;
	startRow: BatchTableRowIndex;
	endRow: BatchTableRowIndex;
};

export type UndoRedo = {
	undos: Array<BatchTablePatchUpdateRequest>;
	redos: Array<BatchTablePatchUpdateRequest>;
};

export type TableUIData = {
	openedColumnOptions: {
		columnIndex: BatchTableColumnIndex;
		left: number;
		top: number;
	} | null;
	openedColumnContextMenu: {
		columnIndex: BatchTableColumnIndex;
		left: number;
		top: number;
	} | null;
	openedRowHeaderContextMenu: {
		rowIndex: BatchTableRowIndex;
		left: number;
		top: number;
	} | null;
	openedCellContextMenu: {
		columnIndex: BatchTableColumnIndex;
		rowIndex: BatchTableRowIndex;
		left: number;
		top: number;
	} | null;
	openedHoverCardCellWithUUID: BatchTableCellUuid | null;
	openedUploadFileCellCoords: CellCoords | null;
	isDraggingFileOverCell: CellCoords | null;
	filesBeingUploaded: FilesBeingUploaded;
	isDateChooserPopoverOpen: boolean;

	diffStore: DiffBatchTableContextData;
	isSelectingRangeForFormula: boolean;
	theme: Partial<Theme>;
	isChatOpen: boolean;

	pushToUndoStackAndRun(undoRedo: UndoRedo, applyImmediately?: boolean): void;
	redoStack: ReadonlyArray<UndoRedo>;
	undoStack: ReadonlyArray<UndoRedo>;
	gridSelection: GridSelection;
	maxHistoryLength: number;
	rerenderCanvas: boolean;

	organizationId: OrganizationId;
	batchTableId: BatchTableId;

	getBatchTableData(): NormalizedBatchTable;
};

export const { useStore: useTableUIStore, Provider: TableUIProvider } =
	createZustandProvider<TableUIData>(
		(get, set) =>
			({
				openedHoverCardCellWithUUID: null,
				openedUploadFileCellCoords: null,
				openedRowHeaderContextMenu: null,
				isDateChooserPopoverOpen: false,
				filesBeingUploaded: new Map(),
				openedColumnContextMenu: null,
				isDraggingFileOverCell: null,
				openedCellContextMenu: null,
				openedColumnOptions: null,

				isSelectingRangeForFormula: false,
				isChatOpen: false,
				theme: {},

				organizationId: NaN as OrganizationId,
				batchTableId: NaN as BatchTableId,
				diffStore: null!,

				gridSelection: {
					columns: CompactSelection.empty(),
					rows: CompactSelection.empty(),
				},
				maxHistoryLength: 100,
				rerenderCanvas: true,
				undoStack: [],
				redoStack: [],

				getBatchTableData() {
					const { getBatchTable } = generalContextStore.getState();
					const { organizationId, batchTableId } = get();

					invariant(
						isValidNumber(organizationId),
						"Expected a valid number for organizationId",
					);
					invariant(
						isValidNumber(batchTableId),
						"Expected a valid number for batchTableId",
					);

					const batchTable = getBatchTable(organizationId, batchTableId);

					invariant(batchTable, "Expected a batch table to getCellContent");

					return batchTable;
				},

				pushToUndoStackAndRun(undoRedo, applyImmediately) {
					const {
						maxHistoryLength,
						organizationId,
						batchTableId,
						undoStack,
						diffStore,
					} = get();

					const nextUndoStack = [...undoStack, undoRedo];

					if (nextUndoStack.length > maxHistoryLength) {
						// Limit the size of the undo stack:
						nextUndoStack.shift();
					}

					applyPatchUpdateRequestsToBatchTable({
						updates: undoRedo.redos,
						organizationId,
						batchTableId,
					});

					if (applyImmediately) {
						diffStore.calcDiffOnBatchTableAndUpdateBackend();
					} else {
						diffStore.scheduleToDiffBatchTableAndUpdateBackend();
					}

					set((p) => ({
						rerenderCanvas: !p.rerenderCanvas,
						undoStack: nextUndoStack,
					}));
				},
			}) satisfies TableUIData,
		{
			name: "table-ui",
		},
	);

export function ListenToWindowsEvents() {
	const tableUIStore = useTableUIStore();

	useEffect(() => {
		function onRefreshCanvasEvent(
			e: CustomEvent<RefreshBatchTableCanvasEventDetail>,
		) {
			const { organizationId, batchTableId } = tableUIStore.getState();

			if (
				e.detail.batchTableId !== batchTableId ||
				e.detail.organizationId !== organizationId
			)
				return;

			console.log("Refreshed batch table canvas");

			tableUIStore.setState((p) => ({ rerenderCanvas: !p.rerenderCanvas }));
		}

		window.addEventListener(
			CustomWindowEvents.RefreshBatchTableCanvas,
			onRefreshCanvasEvent as EventListener,
		);

		return () => {
			window.removeEventListener(
				CustomWindowEvents.RefreshBatchTableCanvas,
				onRefreshCanvasEvent as EventListener,
			);
		};
	}, [tableUIStore]);

	return null;
}

export function HandleColorSchemeChange() {
	const colorScheme = generalContextStore.use.colorScheme();
	const tableUIStore = useTableUIStore();

	useLayoutEffect(() => {
		const computedStyles = window.getComputedStyle(document.body);

		const accentLight = computedStyles.getPropertyValue("--color-accent-light");
		const accentColor = computedStyles.getPropertyValue("--color-accent");
		const bgCell = computedStyles.getPropertyValue("--color-secondary");
		const textDark = computedStyles.getPropertyValue("--color-primary");
		const textLight = computedStyles.getPropertyValue("--color-muted");
		const fontFamily = computedStyles.getPropertyValue("--font-inter");
		const bgHeader = computedStyles.getPropertyValue("--color-aside");
		const borderColor = computedStyles.getPropertyValue(
			"--color-border-smooth",
		);
		const accentFg = computedStyles.getPropertyValue(
			"--color-accent-foreground",
		);
		const bgHeaderHasFocus = computedStyles.getPropertyValue(
			"--color-bg-header-has-focus",
		);
		const bgHeaderHovered = computedStyles.getPropertyValue(
			"--color-bg-header-hovered",
		);
		const textHeader = computedStyles.getPropertyValue(
			"--color-text-header-color",
		);

		const theme: Partial<Theme> = {
			textMedium: "#333",
			bgHeaderHasFocus,
			bgHeaderHovered,
			accentLight,
			borderColor,
			accentColor,
			fontFamily,
			textHeader,
			textLight,
			textDark,
			bgHeader,
			accentFg,
			bgCell,
		};

		// console.log("Applied table theme:", theme);

		tableUIStore.setState({ theme });
	}, [tableUIStore, colorScheme]);

	return null;
}

export function useWithOpenedColumnContextMenu() {
	const openedColumnContextMenu =
		useTableUIStore().use.openedColumnContextMenu();

	if (openedColumnContextMenu === null) {
		throw new Error(
			"useWithOpenedColumnContextMenuColumnIndex must be used within a WithOpenedColumnContextMenuColumnIndex component",
		);
	}

	return openedColumnContextMenu;
}

export function useWithOpenedColumnOptions() {
	const openedColumnOptions = useTableUIStore().use.openedColumnOptions();

	if (openedColumnOptions === null) {
		throw new Error(
			"useWithOpenedColumnContextMenuColumnIndex must be used within a WithOpenedColumnContextMenuColumnIndex component",
		);
	}

	return openedColumnOptions;
}
export function WithOpenedColumnOptions({ children }: PropsWithChildren) {
	const openedColumnOptions = useTableUIStore().use.openedColumnOptions();

	return openedColumnOptions === null ? null : children;
}

export function WithOpenedColumnContextMenu({ children }: PropsWithChildren) {
	const openedColumnContextMenuColumnIndex =
		useTableUIStore().use.openedColumnContextMenu();

	return openedColumnContextMenuColumnIndex === null ? null : children;
}

export function useWithOpenedRowHeaderContextMenu() {
	const openedRowHeaderContextMenu =
		useTableUIStore().use.openedRowHeaderContextMenu();

	if (openedRowHeaderContextMenu === null) {
		throw new Error(
			"useWithOpenedRowHeaderContextMenuRowIndex must be used within a WithOpenedRowHeaderContextMenuRowIndex component",
		);
	}

	return openedRowHeaderContextMenu;
}

export function WithOpenedRowHeaderContextMenu({
	children,
}: PropsWithChildren) {
	const openedRowHeaderContextMenu =
		useTableUIStore().use.openedRowHeaderContextMenu();

	return openedRowHeaderContextMenu === null ? null : children;
}

export function useWithOpenedCellContextMenu() {
	const openedCtxMenuCellCoords = useTableUIStore().use.openedCellContextMenu();

	if (openedCtxMenuCellCoords === null) {
		throw new Error(
			"useWithOpenedCellContextMenu must be used within a WithOpenedCellContextMenu component",
		);
	}

	return openedCtxMenuCellCoords;
}

export function WithOpenedCellContextMenu({ children }: PropsWithChildren) {
	const openedCtxMenuCellCoords = useTableUIStore().use.openedCellContextMenu();

	return openedCtxMenuCellCoords === null ? null : children;
}
