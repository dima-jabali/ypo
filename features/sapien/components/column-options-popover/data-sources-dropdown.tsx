import { Check, ChevronDownIcon, Pencil, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { titleCase } from "scule";

import type { BatchTableColumn } from "#/types/batch-table";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import {
	BatchTableDataSourceEntityHandlingType,
	BatchTableDataSourceEntityHandlingTypes,
	BatchTableDataSourceEntityType,
	BatchTableDataSourceEntityTypes,
	useFetchBatchTableDataSources,
	type BatchTableDataSource,
	type BatchTableDataSourceId,
} from "../../hooks/get/use-fetch-batch-table-data-sources";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { useFetchBotSourcesPage } from "#/hooks/fetch/use-fetch-bot-sources-page";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { OrganizationFilesStoreProvider } from "#/features/organization-files/contexts/organizationFiles";
import { Loader } from "#/components/Loader";
import {
	createISODate,
	isValidNumber,
	preventDefault,
	stopPropagation,
} from "#/helpers/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { Button, ButtonVariant } from "#/components/Button";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/select";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";
import {
	BotSourceFormAction,
	BotSourceType,
	type BotSource,
	type BotSourceId,
} from "#/types/bot-source";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";
import { EditOrCreateBotSourceDialog } from "#/features/data-manager/bots/edit/EditOrCreateBotSource/EditOrCreateBotSourceDialog";
import { Cron } from "#/components/cron";
import { useAddBatchTableDataSourceToColumn } from "../../hooks/put/use-add-batch-table-data-source-to-column";
import { useCreateBatchTableDataSource } from "../../hooks/post/use-create-batch-table-data-source";
import { useEditBatchTableDataSource } from "../../hooks/put/use-edit-batch-table-data-source";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";

type Props = { batchTableColumn: BatchTableColumn };

enum ScheduleType {
	INTERVAL_MINUTES = "Interval Minutes",
	CRON = "Cron",
}

export function DataSourcesDropdown(props: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger className="flex items-center text-sm border border-border-smooth py-2 px-2 justify-between gap-2 button-hover rounded-md">
				<span>Data Sources</span>

				<ChevronDownIcon className="size-4 flex-none" />
			</PopoverTrigger>

			<PopoverContent className="flex items-center justify-between flex-col gap-2 min-w-(--radix-popper-anchor-width) min-h-36 overflow-hidden z-70 p-2">
				<DefaultSuspenseAndErrorBoundary
					fallbackClassName="flex items-center justify-center w-full h-full min-h-44"
					failedText="Failed to load batch table data sources"
					fallbackFor="DataSourcesDropdown"
				>
					<Content {...props} setIsOpen={setIsOpen} />
				</DefaultSuspenseAndErrorBoundary>
			</PopoverContent>
		</Popover>
	);
}

