import { PlusIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { invariant } from "es-toolkit";

import { useUploadAndIndexFiles } from "../../hooks/post/use-upload-and-index-files";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
	type BatchTablePatchUpdateRequest,
} from "../../hooks/patch/use-patch-batch-table-by-id";
import {
	generalContextStore,
	useWithBatchTableId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import {
	useColumnsCount,
	useRowsCount,
} from "../../hooks/get/use-fetch-batch-table-by-id";
import {
	BatchTableMetadataColumnType,
	type BatchTableColumn,
	type BatchTableColumnId,
} from "#/types/batch-table";
import {
	createBatchTableCellUuid,
	createBatchTableColumnUuid,
	getErrorMessage,
} from "#/helpers/utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { matchIcon } from "#/icons/match-icon";
import { Button } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { makeCellCoords } from "../../lib/utils";

type Props = {
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AddFilesView({ setIsAddDataDialogOpen }: Props) {
	const [isAddingData, setIsAddingData] = useState(false);
	const [files, setFiles] = useState<Array<File>>([]);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const uploadFilesMutation = useUploadAndIndexFiles();
	const runPatchBatchTable = usePatchBatchTableById();
	const organizationId = useWithOrganizationId();
	const batchTableId = useWithBatchTableId();
	const columnsLength = useColumnsCount();
	const rowsLength = useRowsCount();

	const handleOpenFileChooser = () => {
		fileInputRef.current?.click();
	};

	const handleFilesChosen = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;

		if (!files || files.length === 0) return;

		setFiles((prev) => [...prev, ...files]);
	};

	const handleRemoveFile = (file: File) => {
		setFiles((prev) => prev.filter((f) => f !== file));
	};

	const handleUploadFileAndAppendToFileColumn = async () => {
		if (files.length === 0 || uploadFilesMutation.isPending) return;

		try {
			setIsAddingData(true);

			const { uploadedFileIds } = await uploadFilesMutation.mutateAsync(files);

			if (uploadedFileIds.length === 0) {
				return;
			}

			// If there's no file column, we need to create one:
			// Add to first file column:
			let firstFileColumn: BatchTableColumn | undefined;

			const batchTable = generalContextStore
				.getState()
				.getBatchTable(organizationId, batchTableId);
			const columns = batchTable?.columns;

			invariant(columns, "Columns not found");

			for (const col of columns.values()) {
				if (col.column_type === BatchTableMetadataColumnType.FILE) {
					firstFileColumn = col;

					break;
				}
			}

			if (!firstFileColumn) {
				const createFileColumUpdatesResponse =
					await runPatchBatchTable.mutateAsync({
						ignoreUpdates: false,
						organizationId,
						batchTableId,
						updates: [
							{
								type: BatchTablePatchType.AddColumn,
								data: {
									column_type: BatchTableMetadataColumnType.FILE,
									uuid: createBatchTableColumnUuid(),
									id: NaN as BatchTableColumnId,
									column_index: columnsLength,
									name: "Files",
								},
							},
						],
					});

				if ("error" in createFileColumUpdatesResponse) {
					throw new Error(
						createFileColumUpdatesResponse.error ||
							"Unknown error creating File Column!",
					);
				}

				const newFileColumn = createFileColumUpdatesResponse.updates.find(
					(update) => update.type === BatchTablePatchType.AddColumn,
				);

				if (newFileColumn) {
					firstFileColumn = newFileColumn.data;
				} else {
					throw new Error("Failed to create File Column. Please, try again!");
				}
			}

			// We will only add the file to the cells that are under the Files Column:
			const updateCells: Array<BatchTablePatchUpdateRequest> = [];

			let rowIndex = rowsLength;
			uploadedFileIds.forEach((fileId) => {
				const cell = batchTable?.cells.get(
					makeCellCoords(rowIndex, firstFileColumn.column_index),
				);

				updateCells.push({
					data: {
						column_index: firstFileColumn.column_index,
						uuid: cell?.uuid ?? createBatchTableCellUuid(),
						value: [{ id: fileId }],
						row_index: rowIndex,
						formula: null,
						format: null,
					},
					type: BatchTablePatchType.UpdateCell,
				});

				++rowIndex;
			});

			if (updateCells.length === 0) {
				toast({
					variant: ToastVariant.Destructive,
					description: "Please, try again!",
					title: "Failed to update cells",
				});

				return;
			}

			await runPatchBatchTable.mutateAsync({
				ignoreUpdates: false,
				updates: updateCells,
				organizationId,
				batchTableId,
			});

			setIsAddDataDialogOpen(false);
		} catch (error) {
			console.error("Error uploading files and appending to Files Column:", {
				error,
			});

			toast({
				title: "Error uploading files and appending to Files Column",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsAddingData(false);
		}
	};

	return (
		<div className="flex flex-col min-h-1 h-full w-full gap-6 justify-between">
			<section
				className="flex min-h-1 h-full flex-col gap-4 simple-scrollbar"
				arial-label="Selected files to add"
			>
				<input
					accept=".pdf,.pptx,.ppt,.docx,.doc,.csv"
					onChange={handleFilesChosen}
					ref={fileInputRef}
					className="hidden"
					type="file"
					multiple
				/>

				{files.length > 0 ? (
					<ul className="flex flex-wrap gap-2 p-2 simple-scrollbar max-h-full max-w-full">
						{files.map((file) => (
							<li
								className="relative group flex items-center gap-3 max-w-full h-10 rounded-md border border-border-smooth  p-3"
								key={file.name}
							>
								{matchIcon(file.type)}

								<span className="text-sm truncate">{file.name}</span>

								<button
									className="absolute p-0.5 hover:bg-slate-200 bg-slate-300 active:bg-slate-400 -right-2 invisible group-hover:visible rounded-full z-50"
									onClick={() => handleRemoveFile(file)}
									title="Remove file"
								>
									<X className="size-3 stroke-black" />
								</button>
							</li>
						))}
					</ul>
				) : null}

				<Button
					title="Add file (PDF, DOCX, PPTX)"
					onClick={handleOpenFileChooser}
					className="mt-auto"
					variant="purple"
				>
					<PlusIcon className="size-4" />

					<span>Choose files</span>
				</Button>

				<p className="text-xs text-muted-foreground text-center">
					Accepted file types: CSV, PDF, Microsoft Word, Microsoft PowerPoint.
				</p>
			</section>

			<section className="flex flex-col gap-[23px]">
				<DialogFooter className="flex w-full items-center">
					<Button
						onClick={handleUploadFileAndAppendToFileColumn}
						isLoading={isAddingData}
						variant="success"
					>
						Add{isAddingData ? "ing" : ""} file(s){isAddingData ? "..." : ""}
					</Button>
				</DialogFooter>

				<div className="min-h-[1px]">{/* To prevent margin collapse! */}</div>
			</section>
		</div>
	);
}
