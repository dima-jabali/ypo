import { useEffect, useRef, useState } from "react";
import { trainCase } from "scule";

import { useOrganizationFilesStore } from "../contexts/organizationFiles";
import { useFetchAllOrganizationFilesPage } from "#/hooks/fetch/use-fetch-organization-files";
import {
	type MutateGeneralFileRequest,
	useMutateFile,
} from "../hooks/mutation/useMutateFile";
import { matchIndexStatusColor } from "../utils";
import { getIsGoogleDriveFile } from "./utils";
import { getErrorMessage, isValidNumber } from "#/helpers/utils";
import {
	DocumentSource,
	type GeneralFile,
	type GeneralFileType,
	type GoogleDriveFile,
} from "#/types/notebook";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/sheet";
import { Button, ButtonVariant } from "#/components/Button";
import { matchIcon } from "#/icons/match-icon";
import { DownloadAndShowFilePreview } from "#/components/download-and-show-file-preview";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { UserBlock } from "#/components/user-block";
import { ColorBadge } from "#/components/color-badge";

export const FileDetailsSheet: React.FC = () => {
	const [isReindexing, setIsReindexing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [canSave, setCanSave] = useState(false);

	const openedFileDetailsFileId =
		useOrganizationFilesStore().use.openedFileDetailsSheetOfFileId();
	const fetchOrganizationFiles = useFetchAllOrganizationFilesPage();
	const organizationFilesStore = useOrganizationFilesStore();
	const mutateFile = useMutateFile();

	const file = (
		isValidNumber(openedFileDetailsFileId)
			? (fetchOrganizationFiles.results.find(
					({ id }) => id === openedFileDetailsFileId,
				) ?? null)
			: null
	) as GeneralFile | GoogleDriveFile | null;

	const changesRef = useRef<MutateGeneralFileRequest>({
		fileType: file?.type as GeneralFileType,
		fileId: openedFileDetailsFileId ?? NaN,
		body: {},
	});

	useEffect(() => {
		changesRef.current = {
			fileType: file?.type as GeneralFileType,
			fileId: file?.id ?? NaN,
			body: {},
		};
	}, [file]);

	if (!file) return null;

	const handleClose = () => {
		organizationFilesStore.setState({
			openedFileDetailsSheetOfFileId: null,
		});
	};

	const handleChangeFileName = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!canRenameFile) {
			delete changesRef.current.body.file_name;

			return;
		}

		changesRef.current.body.file_name = e.target.value;

		setCanSave(true);
	};

	const handleChangeDescription = (
		e: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		changesRef.current.body.description = e.target.value;

		setCanSave(true);
	};

	const handleReindexFile = async () => {
		if (isSaving || isReindexing) return;

		try {
			setIsReindexing(true);

			await mutateFile.mutateAsync({
				body: { index: true },
				fileType: file.type,
				fileId: file.id,
			});

			toast({
				variant: ToastVariant.Success,
				title: "File is re-indexing!",
			});
		} catch (error) {
			console.log("Error re-indexing file:", { error });

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error re-indexing file!",
			});
		} finally {
			setIsReindexing(false);
		}
	};

	const handleSaveChanges = async () => {
		if (!canSave || isSaving) return;

		try {
			setIsSaving(true);

			changesRef.current.fileType = file.type;
			changesRef.current.fileId = file.id;

			await mutateFile.mutateAsync(changesRef.current);

			toast({
				title: "Saved changes to file successfully!",
				variant: ToastVariant.Success,
			});

			setCanSave(false);
		} catch (error) {
			console.log("Error saving changes to file:", { error, changesRef });

			toast({
				title: "Error saving changes to file!",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const googleDriveUrl =
		(getIsGoogleDriveFile(file) && file.google_drive_url) || null;
	const indexStatus = trainCase(file.index_status || "").replaceAll("-", " ");
	const canRenameFile = file.document_source !== DocumentSource.GOOGLE_DRIVE;
	const indexStatusColor = matchIndexStatusColor(file.index_status);
	const { aws_bucket, aws_key } = file;

	return (
		<Sheet onOpenChange={handleClose} open>
			<SheetContent className="simple-scrollbar">
				<SheetHeader>
					<SheetTitle>File details</SheetTitle>

					<SheetDescription>
						You can view and edit this file&apos;s metadata here.
					</SheetDescription>
				</SheetHeader>

				<section className="items-center justify-center min-h-56 w-full max-w-full simple-scrollbar max-h-[40vh] rounded-md border border-border-smooth relative gap-8">
					{googleDriveUrl ? (
						<div className="text-primary text-sm p-4 flex flex-col items-center justify-center gap-4 w-full h-full">
							<span>Google Drive files cannot be previewed!</span>

							<Button
								onClick={() => window.open(googleDriveUrl, "_blank")}
								className="px-4"
								size="xs"
							>
								{matchIcon("new-tab")}

								<span>Click to open file on Google Drive</span>
							</Button>
						</div>
					) : (
						<DownloadAndShowFilePreview
							fallbackClassName="min-h-56"
							aws_bucket={aws_bucket}
							fileType={file.type}
							aws_key={aws_key}
							fileId={file.id}
						/>
					)}
				</section>

				<section className="flex flex-col gap-6">
					<fieldset className="flex flex-col gap-1 text-sm">
						<label className="text-sm font-bold flex items-center gap-2">
							<span>File name</span>

							<span
								className="text-xs aria-disabled:block hidden text-muted-foreground font-normal"
								aria-disabled={!canRenameFile}
							>
								(Can&apos;t rename Google Drive files)
							</span>
						</label>

						<div className="flex gap-4 items-center">
							<Input
								defaultValue={file.file_name ?? ""}
								className="disabled:opacity-100"
								onChange={handleChangeFileName}
								disabled={!canRenameFile}
							/>

							{matchIcon(file.type)}
						</div>
					</fieldset>

					<fieldset className="flex gap-4 items-center justify-between">
						<label className="text-sm font-bold">Created at</label>

						<span className="text-base">
							{file.created_at
								? organizationFilesStore
										.getState()
										.dateFormatter.format(new Date(file.created_at))
								: "—"}
						</span>
					</fieldset>

					<fieldset className="flex gap-4 items-center justify-between">
						<label className="text-sm font-bold">Last updated at</label>

						<span className="text-base">
							{file.updated_at
								? organizationFilesStore
										.getState()
										.dateFormatter.format(new Date(file.updated_at))
								: "—"}
						</span>
					</fieldset>

					<fieldset className="flex gap-4 items-center justify-between">
						<label className="text-sm font-bold">Created by</label>

						{file.created_by ? <UserBlock user={file.created_by} /> : "—"}
					</fieldset>

					<fieldset className="flex flex-col gap-1">
						<label className="text-sm font-bold">Description</label>

						<StyledTextarea
							defaultValue={file.description ?? ""}
							onChange={handleChangeDescription}
						/>
					</fieldset>

					<fieldset className="flex flex-col gap-1">
						<label className="text-sm font-bold">AI Generated Summary</label>

						<StyledTextarea defaultValue={file.summary ?? ""} readOnly />
					</fieldset>

					<fieldset className="text-sm flex items-center justify-between">
						<label className="text-sm font-bold">Index status</label>

						<ColorBadge className={indexStatusColor}>{indexStatus}</ColorBadge>
					</fieldset>

					<fieldset className="flex gap-4 items-center justify-between">
						<label className="text-sm font-bold">Last indexed at</label>

						<span className="text-base">
							{file.last_indexed
								? organizationFilesStore
										.getState()
										.dateFormatter.format(new Date(file.last_indexed))
								: "—"}
						</span>
					</fieldset>
				</section>

				<footer className="flex flex-col gap-4">
					<Button
						variant={ButtonVariant.PURPLE}
						onClick={handleReindexFile}
						isLoading={isReindexing}
						disabled={isSaving}
						className="w-full"
					>
						Re-index{isReindexing ? "ing" : ""} file{isReindexing ? "..." : ""}
					</Button>

					<Button
						variant={ButtonVariant.SUCCESS}
						onClick={handleSaveChanges}
						isLoading={isSaving}
						disabled={!canSave}
						className="w-full"
					>
						Sav{isSaving ? "ing" : "e"} changes{isSaving ? "..." : ""}
					</Button>
				</footer>
			</SheetContent>
		</Sheet>
	);
};