function Content({
	batchTableColumn,
	setIsOpen,
}: Props & { setIsOpen: (isOpen: boolean) => void }) {
	const [removingFromId, setRemovingFromId] =
		useState<BatchTableDataSourceId | null>(null);

	const addBatchTableDataSourceToColumn = useAddBatchTableDataSourceToColumn();
	const batchTableDataSources = useFetchBatchTableDataSources();
	const organizationId = useWithOrganizationId();

	useFetchBotSourcesPage();

	async function onSelectExistingDataSource(
		batchTableDataSource: BatchTableDataSource,
	) {
		try {
			await addBatchTableDataSourceToColumn.mutateAsync({
				batchTableDataSourceId: batchTableDataSource.id,
				organizationId: organizationId!,
				body: {
					entity_handling_type: batchTableDataSource.entity_handling_type,
					interval_minutes: batchTableDataSource.interval_minutes,
					cron_schedule: batchTableDataSource.cron_schedule,
					entity_type: batchTableDataSource.entity_type,
					column_ids_to_add: [batchTableColumn.id],
					column_ids_to_remove: [],
				},
			});

			setIsOpen(false);

			toast({
				title: "Data source added to this column",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			toast({
				title: "Failed to add data source to this column",
				description: (error as Error).message,
				variant: ToastVariant.Destructive,
			});
		}
	}

	async function handleRemoveFromThisColumn(
		batchTableDataSource: BatchTableDataSource,
	) {
		try {
			setRemovingFromId(batchTableDataSource.id);

			await addBatchTableDataSourceToColumn.mutateAsync({
				batchTableDataSourceId: batchTableDataSource.id,
				organizationId: organizationId!,
				body: {
					entity_handling_type: batchTableDataSource.entity_handling_type,
					interval_minutes: batchTableDataSource.interval_minutes,
					cron_schedule: batchTableDataSource.cron_schedule,
					entity_type: batchTableDataSource.entity_type,
					column_ids_to_remove: [batchTableColumn.id],
					column_ids_to_add: [],
				},
			});

			setIsOpen(false);

			toast({
				title: "Data source removed from this column",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			toast({
				title: "Failed to remove data source from this column",
				description: (error as Error).message,
				variant: ToastVariant.Destructive,
			});
		} finally {
			setRemovingFromId(null);
		}
	}

	return (
		<OrganizationFilesStoreProvider>
			<ul className="flex flex-col items-center justify-center list-none simple-scrollbar h-full w-full">
				{batchTableDataSources.results.length === 0 ? (
					<p className="text-sm p-4 text-muted text-center">No data sources</p>
				) : (
					batchTableDataSources.results.map((ds) => {
						const isAddedToThisColumn = !!ds.batch_table_columns.find(
							(column) => column.id === batchTableColumn.id,
						);
						const isRemovingFromThisColumn = removingFromId === ds.id;

						return (
							<div
								className="flex items-center w-full h-7 text-sm"
								key={ds.id}
								title={
									isAddedToThisColumn
										? "This source applies to this column."
										: undefined
								}
							>
								<button
									className="flex items-center justify-between w-full h-7 rounded-l-md px-2 gap-2 py-1 button-hover opacity-100! disabled:pointer-events-none disabled:pr-0 group"
									disabled={
										addBatchTableDataSourceToColumn.isPending ||
										isAddedToThisColumn
									}
									onClick={() => onSelectExistingDataSource(ds)}
								>
									<span className="truncate group-disabled:opacity-50">
										{ds.name}
									</span>

									{isAddedToThisColumn ? (
										<div
											className="size-7 flex items-center justify-center"
											title="This source applies to this column."
										>
											<Check className="size-3 stroke-3 flex-none opacity-100 text-positive" />
										</div>
									) : null}
								</button>

								{isAddedToThisColumn ? (
									<button
										className="flex items-center justify-center size-7 button-hover flex-none"
										onClick={() => handleRemoveFromThisColumn(ds)}
										title="Remove this source from this column"
									>
										{isRemovingFromThisColumn ? (
											<Loader className="size-3" />
										) : (
											<X className="size-3" />
										)}
									</button>
								) : null}

								{addBatchTableDataSourceToColumn.isPending &&
								!isRemovingFromThisColumn &&
								addBatchTableDataSourceToColumn.variables
									.batchTableDataSourceId === ds.id ? (
									<div className="size-7 flex items-center justify-center rounded-r-md">
										<Loader className="size-3" />
									</div>
								) : (
									<EditBatchTableDataSourceModal
										disabled={isRemovingFromThisColumn}
										batchTableDataSource={ds}
									/>
								)}
							</div>
						);
					})
				)}
			</ul>

			<CreateBatchTableDataSourceDialog
				disabled={addBatchTableDataSourceToColumn.isPending}
				batchTableColumn={batchTableColumn}
			/>
		</OrganizationFilesStoreProvider>
	);
}

function CreateBatchTableDataSourceDialog({
	batchTableColumn,
	disabled,
}: {
	batchTableColumn: BatchTableColumn;
	disabled: boolean;
}) {
	const [scheduleType, setScheduleType] = useState(
		ScheduleType.INTERVAL_MINUTES,
	);
	const [isOpen, setIsOpen] = useState(false);

	const createBatchTableDataSource = useCreateBatchTableDataSource();
	const organizationId = useWithOrganizationId();

	const newBatchTableDataSourceRef = useRef<BatchTableDataSource>({
		entity_handling_type:
			BatchTableDataSourceEntityHandlingType.ADD_NEW_ENTITIES_AND_KEEP_OLD,
		entity_type: BatchTableDataSourceEntityType.FILE,
		last_run_at: createISODate(),
		cron_schedule: undefined,
		batch_table_columns: [],
		interval_minutes: 160,
		description: "",
		source: null!,
		id: null!,
		name: "",
	});

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (createBatchTableDataSource.isPending) return;

		console.log(
			structuredClone({
				newBatchTableDataSource: newBatchTableDataSourceRef.current,
			}),
		);

		if (!newBatchTableDataSourceRef.current.source) {
			toast({
				description: "Please select a source",
				title: "Source was not provided!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		try {
			await createBatchTableDataSource.mutateAsync({
				organizationId: organizationId!,
				body: {
					interval_minutes:
						scheduleType === ScheduleType.INTERVAL_MINUTES
							? newBatchTableDataSourceRef.current.interval_minutes
							: undefined,
					cron_schedule:
						scheduleType === ScheduleType.CRON
							? newBatchTableDataSourceRef.current.cron_schedule
							: undefined,
					entity_handling_type:
						newBatchTableDataSourceRef.current.entity_handling_type,
					entity_type: newBatchTableDataSourceRef.current.entity_type,
					description: newBatchTableDataSourceRef.current.description,
					source_id: newBatchTableDataSourceRef.current.source.id,
					name: newBatchTableDataSourceRef.current.name,
					column_id: batchTableColumn.id,
					column_ids_to_remove: [],
					column_ids_to_add: [],
				},
			});

			setIsOpen(false);
		} catch (error) {
			console.error("Error creating batch table data source!", error);
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button className="" variant={ButtonVariant.PURPLE} disabled={disabled}>
					<Plus className="size-4" />

					<span>Create Batch Table Data Source</span>
				</Button>
			</DialogTrigger>

			{isOpen ? (
				<DialogContent
					className="z-100 simple-scrollbar max-h-[90vh]"
					onPointerDownOutside={preventDefault}
					overlayClassName="z-100"
				>
					<DialogHeader>
						<DialogTitle>Create Batch Table Data Source</DialogTitle>

						<DialogDescription>
							Set up a new batch table data source
						</DialogDescription>
					</DialogHeader>

					<form
						className="flex flex-col items-start justify-center gap-6 [&_label]:text-sm"
						onSubmit={handleCreate}
					>
						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Name</label>

							<Input
								onChange={(e) =>
									(newBatchTableDataSourceRef.current.name = e.target.value)
								}
								// eslint-disable-next-line react-hooks/refs
								defaultValue={newBatchTableDataSourceRef.current.name}
							/>
						</fieldset>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Description</label>

							<StyledTextarea
								onChange={(e) =>
									(newBatchTableDataSourceRef.current.description =
										e.target.value)
								}
								// eslint-disable-next-line react-hooks/refs
								defaultValue={newBatchTableDataSourceRef.current.description}
							/>
						</fieldset>

						<SelectSource
							newBatchTableDataSourceRef={newBatchTableDataSourceRef}
						/>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Entity Type</label>

							<Select
								defaultValue={BatchTableDataSourceEntityType.FILE}
								onValueChange={(newValue) =>
									(newBatchTableDataSourceRef.current.entity_type =
										newValue as BatchTableDataSourceEntityType)
								}
							>
								<SelectTrigger className="w-fit gap-3">
									<SelectValue className="capitalize" />
								</SelectTrigger>

								<SelectContent className="z-101">
									{BatchTableDataSourceEntityTypes.map((type) => (
										<SelectItem className="capitalize" value={type} key={type}>
											{titleCase(type.toLowerCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</fieldset>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Entity Handling Type</label>

							<Select
								defaultValue={
									BatchTableDataSourceEntityHandlingType.ADD_NEW_ENTITIES_AND_KEEP_OLD
								}
								onValueChange={(newValue) =>
									(newBatchTableDataSourceRef.current.entity_handling_type =
										newValue as BatchTableDataSourceEntityHandlingType)
								}
							>
								<SelectTrigger>
									<SelectValue className="capitalize" />
								</SelectTrigger>

								<SelectContent className="z-101">
									{BatchTableDataSourceEntityHandlingTypes.map((type) => (
										<SelectItem className="capitalize" value={type} key={type}>
											{titleCase(type.toLowerCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</fieldset>

						<div className="flex flex-col gap-1 w-full">
							<label className="font-semibold">Schedule</label>

							<fieldset className="flex flex-col items-start gap-6 w-full border border-border-smooth rounded-lg p-4">
								<RadioGroup
									onValueChange={(v) => setScheduleType(v as ScheduleType)}
									defaultValue={ScheduleType.INTERVAL_MINUTES}
									className="flex gap-10 items-center"
								>
									<label className="flex items-center gap-2 onfocus:underline active:brightness-150">
										<RadioGroupItem value={ScheduleType.CRON} />

										<span>Schedule by {ScheduleType.CRON}</span>
									</label>

									<label className="flex items-center gap-2 onfocus:underline active:brightness-150">
										<RadioGroupItem value={ScheduleType.INTERVAL_MINUTES} />

										<span>Schedule by {ScheduleType.INTERVAL_MINUTES}</span>
									</label>
								</RadioGroup>

								<div className="cron flex items-center gap-10 w-full justify-between">
									{scheduleType === ScheduleType.INTERVAL_MINUTES ? (
										<Input
											placeholder="Interval in minutes"
											className="w-1/3"
											type="number"
											min={1}
											onChange={(e) => {
												const newValue = e.target.valueAsNumber;

												if (!isValidNumber(newValue) || newValue < 1) {
													newBatchTableDataSourceRef.current.interval_minutes = 1;
													newBatchTableDataSourceRef.current.cron_schedule = "";
													e.target.value = "1";

													return;
												}

												newBatchTableDataSourceRef.current.interval_minutes =
													newValue;
												newBatchTableDataSourceRef.current.cron_schedule = "";
											}}
										/>
									) : (
										<Cron
											onChange={(v) => {
												newBatchTableDataSourceRef.current.interval_minutes =
													NaN;
												newBatchTableDataSourceRef.current.cron_schedule = v;
											}}
										/>
									)}

									<Button>Sync Batch Table Source</Button>
								</div>
							</fieldset>
						</div>

						<DialogFooter className="w-full items-center justify-end">
							<Button
								isLoading={createBatchTableDataSource.isPending}
								variant={ButtonVariant.PURPLE}
								type="submit"
							>
								Creat{createBatchTableDataSource.isPending ? "ing..." : "e"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			) : null}
		</Dialog>
	);
}

function SelectSource({
	newBatchTableDataSourceRef,
	defaultValue,
}: {
	newBatchTableDataSourceRef: React.MutableRefObject<BatchTableDataSource>;
	defaultValue?: BotSource;
}) {
	const [botSourceBeingCreatedOrEdited, setBotSourceBeingCreatedOrEdited] =
		useState<BotSource | null>(null);
	const [botSourceAction, setBotSourceAction] = useState(
		BotSourceFormAction.Create,
	);
	const [, setNextBotSources] = useState<BotSource[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	const betterbrainUser = useFetchBetterbrainUser();
	const sourcesPage = useFetchBotSourcesPage();
	useFetchAllDatabaseConnections();

	const googleDriveSources = sourcesPage.data.results.filter(
		(source) => source.source_type === BotSourceType.GoogleDrive,
	);
	const isCreatingOrEditingBotSource = botSourceBeingCreatedOrEdited !== null;

	function handleOpenCreateBotSourceDialog() {
		const created_at = createISODate();

		setBotSourceAction(BotSourceFormAction.Create);
		setBotSourceBeingCreatedOrEdited({
			source_type: BotSourceType.GoogleDrive,
			last_modified_by: betterbrainUser,
			created_by: betterbrainUser,
			id: NaN as BotSourceId,
			updated_at: created_at,
			archived: false,
			description: "",
			created_at,
			bots: [],
			name: "",

			google_drive_connection_id: NaN as GoogleDriveDatabaseConnectionId,
			google_drive_folder_ids: [],
			direct_children_only: false,
		});
	}

	function handleCloseCreateOrEditBotSourceDialog() {
		setBotSourceBeingCreatedOrEdited(null);
	}

	function handleOpenEditBotSourceDialog(botSource: BotSource) {
		setBotSourceAction(BotSourceFormAction.Edit);
		setBotSourceBeingCreatedOrEdited(botSource);
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<fieldset className="flex flex-col items-start gap-1 w-full">
				<label className="font-semibold">Source</label>

				<PopoverTrigger className="flex items-center msx-w-full text-sm border border-border-smooth rounded-md py-2 px-2 justify-between gap-2 button-hover">
					<span className="truncate">
						{/* eslint-disable-next-line react-hooks/refs */}
						{defaultValue?.name ??
							// eslint-disable-next-line react-hooks/refs
							newBatchTableDataSourceRef.current.source?.name ??
							"Select Source"}
					</span>

					<ChevronDownIcon className="size-4 flex-none" />
				</PopoverTrigger>
			</fieldset>

			<PopoverContent
				className="flex items-center justify-between flex-col gap-2 min-w-(--radix-popper-anchor-width) min-h-36 overflow-hidden z-101 max-h-[30vh]"
				onWheel={stopPropagation}
				align="start"
				side="bottom"
			>
				{googleDriveSources.length === 0 ? (
					<p className="text-xs text-muted p-4 text-center">
						No Google Drive sources
					</p>
				) : (
					<ul className="flex flex-col items-center justify-center list-none simple-scrollbar h-full w-full">
						{googleDriveSources.map((source) => (
							<div className="flex items-center w-full h-8" key={source.id}>
								<button
									onClick={() => {
										newBatchTableDataSourceRef.current.source = source;

										setIsOpen(false);
									}}
									className="flex items-center text-sm justify-between w-full h-full rounded-l-md px-2 gap-2 py-1 button-hover"
									key={source.id}
								>
									<span>{source.name}</span>
								</button>

								<button
									className="flex items-center justify-center size-8 rounded-r-md button-hover"
									onClick={() => handleOpenEditBotSourceDialog(source)}
								>
									<Pencil className="size-3 stroke-1" />
								</button>
							</div>
						))}
					</ul>
				)}

				<Button
					onClick={handleOpenCreateBotSourceDialog}
					variant={ButtonVariant.PURPLE}
					className="w-full"
				>
					<Plus className="size-4" />

					<span>Create Bot Source</span>
				</Button>

				{isCreatingOrEditingBotSource ? (
					<EditOrCreateBotSourceDialog
						setBotSourceBeingEditedOrAdded={setBotSourceBeingCreatedOrEdited}
						closeDialog={handleCloseCreateOrEditBotSourceDialog}
						source={botSourceBeingCreatedOrEdited}
						setNextBotSources={setNextBotSources}
						action={botSourceAction}
						className="z-110"
					/>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

function EditBatchTableDataSourceModal({
	batchTableDataSource,
	disabled,
}: {
	batchTableDataSource: BatchTableDataSource;
	disabled: boolean;
}) {
	const [scheduleType, setScheduleType] = useState(
		batchTableDataSource.cron_schedule
			? ScheduleType.CRON
			: ScheduleType.INTERVAL_MINUTES,
	);
	const [isOpen, setIsOpen] = useState(false);

	const editBatchTableDataSource = useEditBatchTableDataSource();
	const organizationId = useWithOrganizationId();

	const updatedBatchTableDataSourceRef = useRef<BatchTableDataSource>(
		structuredClone(batchTableDataSource),
	);

	async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (editBatchTableDataSource.isPending) return;

		// console.log(
		// 	structuredClone({
		// 		updatedBatchTableDataSourceRef: updatedBatchTableDataSourceRef.current,
		// 		batchTableDataSource,
		// 	}),
		// );

		if (!updatedBatchTableDataSourceRef.current.source) {
			toast({
				description: "Please select a source",
				title: "Source was not provided!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		try {
			await editBatchTableDataSource.mutateAsync({
				batchTableDataSourceId: batchTableDataSource.id,
				organizationId: organizationId!,
				body: {
					interval_minutes:
						scheduleType === ScheduleType.INTERVAL_MINUTES
							? updatedBatchTableDataSourceRef.current.interval_minutes
							: undefined,
					cron_schedule:
						scheduleType === ScheduleType.CRON
							? updatedBatchTableDataSourceRef.current.cron_schedule
							: undefined,
					entity_handling_type:
						updatedBatchTableDataSourceRef.current.entity_handling_type,
					entity_type: updatedBatchTableDataSourceRef.current.entity_type,
					description: updatedBatchTableDataSourceRef.current.description,
					name: updatedBatchTableDataSourceRef.current.name,
					column_ids_to_remove: [],
					column_ids_to_add: [],
				},
			});

			setIsOpen(false);
		} catch (error) {
			console.error(error);
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger
				className="button-hover size-7 rounded-r-md flex items-center justify-center disabled:opacity-50 flex-none"
				title="Edit batch table data source"
				onClick={stopPropagation}
				disabled={disabled}
			>
				<Pencil className="size-3 stroke-1" />
			</DialogTrigger>

			{isOpen ? (
				<DialogContent
					className="z-100 simple-scrollbar max-h-[90vh]"
					onPointerDownOutside={preventDefault}
					overlayClassName="z-100"
				>
					<DialogHeader>
						<DialogTitle>Edit Batch Table Data Source</DialogTitle>

						<DialogDescription>
							Edit existing batch table data source.
						</DialogDescription>
					</DialogHeader>

					<form
						className="flex flex-col items-start justify-center gap-6 [&_label]:text-sm"
						onSubmit={handleEdit}
					>
						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Name</label>

							<Input
								onChange={(e) =>
									(updatedBatchTableDataSourceRef.current.name = e.target.value)
								}
								defaultValue={batchTableDataSource.name}
							/>
						</fieldset>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Description</label>

							<StyledTextarea
								onChange={(e) =>
									(updatedBatchTableDataSourceRef.current.description =
										e.target.value)
								}
								defaultValue={batchTableDataSource.description}
							/>
						</fieldset>

						<SelectSource
							newBatchTableDataSourceRef={updatedBatchTableDataSourceRef}
							defaultValue={batchTableDataSource.source}
						/>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Entity Type</label>

							<Select
								defaultValue={batchTableDataSource.entity_type}
								onValueChange={(newValue) =>
									(updatedBatchTableDataSourceRef.current.entity_type =
										newValue as BatchTableDataSourceEntityType)
								}
							>
								<SelectTrigger className="w-fit gap-3">
									<SelectValue className="capitalize" />
								</SelectTrigger>

								<SelectContent className="z-101">
									{BatchTableDataSourceEntityTypes.map((type) => (
										<SelectItem className="capitalize" value={type} key={type}>
											{titleCase(type.toLowerCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</fieldset>

						<fieldset className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Entity Handling Type</label>

							<Select
								defaultValue={batchTableDataSource.entity_handling_type}
								onValueChange={(newValue) =>
									(updatedBatchTableDataSourceRef.current.entity_handling_type =
										newValue as BatchTableDataSourceEntityHandlingType)
								}
							>
								<SelectTrigger>
									<SelectValue className="capitalize" />
								</SelectTrigger>

								<SelectContent className="z-101">
									{BatchTableDataSourceEntityHandlingTypes.map((type) => (
										<SelectItem className="capitalize" value={type} key={type}>
											{titleCase(type.toLowerCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</fieldset>

						<div className="flex flex-col items-start gap-1 w-full">
							<label className="font-semibold">Schedule</label>

							<fieldset className="flex flex-col items-start gap-6 w-full border border-border-smooth rounded-lg p-4">
								<RadioGroup
									defaultValue={
										batchTableDataSource.cron_schedule
											? ScheduleType.CRON
											: ScheduleType.INTERVAL_MINUTES
									}
									onValueChange={(v) => setScheduleType(v as ScheduleType)}
									className="flex gap-10 items-center"
								>
									<label className="flex items-center gap-2 onfocus:underline active:brightness-150">
										<RadioGroupItem value={ScheduleType.CRON} />

										<span>Schedule by {ScheduleType.CRON}</span>
									</label>

									<label className="flex items-center gap-2 onfocus:underline active:brightness-150">
										<RadioGroupItem value={ScheduleType.INTERVAL_MINUTES} />

										<span>Schedule by {ScheduleType.INTERVAL_MINUTES}</span>
									</label>
								</RadioGroup>

								<div className="cron flex items-start gap-10 w-full justify-between">
									{scheduleType === ScheduleType.INTERVAL_MINUTES ? (
										<Input
											defaultValue={batchTableDataSource.interval_minutes}
											placeholder="Interval in minutes"
											className="w-1/3"
											type="number"
											min={1}
											onChange={(e) => {
												const newValue = e.target.valueAsNumber;

												if (!isValidNumber(newValue) || newValue < 1) {
													updatedBatchTableDataSourceRef.current.interval_minutes = 1;
													updatedBatchTableDataSourceRef.current.cron_schedule =
														"";
													e.target.value = "1";

													return;
												}

												updatedBatchTableDataSourceRef.current.interval_minutes =
													newValue;
												updatedBatchTableDataSourceRef.current.cron_schedule =
													"";
											}}
										/>
									) : (
										<Cron
											defaultValue={
												batchTableDataSource.cron_schedule ?? "* * * * * *"
											}
											onChange={(v) => {
												updatedBatchTableDataSourceRef.current.interval_minutes =
													NaN;
												updatedBatchTableDataSourceRef.current.cron_schedule =
													v;
											}}
										/>
									)}

									<Button>Sync Batch Table Source</Button>
								</div>
							</fieldset>
						</div>

						<DialogFooter className="w-full items-center justify-end">
							<Button
								variant={ButtonVariant.PURPLE}
								isLoading={editBatchTableDataSource.isPending}
								type="submit"
							>
								Edit{editBatchTableDataSource.isPending ? "ing..." : ""}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			) : null}
		</Dialog>
	);
}
