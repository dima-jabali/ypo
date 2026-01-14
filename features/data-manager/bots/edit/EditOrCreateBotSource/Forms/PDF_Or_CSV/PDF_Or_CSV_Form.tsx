import { useEffect, useMemo, useState } from "react";
import { usePrevious } from "@uidotdev/usehooks";
import type { AxiosResponse } from "axios";
import axios from "axios";
import { Upload, X } from "lucide-react";

import { clientAPI_V1 } from "#/api";
import { Button, ButtonVariant } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { NativePdfViewer } from "#/components/native-pdf-viewer";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";
import { TagGroup, type TagGroupProps } from "#/components/tag-group";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { NO_MORE_ITEMS_TO_SELECT } from "#/features/assign-to/base-project-form/base-project-form";
import { getErrorMessage, noop } from "#/helpers/utils";
import { useFetchPDFOrCSVFilesPage } from "#/hooks/fetch/use-fetch-pdf-or-csv-files-page";
import {
	useCreateBotSource,
	type CreateBotSourceRequest,
	type CreateCSVBotSourceRequest,
	type CreatePDFBotSourceRequest,
} from "#/hooks/mutation/use-create-bot-source";
import {
	useUpdateBotSource,
	type UpdateCSVBotSourceByIdRequest,
	type UpdatePDFBotSourceByIdRequest,
	type UpdateSlackBotSourceByIdRequest,
	type UpdateWebBotSourceByIdRequest,
} from "#/hooks/mutation/use-update-bot-source";
import { CsvIcon } from "#/icons/csv-icon";
import {
	BotSourceFormAction,
	BotSourceType,
	type BotSource,
	type CSVBotSource,
	type PDF,
	type PDFBotSource,
} from "#/types/bot-source";
import {
	BOT_NAME_INPUT_NAME,
	BOT_SOURCE_DESCRIPTION_INPUT_NAME,
	EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
	editOrCreateSuccessToast,
	IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
	noBotNameToast,
} from "../../helpers";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type AskForUploadURLRequest = {
	file_type: PDFBotSource["source_type"] | CSVBotSource["source_type"];
	include_presigned_upload_url: boolean;
	file_size_bytes: number;
	description: string;
	file_name: string;
	title: string;
};

type AskForUploadURLResponse = {
	upload_url: string;
	file: PDF;
};

type UpdateBotSourceByIdRequest =
	| UpdateSlackBotSourceByIdRequest
	| UpdateWebBotSourceByIdRequest
	| UpdateCSVBotSourceByIdRequest
	| UpdatePDFBotSourceByIdRequest;

type AxiosConfig = undefined;

type Props = {
	source: PDFBotSource | CSVBotSource;
	action: BotSourceFormAction;
	setNextBotSources: React.Dispatch<React.SetStateAction<BotSource[]>>;
	closeDialog: () => void;
};

export type FileHolder = {
	previewURL: string;
	file: File;
};

type PDFWithNameKey = PDF & { name: string };

const PDF_OR_CSV_FILE_INPUT_ID = "pdf-or-csv-file-input-id";
const DEFAULT_PDF_OR_CSV_FILES: PDFWithNameKey[] = [];
const LOADING = 1;

