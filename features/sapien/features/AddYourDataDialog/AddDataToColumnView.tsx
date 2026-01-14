import { useRef, useState } from "react";

import { Button } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	useWithBatchTableId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { getErrorMessage } from "#/helpers/utils";
import { useForceRender } from "#/hooks/use-force-render";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
	type BatchTablePatchUpdateRequest,
} from "../../hooks/patch/use-patch-batch-table-by-id";
import { BulkAddFilesToFilesColumn } from "./BulkAddFilesToFilesColumn";
import { BulkAddView } from "./BulkAddView";
import { SelectColumnToAddDataTo } from "./SelectColumnToAddDataTo";
import type { DataToAddToColumn } from "./common";
import {
	BatchTableMetadataColumnType,
	type BatchTableColumn,
} from "#/types/batch-table";

type Props = {
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DEFAULT_DATA_TO_ADD_TO_COLUMN: DataToAddToColumn = {
	columnToAddDataTo: null,
	bulkAdd: undefined,
};

export function AddDataToColumnView({ setIsAddDataDialogOpen }: Props) {
	const [isAddingData, setIsAddingData] = useState(false);

	const dataRef = useRef({ ...DEFAULT_DATA_TO_ADD_TO_COLUMN });

	const runAgentPatch = usePatchBatchTableById();
	const organizationId = useWithOrganizationId();
	const batchTableId = useWithBatchTableId();
	const forceRender = useForceRender();

	const isAnyColumnSelected = Boolean(dataRef.current.columnToAddDataTo);
	const isFilesColumnSelected =
		dataRef.current.columnToAddDataTo?.column_type ===
		BatchTableMetadataColumnType.FILE;

	const canSaveAddDataToColumns =
		!!dataRef.current.columnToAddDataTo?.tool_settings;

	console.log({ dataRef });

	function handleSelectColumnToAddDataTo(column: BatchTableColumn) {
		dataRef.current.columnToAddDataTo = column;

		forceRender();
	}

	async function handleSaveAddDataToColumns() {
		try {
			setIsAddingData(true);

			const updates: Array<BatchTablePatchUpdateRequest> = [];

			console.log({ dataRef });

			const { entitySuggestions, columnToAddDataTo } = dataRef.current;

			// Tool settings:
			if (!columnToAddDataTo || !columnToAddDataTo.tool_settings) {
				console.error("No column to add data to!", { columnToAddDataTo });

				return;
			}

			updates.push({
				type: BatchTablePatchType.UpdateColumn,
				data: {
					tool_settings: columnToAddDataTo.tool_settings,
					column_index: columnToAddDataTo.column_index,
					column_type: columnToAddDataTo.column_type,
					uuid: columnToAddDataTo.uuid,
				},
			});

			if (dataRef.current.bulkAdd) {
				updates.push({
					type: BatchTablePatchType.ApproveEntitySuggestions,
					data: dataRef.current.bulkAdd.map((value) => ({
						name: value,
						sources: [],
					})),
				});
			}

			if (entitySuggestions) {
				updates.push({
					type: BatchTablePatchType.ApproveEntitySuggestions,
					data: entitySuggestions,
				});
			}

			await runAgentPatch.mutateAsync({
				ignoreUpdates: false,
				organizationId,
				batchTableId,
				updates,
			});

			setIsAddDataDialogOpen(false);
		} catch (error) {
			console.error("Failed to save add data to columns!", error);

			toast({
				title: "Failed to save data to add to columns!",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsAddingData(false);
		}
	}

	return (
		<div className="flex flex-col h-full w-full justify-between gap-8">
			<section className="flex flex-col px-1 gap-8 w-full h-full simple-scrollbar">
				<SelectColumnToAddDataTo
					defaultValue={dataRef.current.columnToAddDataTo}
					onSelect={handleSelectColumnToAddDataTo}
				/>

				{isFilesColumnSelected ? (
					<BulkAddFilesToFilesColumn
						setIsAddDataDialogOpen={setIsAddDataDialogOpen}
						dataRef={dataRef}
					/>
				) : isAnyColumnSelected ? (
					<BulkAddView dataRef={dataRef} />
				) : null}
			</section>

			<section className="flex flex-none flex-col gap-[23px]">
				{isFilesColumnSelected ? null : (
					<DialogFooter className="flex w-full items-center mt-auto">
						<Button
							title={
								canSaveAddDataToColumns
									? undefined
									: "Select a column to add data to."
							}
							onClick={handleSaveAddDataToColumns}
							disabled={!canSaveAddDataToColumns}
							isLoading={isAddingData}
							variant="success"
						>
							Add{isAddingData ? "ing" : ""} data{isAddingData ? "..." : ""}
						</Button>
					</DialogFooter>
				)}

				<div className="min-h-[1px]">{/* To prevent margin collapse! */}</div>
			</section>
		</div>
	);
}
