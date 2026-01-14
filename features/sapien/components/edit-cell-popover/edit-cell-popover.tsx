import {
	GridCellKind,
	type BaseGridCell,
	type CustomCell,
	type GridCell,
	type ProvideEditorComponent,
} from "@glideapps/glide-data-grid";
import { invariant } from "es-toolkit";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useRef } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { createUUID, isValidNumber, noop } from "#/helpers/utils";
import { useOnMount } from "#/hooks/use-on-mount";
import {
	BatchTableMetadataColumnType,
	type BatchTableColumnIndex,
	type BatchTableRowIndex,
} from "#/types/batch-table";
import { useTableUIStore } from "../../contexts/table-ui";
import {
	useBatchTableCellByCoords,
	useBatchTableColumnByIndex,
	useColumnType,
	useIsDerivedColumn,
} from "../../hooks/get/use-fetch-batch-table-by-id";
import { makeCellCoords } from "../../lib/utils";
import { KeepFocusOnPlateEditor } from "../mention-input/KeepFocusOnPlateEditor";
import { BATCH_TABLE_CELL_EDITOR_PLUGINS } from "../mention-input/useMentionInputEditor";
import { JsonCellEditor } from "./json-cell-editor";
import { Sources } from "./sources";
import { ToolOutputs } from "./tool-outputs";
import {
	convertPlateValueToStringOrNumber,
	useGetInitialPlateValue,
} from "./utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { FileCellEditor } from "./file-cell-editor";

export const EditCellPopover: ProvideEditorComponent<GridCell> = (props) => {
	const tableUIStore = useTableUIStore();
	const gridSelection = tableUIStore.use.gridSelection();

	const colIndex = gridSelection?.current?.cell[0] as
		| BatchTableColumnIndex
		| undefined;
	const rowIndex = gridSelection?.current?.cell[1] as
		| BatchTableRowIndex
		| undefined;

	invariant(isValidNumber(colIndex), "Expected a valid number for colIndex");
	invariant(isValidNumber(rowIndex), "Expected a valid number for rowIndex");

	const cellCoords = makeCellCoords(rowIndex, colIndex);

	const batchTableCell = useBatchTableCellByCoords(cellCoords);
	const plateInitialValue = useGetInitialPlateValue(batchTableCell);
	const batchTableColumn = useBatchTableColumnByIndex(colIndex);
	const isDerivedColumn = useIsDerivedColumn(colIndex);
	const columnType = useColumnType(colIndex);
	const editor = usePlateEditor({
		plugins: BATCH_TABLE_CELL_EDITOR_PLUGINS,
		value: plateInitialValue,
		id: createUUID(),
	});

	const inputRef = useRef<HTMLInputElement | null>(null);
	const wasEscPressedRef = useRef(false);

	function handleModifyCellValue() {
		if (wasEscPressedRef.current) {
			return;
		}

		if (
			batchTableColumn?.column_type === BatchTableMetadataColumnType.FILE ||
			batchTableColumn?.column_type === BatchTableMetadataColumnType.JSON
		) {
			return;
		}

		const plateValueAsTextOrNumber = convertPlateValueToStringOrNumber(
			editor.children,
		);

		let newGridCell: GridCell = props.value;

		const meta: BaseGridCell["meta"] = {
			aiFillStatus: batchTableCell?.ai_fill_status,
		};

		switch (batchTableColumn?.column_type) {
			case BatchTableMetadataColumnType.NUMBER: {
				const displayValue = `${plateValueAsTextOrNumber}`;
				const data = Number(displayValue || undefined);

				if (!isValidNumber(data)) {
					toast({
						description: `The value "${displayValue}" is not a valid number.`,
						variant: ToastVariant.Destructive,
						title: "Invalid Number",
					});

					return;
				}

				newGridCell = {
					displayData: `${displayValue}`,
					kind: GridCellKind.Number,
					allowOverlay: true,
					readonly: false,
					data,
					meta,
				};

				break;
			}

			default: {
				const displayValue = `${plateValueAsTextOrNumber}`;

				newGridCell = {
					displayData: displayValue,
					kind: GridCellKind.Text,
					allowOverlay: true,
					data: displayValue,
					readonly: false,
					meta,
				};

				break;
			}
		}

		props.onFinishedEditing(newGridCell);
	}

	// [START-SAVE] When user clicks outside the popover, save the changes:
	const ref = useRef(handleModifyCellValue);
	// eslint-disable-next-line react-hooks/refs
	ref.current = handleModifyCellValue;

	const noopRef = useRef(noop);

	useOnMount(noopRef, ref);
	// [END-SAVE]

	function handleOnKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
		const isShiftPressed = e.shiftKey;

		switch (e.key) {
			case "Enter": {
				if (isShiftPressed) return;

				e.nativeEvent.stopImmediatePropagation();
				e.stopPropagation();
				e.preventDefault();

				// if (isMentionsPopoverOpen) break;

				handleModifyCellValue();

				break;
			}

			case "Escape": {
				wasEscPressedRef.current = true;

				break;
			}

			default:
				break;
		}
	}

	function closePopover(newGridCell: GridCell) {
		props.onFinishedEditing(newGridCell, [0, 0]);
	}

	return (
		<DefaultSuspenseAndErrorBoundary
			failedText="Error rendering cell details!"
			fallbackFor="cell details"
		>
			<div className="min-h-[2lh] flex flex-col">
				<div className="size-2 flex-none"></div>

				{isDerivedColumn ? (
					<span className="min-h-[1.5lh] text-primary">{`${batchTableCell?.value ?? ""}`}</span>
				) : (
					<Plate editor={editor}>
						<PlateContent
							className="w-full h-full relative min-h-[1.5lh] select-text bg-transparent outline-hidden px-2 font-medium text-primary simple-scrollbar"
							onKeyDown={handleOnKeyDown}
							ref={inputRef}
						/>

						<KeepFocusOnPlateEditor />
					</Plate>
				)}

				<div className="size-2 flex-none"></div>

				{batchTableCell?.sources ? (
					<Sources sources={batchTableCell.sources} />
				) : null}

				{batchTableCell?.tool_outputs ? (
					<div className="flex flex-col min-h-full items-center justify-center gap-2 p-2 text-left bg-notebook border-t border-border-smooth text-primary">
						<ToolOutputs outputs={batchTableCell.tool_outputs} />
					</div>
				) : null}

				{(() => {
					if (isDerivedColumn) {
						return (
							<div className="bg-notebook p-2 text-xs border-t border-border-smooth text-muted-foreground">
								Derived cells should be configured in the column options
								dropdown
							</div>
						);
					}

					switch (columnType) {
						case BatchTableMetadataColumnType.JSON: {
							return (
								<JsonCellEditor
									gridCell={props.value as CustomCell}
									batchTableCell={batchTableCell}
									close={closePopover}
								/>
							);
						}

						case BatchTableMetadataColumnType.FILE: {
							return (
								<FileCellEditor
									gridCell={props.value as CustomCell}
									batchTableCell={batchTableCell}
									columnIndex={colIndex}
									close={closePopover}
									rowIndex={rowIndex}
								/>
							);
						}

						default: {
							return null;
						}
					}
				})()}
			</div>
		</DefaultSuspenseAndErrorBoundary>
	);
};