export const PDF_Or_CSV_Form: React.FC<Props> = ({
	action,
	source,
	setNextBotSources,
	closeDialog,
}) => {
	const [selectedPDFOrCSVFiles, setSelectedPDFOrCSVFiles] = useState<
		PDFWithNameKey[]
	>([]);
	const [files, setFiles] = useState<FileHolder[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchPDFOrCSVFilesQuery = useFetchPDFOrCSVFilesPage(source.source_type);
	const organizationId = generalContextStore.use.organizationId();
	const createBotSource = useCreateBotSource();
	const updateBotSource = useUpdateBotSource();
	const prevFiles = usePrevious(files);
	const allPDFOrCSVFiles = useMemo(
		() =>
			fetchPDFOrCSVFilesQuery.data?.map((file) => ({
				...file,
				name: file.file_name,
			})) ?? DEFAULT_PDF_OR_CSV_FILES,
		[fetchPDFOrCSVFilesQuery.data],
	);

	// Set up preview of files:
	useEffect(() => {
		let fileReader: FileReader | undefined;
		let isCanceled = false;

		files.map((file, index) => {
			if (
				prevFiles.find((prevFile) => prevFile.previewURL === file.previewURL)
			) {
				return; // Prevent infinite loop:
			}

			fileReader = new FileReader();

			fileReader.onload = (e) => {
				if (!e.target) return;

				const { result } = e.target;

				if (result && !isCanceled) {
					setFiles((prev) =>
						prev.with(index, {
							// Casting here because we are reading as URL, so it will be a string:
							previewURL: result as string,
							file: file.file,
						}),
					);
				}
			};

			fileReader.readAsDataURL(file.file);
		});

		return () => {
			isCanceled = true;

			if (fileReader && fileReader.readyState === LOADING) {
				fileReader.abort();
			}
		};
	}, [files, prevFiles]);

	// Handle dropped files:
	useEffect(() => {
		const handleDragStart = (e: DragEvent) => {
			e.preventDefault();

			if (!e.dataTransfer) return;

			e.dataTransfer.effectAllowed = "copy";
			e.dataTransfer.dropEffect = "copy";
		};

		const handleDroppedFiles = (e: DragEvent) => {
			e.stopPropagation();
			e.preventDefault();

			if (!e.dataTransfer) return;

			const files = e.dataTransfer.files;

			if (!files) return;

			setFiles((prev) => {
				const next = [...prev];

				for (const file of files) {
					if (
						(source.source_type === BotSourceType.CSV &&
							file.type !== "text/csv") ||
						(source.source_type === BotSourceType.PDF &&
							file.type !== "application/pdf")
					)
						continue;

					next.push({ previewURL: "", file });
				}

				return next;
			});
		};

		// If you want to allow a drop, you must prevent the default behavior by cancelling both the dragenter and dragover events.
		window.addEventListener("dragstart", handleDragStart);
		window.addEventListener("dragenter", handleDragStart);
		window.addEventListener("dragover", handleDragStart);
		window.addEventListener("drop", handleDroppedFiles);

		return () => {
			window.removeEventListener("dragstart", handleDragStart);
			window.removeEventListener("dragenter", handleDragStart);
			window.removeEventListener("dragover", handleDragStart);
			window.removeEventListener("drop", handleDroppedFiles);
		};
	}, [source.source_type]);

	const handleOpenFileInputChooser = () => {
		document.getElementById(PDF_OR_CSV_FILE_INPUT_ID)?.click();
	};

	const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;

		if (!files) return;

		setFiles((prev) => {
			const next = [...prev];

			for (const file of files) {
				next.push({ previewURL: "", file });
			}

			return next;
		});
	};

	const handleRemoveFile = (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		index: number,
	) => {
		e.stopPropagation();

		setFiles((prev) => {
			const next = [...prev];

			next.splice(index, 1);

			return next;
		});
	};

	const handleOpenFileInputChooserByPressingEnter = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Enter") {
			document.getElementById(PDF_OR_CSV_FILE_INPUT_ID)?.click();
		}
	};

	const handleToggleSelectAllFiles = () => {
		setSelectedPDFOrCSVFiles(
			selectedPDFOrCSVFiles.length === allPDFOrCSVFiles.length
				? []
				: allPDFOrCSVFiles,
		);
	};

	async function handleSendPdfOrCsvForm() {
		if (isLoading) return;

		if (files.length === 0 && selectedPDFOrCSVFiles.length === 0) {
			toast({
				title: "Please, select at least one file.",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		const form = document.getElementById(
			EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
		) as HTMLFormElement | null;

		if (!form) return;

		const formData = new FormData(form);

		const rawIsBotSourceArchived = formData.get(
			IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
		);
		const rawDescription = formData.get(BOT_SOURCE_DESCRIPTION_INPUT_NAME);
		const rawBotName = formData.get(BOT_NAME_INPUT_NAME);

		if (!rawBotName) {
			console.error("Error getting form entries", {
				rawDescription,
				formData,
				source,
			});

			return;
		}

		// Casting to string because we know it's a string:
		const botName = (rawBotName as string).trim();

		if (!botName) {
			noBotNameToast();

			return;
		}

		// Casting to string because we know it's a string:
		const description = (rawDescription as string).trim();

		console.log({
			rawIsBotSourceArchived,
			rawBotName,
			rawDescription,
			description,
		});

		// Casting here because we know it's `"on" | undefined`:
		const isBotSourceArchived = rawIsBotSourceArchived === "on";

		try {
			setIsLoading(true);

			// First, send the files:
			const promisesOfUploadUrls = files.map(({ file }) =>
				clientAPI_V1
					.post<
						AskForUploadURLResponse,
						AxiosResponse<AskForUploadURLResponse, AxiosConfig>,
						AskForUploadURLRequest
					>(`organizations/${organizationId}/files`, {
						include_presigned_upload_url: true,
						file_type: source.source_type,
						file_size_bytes: file.size,
						file_name: file.name,
						description: "",
						title: "",
					})
					.catch((error) => {
						console.error(
							`Error getting upload URL for ${source.source_type} file`,
							error,
						);

						toast({
							title: `Error getting upload URL for ${source.source_type} file`,
							description: getErrorMessage(error),
							variant: ToastVariant.Destructive,
						});

						throw error;
					}),
			);

			const responsesOfUploadUrls =
				await Promise.allSettled(promisesOfUploadUrls);

			const promisesOfFilesUpload = responsesOfUploadUrls.map(async (res) => {
				if (res.status === "rejected" || !res.value?.data) return noop;

				const fileHolder = files.find(
					({ file }) =>
						// Casting here because we assured above that it exists:
						file.size === res.value!.data.file.file_size_bytes &&
						file.name === res.value!.data.file.file_name,
				);

				if (!fileHolder) {
					console.error(
						"Could not find file to upload! This should not happen!",
						{
							files,
							res,
						},
					);

					return noop;
				}

				return axios
					.put(res.value.data.upload_url, fileHolder.file, {
						headers: {
							"Content-Type":
								source.source_type === BotSourceType.CSV
									? "text/csv"
									: "application/pdf",
						},
					})
					.catch((error) => {
						console.error(`Error uploading ${source.source_type} file`, error);

						toast({
							title: `Error uploading ${source.source_type} file`,
							description: getErrorMessage(error),
							variant: ToastVariant.Destructive,
						});

						throw error;
					});
			});

			const responsesOfUploadFiles = await Promise.allSettled(
				promisesOfFilesUpload,
			);

			// Add uploaded files to selected files:
			const idsOfFiles = selectedPDFOrCSVFiles
				.map(({ id }) => ({ id }))
				.concat(
					responsesOfUploadUrls
						.map((item) => {
							if (item.status === "rejected" || !item.value) return false;

							return { id: item.value.data.file.id };
						})
						.filter(Boolean) as { id: number }[],
				);

			console.log({
				responsesOfUploadFiles,
				responsesOfUploadUrls,
				idsOfFiles,
			});

			let newBotSource: BotSource | undefined;

			if (action === BotSourceFormAction.Create) {
				const newBotSourceInfo: CreateBotSourceRequest =
					source.source_type === BotSourceType.PDF
						? ({
								add_to_bot_ids: source.bots.map((b) => b.id),
								source_type: source.source_type,
								pdfs: idsOfFiles,
								organizationId,
								name: botName,
								description,
							} satisfies CreatePDFBotSourceRequest)
						: ({
								add_to_bot_ids: source.bots.map((b) => b.id),
								source_type: source.source_type,
								csvs: idsOfFiles,
								organizationId,
								name: botName,
								description,
							} satisfies CreateCSVBotSourceRequest);

				newBotSource = await createBotSource.mutateAsync(newBotSourceInfo);
			} else {
				const updatedBotSourceInfo: UpdateBotSourceByIdRequest =
					source.source_type === BotSourceType.PDF
						? ({
								archived: isBotSourceArchived,
								sourceId: source.id,
								organizationId,
								name: botName,
								description,
							} satisfies UpdatePDFBotSourceByIdRequest)
						: ({
								archived: isBotSourceArchived,
								sourceId: source.id,
								organizationId,
								name: botName,
								description,
							} satisfies UpdateCSVBotSourceByIdRequest);

				newBotSource = await updateBotSource.mutateAsync(updatedBotSourceInfo);
			}

			console.log("created or edited BotSource", { newBotSource });

			setNextBotSources((prev) => {
				if (!newBotSource) {
					return prev;
				}

				const index = prev.findIndex((s) => s.id === source.id);

				if (index === -1) {
					return [...prev, newBotSource];
				}

				const next = prev.with(index, newBotSource);

				return next;
			});

			editOrCreateSuccessToast(action);

			closeDialog();
		} finally {
			setIsLoading(false);
		}
	}

	let submitButtonText = "";

	if (isLoading) {
		if (action === BotSourceFormAction.Edit) {
			submitButtonText = "Saving...";
		} else {
			submitButtonText = "Creating...";
		}
	} else {
		if (action === BotSourceFormAction.Edit) {
			submitButtonText = "Save";
		} else {
			submitButtonText = "Create";
		}
	}

	return (
		<>
			<label className="flex flex-col gap-1">
				<p className="pl-2 font-bold">Select {source.source_type}s</p>

				<TagGroup
					placeholder={`Search ${source.source_type}s file names`}
					renderRemovableItem={renderRemovableFileItem}
					noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
					setSelectedValues={setSelectedPDFOrCSVFiles}
					selectedValues={selectedPDFOrCSVFiles}
					allValues={allPDFOrCSVFiles}
					renderItem={renderFileItem}
					wrapperClassName="w-full"
					withSearch
					isMulti
					footer={
						// @ts-expect-error => ignore
						<RadioGroup
							className="flex flex-col gap-0"
							value={
								selectedPDFOrCSVFiles.length === allPDFOrCSVFiles.length
									? "All files"
									: undefined
							}
						>
							<label className="flex items-center gap-2 p-4 onfocus:underline active:brightness-150">
								<RadioGroupItem
									defaultChecked={
										selectedPDFOrCSVFiles.length === allPDFOrCSVFiles.length
									}
									onClick={handleToggleSelectAllFiles}
									value="All files"
									id="all-files"
								/>

								<p>Select all files</p>
							</label>
						</RadioGroup>
					}
				/>
			</label>

			<section
				className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-8 rounded-lg border-2 border-dashed p-4 text-center md:p-8"
				onKeyDown={handleOpenFileInputChooserByPressingEnter}
				title={`Select ${source.source_type} files`}
				onClick={handleOpenFileInputChooser}
				tabIndex={0}
			>
				<div
					className="flex items-center justify-center data-[should-make-it-smaller=true]:text-sm"
					data-should-make-it-smaller={files.length > 0}
				>
					<Upload className="size-10 stroke-primary" />

					<p className="mx-auto mt-3 max-w-xs text-primary">
						Click to{" "}
						<span className="font-medium text-accent-foreground">
							Select {source.source_type} files
						</span>{" "}
						or drag and drop them here.
					</p>
				</div>

				{files.length > 0 ? (
					<ul className="simple-scrollbar flex w-full gap-6 overflow-x-auto overflow-y-hidden">
						{files.map((file, index) =>
							file.previewURL ? (
								<article
									className="relative flex h-40 w-32 flex-none items-center justify-center overflow-hidden data-[is-csv=true]:h-32"
									data-is-csv={source.source_type === BotSourceType.CSV}
									key={file.file.name}
								>
									<button
										className="absolute right-0 top-0 z-10 bg-black/20 p-1 onfocus:bg-destructive/80 active:bg-destructive"
										onClick={(e) => handleRemoveFile(e, index)}
										title="Remove file"
									>
										<X className="size-4" />
									</button>

									{source.source_type === BotSourceType.PDF ? (
										<NativePdfViewer fileBlobUrl={file.previewURL} />
									) : (
										<CsvIcon className="size-[70px]" />
									)}

									<p
										className="absolute bottom-0 flex w-32 items-center truncate text-ellipsis bg-slate-600 p-1 text-xs"
										title={file.file.name}
									>
										{file.file.name}
									</p>
								</article>
							) : null,
						)}
					</ul>
				) : null}

				<input
					accept={`.${source.source_type.toLowerCase()}`}
					id={PDF_OR_CSV_FILE_INPUT_ID}
					onChange={handleFileChosen}
					className="hidden"
					type="file"
					multiple
				/>
			</section>

			<DialogFooter className="mr-2 h-full grow">
				<Button
					form={EDIT_OR_CREATE_BOT_SOURCE_FORM_ID}
					onClick={handleSendPdfOrCsvForm}
					variant={ButtonVariant.SUCCESS}
					isLoading={isLoading}
					className="mt-auto"
					type="submit"
				>
					{submitButtonText}
				</Button>
			</DialogFooter>
		</>
	);
};

export const renderFileItem: TagGroupProps<PDFWithNameKey>["renderItem"] = (
	item,
	handleAddSelectedValue,
) => (
	<div key={item.id}>
		<button
			className="w-full bg-slate-600 p-2 transition-none onfocus:bg-blue-400/40"
			onPointerUp={() => handleAddSelectedValue(item)}
		>
			<span
				className="relative box-border flex w-min items-center justify-center overflow-hidden truncate whitespace-nowrap rounded-sm px-2 py-1"
				title={`${item.id} | ${item.name}`}
			>
				{item.name}
			</span>
		</button>
	</div>
);

export const renderRemovableFileItem: TagGroupProps<PDFWithNameKey>["renderRemovableItem"] =
	(item, index, handleRemoveSelectedValue) => (
		<div /* Selected item container */
			className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-accent shadow-md shadow-black/15"
			key={item.id}
		>
			<p
				className="max-w-52 truncate whitespace-nowrap px-2"
				title={`${item.id} | ${item.name}`}
			>
				{item.name}
			</p>

			<div /* Remove item button */
				className="h-full cursor-pointer p-2 transition-none onfocus:bg-destructive/80 onfocus:text-primary"
				onClick={() => handleRemoveSelectedValue(index)}
				role="button"
			>
				<X className="size-4" />
			</div>
		</div>
	);
