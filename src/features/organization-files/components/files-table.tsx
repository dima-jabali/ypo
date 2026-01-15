import * as ContextMenu from "@radix-ui/react-context-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Download, EyeIcon, Info, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { trainCase } from "scule";

import { ColorBadge } from "#/components/color-badge";
import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "#/components/ContextMenu";
import { GlobalUrlPagination } from "#/components/global-url-pagination";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	generalContextStore,
	type PageLimit,
	type PageOffset,
} from "#/contexts/general-ctx/general-context";
import { getErrorMessage, noop, prettyBytes } from "#/helpers/utils";
import {
	matchGeneralFileTypeToMimeType,
	queryFnToFetchFileById,
} from "#/hooks/fetch/use-fetch-file-by-id";
import { queryKeyFactory } from "#/hooks/query-keys";
import useOnOutsideClick from "#/hooks/use-on-outside-click";
import { matchIcon } from "#/icons/match-icon";
import {
	GeneralFileType,
	type GeneralFile,
	type GoogleDriveFile,
} from "#/types/notebook";
import { useFetchAllOrganizationFilesPage } from "../../../hooks/fetch/use-fetch-organization-files";
import { useOrganizationFilesStore } from "../contexts/organizationFiles";
import { useMutateFile } from "../hooks/mutation/useMutateFile";
import { matchIndexStatusColor } from "../utils";
import { getIsGoogleDriveFile } from "./utils";

export const FilesTable: React.FC = () => {
	const fetchOrganizationFilesQuery = useFetchAllOrganizationFilesPage();

	const [columns] = useState(() => {
		const columnHelper = createColumnHelper<GeneralFile>();

		const columns = [
			columnHelper.accessor("file_name", {
				cell: (info) => info.getValue(),
				id: "file_name",
				header: "Name",
			}),
			columnHelper.accessor("index_status", {
				cell: (info) => info.getValue(),
				header: "Index status",
				id: "index_status",
			}),
			columnHelper.accessor("file_size_bytes", {
				cell: (info) => info.getValue(),
				id: "file_size_bytes",
				header: "Size",
			}),
			columnHelper.accessor("created_at", {
				cell: (info) => info.getValue(),
				header: "Created at",
				id: "created_at",
			}),
		];

		return columns;
	});

	const table = useReactTable({
		data: fetchOrganizationFilesQuery.results,
		enableColumnResizing: false,
		enableRowSelection: false,
		manualPagination: true,
		enableMultiSort: true,
		manualSorting: false,
		enableSorting: true,
		columns,
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getCoreRowModel: getCoreRowModel(),
	});

	const totalNumberOfProjects = fetchOrganizationFilesQuery.num_results;

	return (
		<section className="max-w-full mb-[20vh]">
			<table className="h-1 w-full border-b border-primary/80">
				<thead className="text-sm font-bold">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr className="w-full" key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									className="text-center h-14 whitespace-nowrap px-2 first:text-left"
									key={header.id}
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext(),
									)}
								</th>
							))}
						</tr>
					))}
				</thead>

				<tbody>
					{table.getRowModel().rows.map((row) => (
						<FileTableRow key={row.original.id} file={row.original} />
					))}
				</tbody>
			</table>

			<div className="flex w-full h-14 mt-4">
				<GlobalUrlPagination totalNumberOfItems={totalNumberOfProjects} />
			</div>
		</section>
	);
};

type FileTableRowProps = {
	file: GeneralFile | GoogleDriveFile;
};

