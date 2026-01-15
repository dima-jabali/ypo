import { memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";

import { LOADER } from "#/components/Button";
import { NativePdfViewer } from "#/components/native-pdf-viewer";
import { droppedFiles } from "#/contexts/dropped-files";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	handleDragEnter,
	handleDragLeave,
	handleDragOver,
} from "#/helpers/blocks";
import { isValidNumber, noop } from "#/helpers/utils";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useFetchPdfFileById } from "#/hooks/fetch/use-fetch-pdf-file-by-id";
import { useIndexPdf } from "#/hooks/mutation/use-index-pdf";
import { useUploadPdfToNotebookBlock } from "#/hooks/mutation/use-upload-pdf";
import type { BlockPDF } from "#/types/notebook";
import { DeleteBlockFloatingButton } from "../delete-block-floating-button";
import { AddBlockBelowButton } from "./add-block-below-button";
import { BlockStoreProvider } from "#/contexts/block-context";

type Props = {
	pdfBlock: BlockPDF;
};
export const PdfBlock = memo(function PdfBlockWithProviders(props: Props) {
	return (
		<BlockStoreProvider
			extraInitialParams={{
				blockUuid: props.pdfBlock.uuid,
			}}
		>
			<PdfBlockWithContexts {...props} />
		</BlockStoreProvider>
	);
});

function PdfBlockWithContexts({ pdfBlock }: Props) {
	const pdfMetadata = pdfBlock.custom_block_info?.pdf;
	const blockUuid = pdfBlock.uuid;

	const pdfFileQuery = useFetchPdfFileById(
		isValidNumber(pdfMetadata?.id),
		pdfMetadata?.id,
	);
	const isNotebookMode = generalContextStore.use.isNotebookMode();
	const uploadPdfToNotebookBlock = useUploadPdfToNotebookBlock();
	const isStreaming = useIsStreaming();
	const indexPdf = useIndexPdf();

	const fileInputRef = useRef<HTMLInputElement>(null);

	const doesBlockExistOnBackend = isValidNumber(pdfBlock.id);

	useQuery({
		queryKey: ["handle-dropped-pdf-file", blockUuid],
		staleTime: Number.POSITIVE_INFINITY,
		enabled: doesBlockExistOnBackend,
		queryFn: async () => {
			const droppedFile = droppedFiles.get(blockUuid);

			if (!droppedFile) return null;

			try {
				await uploadPdfToNotebookBlock.mutateAsync({
					bytesParagraphRef: { current: null },
					progressRef: { current: null },
					file: droppedFile.file,
					blockUuid,
				});

				await indexPdf.mutateAsync({ blockUuid });

				droppedFile.promiseToWaitForFileToBeUploaded?.resolve();
			} catch (error) {
				droppedFile.promiseToWaitForFileToBeUploaded?.reject();

				console.error("Error uploading and indexing dropped pdf:", error);
			} finally {
				droppedFiles.delete(blockUuid);
			}

			return null;
		},
	});

	const isReadonly =
		isStreaming || uploadPdfToNotebookBlock.isPending || indexPdf.isPending;
	const fileName = pdfMetadata?.file_name ?? "";

	function handleUploadFile(file: File) {
		if (isReadonly || uploadPdfToNotebookBlock.isPending || indexPdf.isPending)
			return;

		uploadPdfToNotebookBlock
			.mutateAsync({
				bytesParagraphRef: { current: null },
				progressRef: { current: null },
				blockUuid: pdfBlock.uuid,
				file,
			})
			.then(() => {
				indexPdf.mutate({
					blockUuid: pdfBlock.uuid,
				});
			})
			.catch(noop);
	}

	function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) return;

		handleUploadFile(file);
	}

	function handleOnDrop(e: React.DragEvent<HTMLDivElement>) {
		const file = e.dataTransfer.files[0];

		if (!file || file.type !== "application/pdf") {
			// If any of the dropped files are not of type CSV,
			// stop the execution of this function.
			// This will allow the general drop handler to execute
			// instead, creating new blocks for each file.
			return;
		}

		handleUploadFile(file);
	}

	return (
		<article
			className="mx-auto h-auto w-full group/block"
			data-delete-block-before={isNotebookMode}
			title="PDF chat block"
			onDrop={handleOnDrop}
			id={pdfBlock.uuid}
		>
			<header className="flex w-full items-center gap-4 max-w-full overflow-auto justify-between simple-scrollbar mb-1">
				<p className="text-xs text-muted truncate">{fileName}</p>
			</header>

			{uploadPdfToNotebookBlock.isPending && !pdfFileQuery.data ? (
				LOADING
			) : pdfFileQuery.data ? (
				<div className="flex h-[80vh] max-h-[1000px] w-full border border-solid border-border-smooth rounded-lg print:max-h-10">
					<NativePdfViewer fileBlobUrl={pdfFileQuery.data.fileUrl} />
				</div>
			) : pdfFileQuery.isPending && pdfFileQuery.isEnabled ? (
				LOADING
			) : pdfFileQuery.error ? (
				<div>Error: {pdfFileQuery.error.message}</div>
			) : (
				<div
					className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed hover:border-accent border-border-smooth  aria-disabled:pointer-events-none"
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					aria-disabled={isReadonly}
					title="Select a CSV file"
				>
					<label className="flex cursor-pointer flex-col items-center justify-center p-4 text-center md:p-8">
						<Upload className="size-6 stroke-primary stroke-1" />

						<p className="mx-auto mt-3 max-w-xs text-primary">
							Click to <span className="font-bold">Upload your PDF file</span>{" "}
							or drag and drop your file here
						</p>

						<input
							onChange={handleFileChosen}
							disabled={isReadonly}
							ref={fileInputRef}
							className="hidden"
							accept=".pdf"
							type="file"
							max={1}
						/>
					</label>
				</div>
			)}

			<AddBlockBelowButton blockAboveUuid={blockUuid} />

			<DeleteBlockFloatingButton blockUuid={blockUuid} />
		</article>
	);
}

const LOADING = (
	<div className="relative h-[100px] overflow-hidden border border-border-smooth flex items-center justify-center flex-col gap-2 rounded-lg text-xs text-muted">
		{LOADER}

		<span>Loading PDF...</span>
	</div>
);
