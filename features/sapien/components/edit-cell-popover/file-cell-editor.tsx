/* eslint-disable @typescript-eslint/no-explicit-any */

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { GridCell } from "@glideapps/glide-data-grid";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog";
import { DownloadAndShowFilePreview } from "#/components/download-and-show-file-preview";
import { getIsGoogleDriveFile } from "#/features/organization-files/components/utils";
import type {
	BatchTableCell,
	BatchTableColumnIndex,
	BatchTableRowIndex,
} from "#/types/batch-table";
import type { GeneralFile } from "#/types/notebook";
import { useTableUIStore } from "../../contexts/table-ui";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { getErrorMessage, handleDragStart } from "#/helpers/utils";
import { matchIcon } from "#/icons/match-icon";
import { Button, ButtonVariant } from "#/components/Button";
import { uploadFilesToBackend } from "../../features/AddYourDataDialog/postFilesHelper";
import { BatchTablePatchType } from "../../hooks/patch/use-patch-batch-table-by-id";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { useWebsocketStore } from "#/contexts/Websocket/context";

type Props = {
	batchTableCell: BatchTableCell | undefined;
	columnIndex: BatchTableColumnIndex;
	rowIndex: BatchTableRowIndex;
	gridCell: GridCell;
	close: (newGridCell: GridCell) => void;
};

export function FileCellEditor(props: Props) {
	const { batchTableCell } = props;

	const files =
		!!batchTableCell &&
		Array.isArray(batchTableCell.value) &&
		batchTableCell.value.length > 0
			? (batchTableCell.value as Array<GeneralFile>)
			: null;

	console.log({ batchTableCell, files });

	function closeWithoutSaving() {
		props.close(props.gridCell);
	}

	return (
		<Dialog open onOpenChange={closeWithoutSaving}>
			{files ? (
				<ShowFiles files={files} />
			) : (
				<UploadFilesDialogContent {...props} close={closeWithoutSaving} />
			)}
		</Dialog>
	);
}

function ShowFiles({ files }: { files: Array<GeneralFile> }) {
	return (
		<DialogContent className="z-100" overlayClassName="z-100">
			{files.map((file) => {
				if (getIsGoogleDriveFile(file)) {
					return (
						<a href={file.google_drive_url} className="link" target="_blank">
							{file.google_drive_url}
						</a>
					);
				}

				return (
					<li className="list-none" key={file.id}>
						<p className="text-center italic">{file.file_name}</p>

						<DownloadAndShowFilePreview fileType={file.type} fileId={file.id} />
					</li>
				);
			})}
		</DialogContent>
	);
}

function UploadFilesDialogContent({
	batchTableCell,
	columnIndex,
	rowIndex,
	gridCell,
	close,
}: Props) {
	const [isUploading, setIsUploading] = useState(false);
	const [files, setFiles] = useState<File[]>([]);

	const tableUIStore = useTableUIStore();
	const pushToUndoStackAndRun = tableUIStore.use.pushToUndoStackAndRun();
	const organizationId = useWithOrganizationId();
	const websocketStore = useWebsocketStore();

	const addFilesInputRef = useRef<HTMLInputElement>(null);

	/** Without triggering the onEditCell callback on DataGrid. We perform whatever updates are needed in this component. */
	function closeWithoutSaving() {
		close(gridCell);
	}

	function clearFiles() {
		setFiles([]);

		if (addFilesInputRef.current) {
			addFilesInputRef.current.value = "";
		}
	}

	function handleShowFilesPreviewOnMessageInput(
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

	function handleDroppedFiles(event: React.DragEvent<HTMLDivElement>) {
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

		try {
			const { tryToSubscribeToFileUpdates } = websocketStore;

			const uploadedFiles = await uploadFilesToBackend({
				files: [...files],
				organizationId,
				tryToSubscribeToFileUpdates,
			});

			if (uploadedFiles.length === 0) {
				console.error("No files uploaded! Can't update cell with file.");

				return;
			}

			if (batchTableCell) {
				const previousValue = batchTableCell.value as Array<GeneralFile>;

				if (Array.isArray(previousValue) && previousValue.length > 0) {
					uploadedFiles.push(...previousValue);
				}
			}

			pushToUndoStackAndRun({
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
							value: uploadedFiles,
							row_index: rowIndex,
						},
					},
				],
			});

			closeWithoutSaving();
			clearFiles();
		} catch (error) {
			console.error("Error uploading files and appending to cell:", {
				error,
			});

			toast({
				title: "Error uploading files and appending to cell",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsUploading(false);
		}
	}

	function handleChooseFiles() {
		addFilesInputRef.current?.click();
	}

	return (
		<Dialog onOpenChange={closeWithoutSaving} open>
			<DialogContent
				className="min-w-80 min-h-80 h-80 max-w-96 rounded-sm flex flex-col gap-6 z-100"
				onDragStart={handleDragStart as any}
				onDragEnter={handleDragStart as any}
				onDragOver={handleDragStart as any}
				onDrop={handleDroppedFiles}
				overlayClassName="z-100"
			>
				<DialogHeader>
					<DialogTitle>Upload files</DialogTitle>

					<DialogDescription>
						Upload files to add to this cell.
					</DialogDescription>
				</DialogHeader>

				<div
					className="flex flex-wrap gap-2 h-full w-full simple-scrollbar border-dashed border-2 border-primary rounded-lg p-2 overflow-x-hidden data-[pointer-cursor=true]:cursor-pointer data-[pointer-cursor=true]:hover:border-accent"
					data-pointer-cursor={files.length === 0}
					onClick={() => {
						if (files.length === 0) {
							handleChooseFiles();
						}
					}}
				>
					{files.length > 0 ? (
						files.map((file, index) => (
							<div
								className="relative flex flex-none gap-2 p-2 items-center group w-52 h-10 rounded-md border border-border-smooth "
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
						))
					) : (
						<div className="flex flex-col items-center justify-center gap-4 h-full w-full">
							<Upload className="size-3.5 stroke-link" />
						</div>
					)}
				</div>

				<div className="gap-4 justify-between items-center w-full flex">
					<Button onClick={handleChooseFiles} size="sm">
						Choose files
					</Button>

					<div className="flex gap-2">
						<Button
							onClick={() => closeWithoutSaving()}
							variant={ButtonVariant.DESTRUCTIVE}
							disabled={isUploading}
							size="sm"
						>
							Cancel
						</Button>

						<Button
							variant={ButtonVariant.SUCCESS}
							disabled={files.length === 0}
							onClick={uploadFilesToCell}
							isLoading={isUploading}
							size="sm"
						>
							Upload
						</Button>
					</div>
				</div>

				<input
					accept=".pdf,.csv,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
					onChange={handleShowFilesPreviewOnMessageInput}
					ref={addFilesInputRef}
					className="hidden"
					type="file"
					multiple
				/>
			</DialogContent>
		</Dialog>
	);
}