function FileTableRow({ file }: FileTableRowProps) {
	const [isReindexing, setIsReindexing] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);

	const googleDriveConnectionId =
		useOrganizationFilesStore().use.googleDriveConnectionId();
	const selectedFiles = useOrganizationFilesStore().use.selectedFiles();
	const organizationId = generalContextStore.use.organizationId();
	const organizationFilesStore = useOrganizationFilesStore();
	const queryClient = useQueryClient();
	const mutateFile = useMutateFile();

	const trRef = useRef<HTMLTableRowElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useOnOutsideClick(trRef, () => {
		organizationFilesStore.setState({ selectedFiles: new Map() });
		setIsRenaming(false);
	});

	const handleDoubleClick = async () => {
		if (isRenaming) return;

		organizationFilesStore.setState({ selectedFiles: new Map() });

		if (isFolder) {
			// Go to folder.
			if (isFileFromGoogleDrive && isFolder) {
				organizationFilesStore.setState({
					googleDriveParentId: file.file_id,
					googleDriveConnectionId,
				});
			} else {
				organizationFilesStore.setState({
					googleDriveConnectionId: null,
					googleDriveParentId: null,
				});
				// TODO: Add support for other folders
			}

			generalContextStore.setState({
				pageOffset: 0 as PageOffset,
				pageLimit: 30 as PageLimit,
			});
		} else {
			handleOpenFileDetails();
		}
	};

	async function handleDownload() {
		const localSelectedFiles = new Map(selectedFiles);

		localSelectedFiles.set(file.id, file);

		const promises = [...localSelectedFiles.values()].map((file) => {
			const promiseFn = async () => {
				if (getIsGoogleDriveFile(file)) {
					window.open(file.google_drive_url, "_blank");

					return;
				}

				try {
					toast({
						title: `Downloading file "${file.file_name}"...`,
						variant: ToastVariant.Success,
					});

					const props = {
						fileType: matchGeneralFileTypeToMimeType(file.type),
						fileId: file.id,
						organizationId,
					};

					const blob = await queryClient.fetchQuery({
						queryKey: [
							...queryKeyFactory.get["file-by-presigned-url"].queryKey,
							props,
						],
						queryFn: async () => await queryFnToFetchFileById(props),
					});

					const url = URL.createObjectURL(blob);

					const a = document.createElement("a");
					a.download = `${file.file_name}`;
					a.href = url;

					document.body.appendChild(a);

					a.click();

					// clean up "a" element & remove ObjectURL
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					toast({
						title: `File "${file.file_name}" downloaded successfully!`,
						variant: ToastVariant.Success,
					});
				} catch (error) {
					toast({
						title: `Error downloading file "${file.file_name}"`,
						description: getErrorMessage(error),
						variant: ToastVariant.Destructive,
					});
				}
			};

			return promiseFn();
		});

		await Promise.allSettled(promises);
	}

	function handleOpenFileDetails() {
		organizationFilesStore.setState({
			openedFileDetailsSheetOfFileId: file.id,
		});
	}

	const handleToggleSelect = (
		e:
			| React.MouseEvent<HTMLTableRowElement, MouseEvent>
			| React.MouseEvent<HTMLDivElement, MouseEvent>,
	) => {
		if (isRenaming) return;

		const isSelectingMultiple = e.shiftKey;
		const isCtxMenuClick = e.button === 2;

		organizationFilesStore.setState((prev) => {
			const next = new Map(prev.selectedFiles);
			const isSelected = next.has(file.id);

			if (isSelectingMultiple) {
				// Remove all selections when selecting multiple files
				requestAnimationFrame(() => {
					window.getSelection()?.removeAllRanges();
				});

				if (isSelected && !isCtxMenuClick) {
					next.delete(file.id);
				} else {
					next.set(file.id, file);
				}
			} else {
				next.clear();

				next.set(file.id, file);
			}

			return { selectedFiles: next };
		});
	};

	const handleReindexFiles = async () => {
		if (isReindexing) return;

		setIsReindexing(true);

		const localSelectedFiles = new Map(selectedFiles);

		localSelectedFiles.set(file.id, file);

		const promises = [...localSelectedFiles.values()].map((file) => {
			const promiseFn = async () => {
				try {
					console.log({ file });

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
				}
			};

			return promiseFn();
		});

		await Promise.allSettled(promises);

		setIsReindexing(false);
	};

	const handleCopyFileName = () => {
		navigator.clipboard.writeText(fileName).catch(console.log);
	};

	const handleRename = async () => {
		const newName = inputRef.current?.value.trim();

		if (!newName) return;

		mutateFile.mutate(
			{
				body: { file_name: newName },
				fileType: file.type,
				fileId: file.id,
			},
			{
				onError: (error) => {
					toast({
						description: getErrorMessage(error),
						variant: ToastVariant.Destructive,
						title: "Error renaming file!",
					});
				},
				onSuccess: () => {
					toast({
						title: "File renamed successfully!",
						variant: ToastVariant.Success,
					});
				},
			},
		);

		setIsRenaming(false);
	};

	const handleRenameInputOnKeyDown = (
		event: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (!isRenaming) return;

		switch (event.key) {
			case "Escape": {
				setIsRenaming(false);
				break;
			}

			case "Enter": {
				handleRename().catch(noop);
				break;
			}
		}
	};

	const handleShowRenameInput = () => {
		setIsRenaming(true);

		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	};

	const createdAt = file.created_at
		? organizationFilesStore
				.getState()
				.dateFormatter.format(new Date(file.created_at))
		: "—";
	const isFolder =
		file.type === GeneralFileType.GOOGLE_DRIVE_FOLDER ||
		file.type === GeneralFileType.FOLDER;
	const size = file.file_size_bytes ? prettyBytes(file.file_size_bytes) : "—";
	const indexStatus = trainCase(file.index_status || "").replaceAll("-", " ");
	const indexStatusColor = matchIndexStatusColor(file.index_status);
	const isFileFromGoogleDrive = getIsGoogleDriveFile(file);
	const isMultipleSelected = selectedFiles.size > 1;
	const canRenameFile = !isFileFromGoogleDrive;
	const fileName = file.file_name ?? "";

	return (
		<ContextMenu.Root key={file.id} modal>
			<ContextMenuTrigger asChild>
				<tr
					className="[&_td]:h-14 [&_td]:border-t [&_td]:border-primary/80 hover:[&_td]:bg-primary/20 tabular-nums data-[selected=true]:border-none data-[selected=true]:bg-link/40 select-none data-[is-renaming=true]:bg-orange-300/30!"
					data-selected={selectedFiles.has(file.id)}
					onContextMenu={handleToggleSelect}
					onDoubleClick={handleDoubleClick}
					data-is-renaming={isRenaming}
					onClick={handleToggleSelect}
					key={file.id}
					ref={trRef}
				>
					<td>
						<div className="flex gap-3 p-3 items-center" title={fileName}>
							{matchIcon(file.type, "size-6")}

							<div className="flex w-full h-full relative">
								{isRenaming ? (
									<input
										className="bg-transparent w-full outline-hidden text-base tabular-nums resize-none flex grow truncate"
										onKeyDown={handleRenameInputOnKeyDown}
										defaultValue={fileName}
										spellCheck={false}
										autoComplete="off"
										autoCorrect="off"
										ref={inputRef}
									/>
								) : (
									<span className="bg-transparent w-full outline-hidden text-base tabular-nums resize-none flex grow truncate">
										{fileName}
									</span>
								)}
							</div>
						</div>
					</td>

					<td>
						<span className="flex items-center justify-center w-full">
							<ColorBadge className={indexStatusColor}>
								{indexStatus}
							</ColorBadge>
						</span>
					</td>

					<td className="text-center">{size}</td>

					<td className="text-primary/80 text-center">{createdAt}</td>
				</tr>
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem
					disabled={isMultipleSelected || !canRenameFile}
					onClick={handleShowRenameInput}
					className="group"
				>
					<Pencil className="size-3.5 mr-[1.5px] text-primary group-hover:text-white" />

					<span>Rename</span>
				</ContextMenuItem>

				<ContextMenuItem onClick={handleReindexFiles} className="gap-2 group">
					<EyeIcon className="size-4 text-primary group-hover:text-white" />

					<span>
						Index {isFolder ? "all files in folder" : "file"}
						{isMultipleSelected ? "s" : ""}
					</span>
				</ContextMenuItem>

				<ContextMenuItem
					disabled={isMultipleSelected}
					onClick={handleCopyFileName}
					className="gap-2 group"
				>
					{matchIcon("copy", "size-4 text-primary group-hover:text-white")}

					<span>Copy name</span>
				</ContextMenuItem>

				{isFolder ? null : (
					<>
						<ContextMenuItem onClick={handleDownload} className="group">
							<Download className="size-4 text-primary group-hover:text-white" />

							<span>Download file{isMultipleSelected ? "s" : ""}</span>
						</ContextMenuItem>

						<ContextMenuItem
							disabled={isMultipleSelected}
							onClick={handleOpenFileDetails}
							className="group"
						>
							<Info className="size-4 text-primary group-hover:text-white" />

							<span>File details</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu.Root>
	);
}
