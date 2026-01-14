import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "#/components/Button";
import { toast } from "#/components/Toast/useToast";
import {
	generalContextStore,
	useWithBatchTableId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import {
	createBatchTableCellUuid,
	getErrorMessage,
	getIsBatchTableCellEmpty,
	isValidNumber,
} from "#/helpers/utils";
import { matchIcon } from "#/icons/match-icon";
import type { BatchTableRowIndex } from "#/types/batch-table";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
	type BatchTablePatchUpdateRequest,
} from "../../hooks/patch/use-patch-batch-table-by-id";
import { makeCellCoords } from "../../lib/utils";
import type { DataToAddToColumn } from "./common";
import { uploadFilesToBackend } from "./postFilesHelper";
import { useWebsocketStore } from "#/contexts/Websocket/context";

function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
	e.preventDefault();

	if (!e.dataTransfer) return;

	e.dataTransfer.effectAllowed = "copy";
	e.dataTransfer.dropEffect = "copy";
}

export function BulkAddFilesToFilesColumn({
	dataRef,
	setIsAddDataDialogOpen,
}: {
	dataRef: React.RefObject<DataToAddToColumn>;
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const [files, setFiles] = useState<File[]>([]);

	const addFilesInputRef = useRef<HTMLInputElement>(null);

	const organizationId = useWithOrganizationId();
	const runAgentPatch = usePatchBatchTableById();
	const websocketStore = useWebsocketStore();
	const batchTableId = useWithBatchTableId();

	function clearFiles() {
		setFiles([]);

		if (addFilesInputRef.current) {
			addFilesInputRef.current.value = "";
		}
	}

	async function handleShowFilesPreviewOnMessageInput(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		const files = e.target.files;

		if (!files || files.length === 0) return;

		setFiles((prev) => [...prev, ...files]);
	}

	function handleRemoveFile(file: File) {
		setFiles((prev) => {
			const next = prev.filter((f) => f !== file);

			if (next.length === 0) {
				clearFiles();
			}

			return next;
		});
	}

	async function handleDroppedFiles(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();

		const files = event.dataTransfer?.files;

		if (!files || files.length === 0) {
			return;
		}

		setFiles((prev) => [...prev, ...files]);
	}

	async function uploadFilesToCell() {
		if (isUploading || files.length === 0) return;

		setIsUploading(true);

		const columnIndexToAddTo = dataRef.current.columnToAddDataTo?.column_index;

		try {
			if (!isValidNumber(columnIndexToAddTo)) {
				throw new Error("Invalid column index to add to!");
			}

			const uploadedFiles = await uploadFilesToBackend({
				tryToSubscribeToFileUpdates: websocketStore.tryToSubscribeToFileUpdates,
				files: [...files],
				organizationId,
			});

			if (uploadedFiles.length === 0) {
				return;
			}

			const updates: Array<BatchTablePatchUpdateRequest> = [];

			const batchTable = generalContextStore
				.getState()
				.getBatchTable(organizationId, batchTableId);

			let rowIndex = 0 as BatchTableRowIndex;
			let uploadedFileIndex = 0;
			while (uploadedFileIndex < uploadedFiles.length) {
				const cell = batchTable?.cells.get(
					makeCellCoords(rowIndex, columnIndexToAddTo),
				);

				if (cell) {
					// If this cell exists, check if it is empty. If it is, just keep going. If it is not empty, then let's try the next row.
					const isCellEmpty = getIsBatchTableCellEmpty(cell);

					if (!isCellEmpty) {
						++rowIndex;

						continue;
					}
				}

				const file = uploadedFiles[uploadedFileIndex];

				const update: BatchTablePatchUpdateRequest = {
					type: BatchTablePatchType.UpdateCell,
					data: {
						uuid: cell?.uuid ?? createBatchTableCellUuid(),
						column_index: columnIndexToAddTo,
						row_index: rowIndex,
						value: [file],
						formula: null,
						format: null,
					},
				};

				updates.push(update);

				++uploadedFileIndex;
				++rowIndex;
			}

			await runAgentPatch.mutateAsync({
				ignoreUpdates: false,
				organizationId,
				batchTableId,
				updates,
			});

			setIsAddDataDialogOpen(false);
			clearFiles();
		} catch (error) {
			console.error("Error uploading files and appending to cell:", {
				error,
			});

			toast({
				title: "Error uploading files and appending to cell",
				description: getErrorMessage(error),
			});
		} finally {
			setIsUploading(false);
		}
	}

	function handleChooseFiles() {
		addFilesInputRef.current?.click();
	}

	return (
		<div
			className="flex flex-col h-full w-full gap-6 justify-between"
			onDragStart={handleDragStart}
			onDragEnter={handleDragStart}
			onDragOver={handleDragStart}
			onDrop={handleDroppedFiles}
		>
			<section
				className="flex h-full w-full gap-4 simple-scrollbar border-dashed border-2 border-border-smooth rounded-lg p-2 overflow-x-hidden data-[pointer-cursor=true]:cursor-pointer data-[pointer-cursor=true]:hover:border-accent"
				data-pointer-cursor={files.length === 0}
				onClick={() => {
					if (files.length === 0) {
						handleChooseFiles();
					}
				}}
			>
				{files.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{files.map((file, index) => (
							<div
								className="relative flex flex-none gap-2 p-2 items-center group min-w-52 h-10 rounded-md border border-border-smooth "
								key={index}
							>
								<button
									className="absolute p-0.5 hover:bg-slate-200 bg-slate-300 active:bg-slate-400 -right-1.5 -top-1.5 invisible group-hover:visible rounded-full"
									onClick={() => handleRemoveFile(file)}
									title="Remove file"
								>
									<X className="size-3 stroke-black" />
								</button>

								{matchIcon(file.type)}

								<p className="truncate" title={file.name}>
									{file.name}
								</p>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 h-full w-full">
						<Upload className="size-6 stroke-primary stroke-1" />
					</div>
				)}
			</section>

			<section className="gap-4 justify-between items-center w-full flex">
				<Button onClick={handleChooseFiles} size="sm">
					Choose files
				</Button>

				<div className="flex gap-2">
					<Button
						disabled={files.length === 0}
						onClick={uploadFilesToCell}
						isLoading={isUploading}
						variant="success"
						size="sm"
					>
						Upload
					</Button>
				</div>
			</section>

			<div className="min-h-[1px]">{/* To prevent margin collapse! */}</div>

			<input
				onChange={handleShowFilesPreviewOnMessageInput}
				ref={addFilesInputRef}
				className="hidden"
				accept=".pdf"
				type="file"
				multiple
			/>
		</div>
	);
}
