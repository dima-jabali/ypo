import { ChevronDown, SparklesIcon } from "lucide-react";
import { Popover as PopoverPrimitive, Portal } from "radix-ui";
import { useMemo, useReducer, useRef, useState } from "react";
import { titleCase } from "scule";

import { Button } from "#/components/Button";
import { Input } from "#/components/Input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "#/components/select";
import { StyledTextarea } from "#/components/styled-text-area";
import { Switch } from "#/components/switch";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	createBatchTableColumnUuid,
	dbg,
	getErrorMessage,
} from "#/helpers/utils";
import { useForceRender } from "#/hooks/use-force-render";
import {
	BatchTableMetadataColumnType,
	BatchTableToolSettingsInheritanceType,
	DerivationType,
	type BatchTableCellFormatPattern,
	type BatchTableColumn,
	type BatchTableColumnId,
	type BatchTableColumnIndex,
	type BatchTableColumnUuid,
	type BatchTableToolSettings,
	type BatchTableToolSettingsId,
} from "#/types/batch-table";
import type { ISODateString } from "#/types/general";
import type { BetterbrainUser } from "#/types/notebook";
import { useMentionablesStore } from "../../contexts/mentionables/mentionables-context";
import {
	useTableUIStore,
	useWithOpenedColumnOptions,
	WithOpenedColumnOptions,
} from "../../contexts/table-ui";
import { ToolSettings } from "../../features/AddYourDataDialog/AddDataUsingAI/TabsContent/ToolSettings/ToolSettings";
import { ConditionalExecutionFiltersContextProvider } from "../../features/conditional-execution-filters-popover/FiltersContextProvider";
import { ConditionalExecutionFilterPopover } from "../../features/conditional-execution-filters-popover/conditional-execution-filter-popover";
import {
	useBatchTableColumnByIndex,
	useBatchTableColumnsArray,
} from "../../hooks/get/use-fetch-batch-table-by-id";
import {
	BatchTablePatchType,
	RunAgentDataType,
	usePatchBatchTableById,
} from "../../hooks/patch/use-patch-batch-table-by-id";
import { MentionInput } from "../mention-input/MentionInput";
import { convertStringToPlateValue } from "./convert-string-to-plate-value";
import { columnNameById, matchBatchTableColumnTypeAndIcon } from "./utils";
import { DataSourcesDropdown } from "./data-sources-dropdown";

const BATCH_TABLE_METADATA_COLUMN_TYPE = Object.values(
	BatchTableMetadataColumnType,
);
const DERIVATION_TYPES = Object.values(DerivationType);

const DEFAULT_BATCH_TABLE_COLUMN: BatchTableColumn = {
	column_format: {
		isVisible: true,
		width: 150,
	},
	column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
	last_modified_by: null as unknown as BetterbrainUser,
	created_by: null as unknown as BetterbrainUser,
	column_index: NaN as BatchTableColumnIndex,
	uuid: "" as BatchTableColumnUuid,
	updated_at: "" as ISODateString,
	created_at: "" as ISODateString,
	id: NaN as BatchTableColumnId,
	column_type_specific_info: {},
	execution_condition: null,
	derived_from_column: null,
	derivation_path: null,
	derivation_type: null,
	name: "New column",
	is_derived: false,
	default_value: "",
	description: "",
	use_ai: true,
	prompt: "",
	tool_settings: {
		inheritance_type: BatchTableToolSettingsInheritanceType.INHERIT,
		id: NaN as BatchTableToolSettingsId,
		tool_configurations: [],
		use_all_columns: false,
		source_columns: [],
	},
};

export function ColumnOptionsPopover() {
	return (
		<WithOpenedColumnOptions>
			<ConditionalExecutionFiltersContextProvider>
				<ColumnOptionsPopoverWithAllDefined />
			</ConditionalExecutionFiltersContextProvider>
		</WithOpenedColumnOptions>
	);
}

function ColumnOptionsPopoverWithAllDefined() {
	const { columnIndex, left, top } = useWithOpenedColumnOptions();
	const batchTableColumn = useBatchTableColumnByIndex(columnIndex);
	const organizationId = generalContextStore.use.organizationId();
	const mentionables = useMentionablesStore().use.mentionables();
	// const hideColumn = useBatchTableData(selectHideColumn);
	const batchTableId = generalContextStore.use.batchTableId()!;
	const patchBatchTable = usePatchBatchTableById();
	const columns = useBatchTableColumnsArray();
	const tableUIStore = useTableUIStore();
	const forceRender = useForceRender();

	function closePopover() {
		tableUIStore.setState({
			openedColumnOptions: null,
		});
	}

	const [shouldShowDerivedPathChoose, setShouldShowDerivedPathChoose] =
		useState(batchTableColumn?.is_derived);
	const [isDerivedFromColumnPopoverOpen, setIsDerivedFromColumnPopoverOpen] =
		useState(false);
	const [isDerivationTypePopoverOpen, setIsDerivationTypePopoverOpen] =
		useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const platePromptInitialValue = useMemo(
		() =>
			convertStringToPlateValue(`${batchTableColumn?.prompt ?? ""}`, {
				mentionables,
			}),
		[batchTableColumn?.prompt, mentionables],
	);

	const changesRef = useRef<
		Partial<
			BatchTableColumn & {
				numberFormat?: BatchTableCellFormatPattern;
			}
		>
		// @ts-expect-error => ignore
	>({
		tool_settings:
			batchTableColumn?.tool_settings ??
			DEFAULT_BATCH_TABLE_COLUMN.tool_settings,
		derivation_type:
			batchTableColumn?.derivation_type ?? DerivationType.JSON_COLUMN_DATA,
		column_type:
			batchTableColumn?.column_type ?? DEFAULT_BATCH_TABLE_COLUMN.column_type,
		execution_condition: batchTableColumn?.execution_condition,
		derived_from_column: batchTableColumn?.derived_from_column,
		derivation_path: batchTableColumn?.derivation_path,
		is_derived: batchTableColumn?.is_derived,
		use_ai: batchTableColumn?.use_ai,
	});

	const promptPlateEditorKey = `column-options&column=${batchTableColumn?.uuid}:${columnIndex}`;

	const isFileColumn =
		batchTableColumn?.column_type === BatchTableMetadataColumnType.FILE;
	const toolSettings = changesRef.current.tool_settings;

	function handleChangeColumnToDeriveFrom(newColumn: BatchTableColumn) {
		setIsDerivedFromColumnPopoverOpen(false);

		changesRef.current.derived_from_column = {
			uuid: newColumn.uuid,
			id: newColumn.id,
		};

		forceRender();
	}

	function handleChangeColumnDerivationType(newDerivationType: DerivationType) {
		setIsDerivationTypePopoverOpen(false);

		changesRef.current.derivation_type = newDerivationType;

		forceRender();
	}

	function handleChangeType(type: BatchTableMetadataColumnType) {
		changesRef.current.column_type = type;

		forceRender();
	}

	function handleChangeName(e: React.ChangeEvent<HTMLInputElement>) {
		changesRef.current.name = e.target.value;
	}

	function handleChangeUseAI(newChecked: boolean) {
		changesRef.current.use_ai = newChecked;
	}

	async function handleSave() {
		try {
			setIsSaving(true);

			dbg("Saving column!", {
				changes: structuredClone(changesRef.current),
				batchTableColumn,
				columnIndex,
			});

			if (batchTableColumn) {
				await patchBatchTable.mutateAsync({
					ignoreUpdates: false,
					organizationId,
					batchTableId,
					updates: [
						{
							type: BatchTablePatchType.UpdateColumn,
							data: {
								uuid: batchTableColumn.uuid,
								column_index: columnIndex,
								...changesRef.current,
							},
						},
					],
				});
			} else {
				await patchBatchTable.mutateAsync({
					organizationId,
					batchTableId,
					updates: [
						// @ts-expect-error => ignore
						{
							type: BatchTablePatchType.AddColumn,
							data: {
								execution_condition: changesRef.current.execution_condition,
								derived_from_column: changesRef.current.derived_from_column,
								derivation_type: changesRef.current.derivation_type,
								derivation_path: changesRef.current.derivation_path,
								tool_settings: changesRef.current.tool_settings,
								column_type: changesRef.current.column_type!,
								description: changesRef.current.description,
								is_derived: changesRef.current.is_derived,
								uuid: createBatchTableColumnUuid(),
								use_ai: changesRef.current.use_ai,
								prompt: changesRef.current.prompt,
								name: changesRef.current.name,
								column_index: columnIndex,
							},
						},
					],
				});
			}

			closePopover();
		} catch (error) {
			console.error("Error saving column changes!", { error, changesRef });

			toast({
				title: "Error saving column changes!",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsSaving(false);
		}
	}

	function handleChangeDescription(e: React.ChangeEvent<HTMLTextAreaElement>) {
		changesRef.current.description = e.target.value;
	}

	function handleChangePrompt(plateValueAsText: string) {
		changesRef.current.prompt = plateValueAsText;
	}

	function handleChangeIsDerivedColumn(newIsDerivedColumn: boolean) {
		setShouldShowDerivedPathChoose(newIsDerivedColumn);

		changesRef.current.is_derived = newIsDerivedColumn;
	}

	function handleChangeDerivationPath(derivationPath: string) {
		changesRef.current.derivation_path = derivationPath.split(".");
	}

	async function handleRunColumn() {
		await handleSave();

		patchBatchTable.mutate({
			ignoreUpdates: false,
			organizationId,
			batchTableId,
			updates: [
				{
					type: BatchTablePatchType.RunAgent,
					data: {
						data: [
							{
								type: RunAgentDataType.Column,
								data: {
									column_index: columnIndex,
								},
							},
						],
						only_try_errored_cells: false,
						only_try_failed_cells: false,
						force: true,
					},
				},
			],
		});

		closePopover();
	}

	function TypeOfColumnSelector() {
		return (
			<fieldset>
				<label className="flex flex-col gap-1 text-sm text-primary">
					<span className="text-xs font-semibold">Type</span>

					<Select
						defaultValue={changesRef.current.column_type!}
						onValueChange={handleChangeType}
					>
						<SelectTrigger id="type" className="w-full">
							{matchBatchTableColumnTypeAndIcon(
								changesRef.current.column_type!,
								"",
							)}
						</SelectTrigger>

						<SelectContent>
							{BATCH_TABLE_METADATA_COLUMN_TYPE.map((type) => (
								<SelectItem
									className="flex flex-row! gap-2 whitespace-nowrap text-primary hover:text-white group"
									value={type}
									key={type}
								>
									{matchBatchTableColumnTypeAndIcon(type)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</label>
			</fieldset>
		);
	}

	return (
		<Popover onOpenChange={closePopover} open>
			<Portal.Root>
				<PopoverPrimitive.Anchor
					className="fixed size-3 pointer-events-none"
					style={{ top, left }}
					data-anchor-row
				/>
			</Portal.Root>

			<PopoverContent
				className="flex flex-col gap-4 select-none max-h-[70vh] w-72 max-w-72 p-2 simple-scrollbar rounded-lg list-none text-primary border border-border-smooth"
				collisionPadding={50}
				avoidCollisions
				side="bottom"
				align="start"
			>
				<fieldset className="p-0 flex flex-col gap-1">
					<label htmlFor="col-name" className="text-xs font-semibold">
						Column&apos;s name
					</label>

					<Input
						defaultValue={batchTableColumn?.name ?? ""}
						className="rounded-md flex-none h-9"
						onChange={handleChangeName}
						title="Column's name"
						id="col-name"
						required
					/>
				</fieldset>

				{isFileColumn ? (
					<>
						<TypeOfColumnSelector />

						{batchTableColumn ? (
							<DataSourcesDropdown batchTableColumn={batchTableColumn} />
						) : null}
					</>
				) : (
					<>
						<TypeOfColumnSelector />

						<fieldset className="p-0 flex flex-col gap-1">
							<label className="text-xs font-semibold" htmlFor="use-ai">
								Use AI
							</label>

							<Switch
								defaultChecked={Boolean(batchTableColumn?.use_ai)}
								onCheckedChange={handleChangeUseAI}
								id="use-ai"
							/>
						</fieldset>

						<fieldset>
							<label className="flex flex-col gap-1 text-primary">
								<span className="text-xs font-semibold">Tool settings</span>

								<ToolSettingsPopover
									changeableToolSettings={toolSettings}
									forceRender={forceRender}
								/>
							</label>
						</fieldset>

						<fieldset>
							<label className="flex flex-col gap-1 text-primary">
								<span className="text-xs font-semibold">
									Conditional execution
								</span>

								<ConditionalExecutionFilterPopover
									batchTableColumn={batchTableColumn}
									changesRef={changesRef}
									columns={columns}
								/>
							</label>
						</fieldset>

						<fieldset className="flex flex-col gap-1">
							<label className="text-xs font-semibold" htmlFor="is-derived">
								Is derived
							</label>

							<Switch
								defaultChecked={Boolean(batchTableColumn?.is_derived)}
								onCheckedChange={handleChangeIsDerivedColumn}
								id="is-derived"
							/>
						</fieldset>

						{shouldShowDerivedPathChoose ? (
							<>
								<fieldset className="flex flex-col gap-1">
									<label
										className="text-xs font-semibold"
										htmlFor="derive-from-column"
									>
										Derive from column
									</label>

									<Popover
										onOpenChange={setIsDerivedFromColumnPopoverOpen}
										open={isDerivedFromColumnPopoverOpen}
									>
										<PopoverTrigger
											className="inline-flex justify-between items-center h-9 min-w-full border border-border-smooth rounded-md py-1 px-2 gap-2 text-xs button-hover truncate"
											title="Choose an operator"
											id="derive-from-column"
										>
											{columnNameById(
												columns,
												changesRef.current.derived_from_column?.id,
											) ?? <i className="text-muted">Select column</i>}

											<ChevronDown className="size-4 flex-none" />
										</PopoverTrigger>

										<PopoverContent
											className="flex flex-col justify-start items-start min-w-min w-full gap-1 p-1 max-h-[50vh] simple-scrollbar"
											side="bottom"
										>
											{columns.map((col) => (
												<button
													className="group w-full text-left rounded-xs py-1 px-2 button-hover-accent text-xs data-[default-checked=true]:bg-button-accent data-[default-checked=true]:text-accent-foreground first-letter:capitalize min-h-6"
													data-default-checked={
														changesRef.current.derived_from_column?.id ===
														col.id
													}
													onClick={() => handleChangeColumnToDeriveFrom(col)}
													key={col.id}
												>
													{columnNameById(columns, col.id)}
												</button>
											))}
										</PopoverContent>
									</Popover>
								</fieldset>

								<fieldset className="flex flex-col gap-1">
									<label
										className="text-xs font-semibold"
										htmlFor="derivation-type"
									>
										Derivation type
									</label>

									<Popover
										onOpenChange={setIsDerivationTypePopoverOpen}
										open={isDerivationTypePopoverOpen}
									>
										<PopoverTrigger
											className="inline-flex justify-between items-center h-9 min-w-full border border-border-smooth rounded-md py-1 px-2 gap-2 text-xs button-hover truncate"
											title="Choose an operator"
											id="derivation-type"
										>
											{changesRef.current.derivation_type ? (
												titleCase(
													changesRef.current.derivation_type.toLowerCase(),
												)
											) : (
												<i>Select derivation type</i>
											)}

											<ChevronDown className="size-4 flex-none" />
										</PopoverTrigger>

										<PopoverContent
											className="flex flex-col w-(--radix-popper-anchor-width) justify-start items-start gap-1 p-1 max-h-[50vh]"
											side="bottom"
										>
											{DERIVATION_TYPES.map((derivationType) => (
												<button
													className="w-full text-left rounded-sm py-1 px-2 button-hover-accent text-xs data-[default-checked=true]:bg-accent data-[default-checked=true]:text-accent-foreground first-letter:capitalize h-9"
													data-default-checked={
														changesRef.current.derivation_type ===
														derivationType
													}
													onClick={() =>
														handleChangeColumnDerivationType(derivationType)
													}
													key={derivationType}
												>
													{titleCase(derivationType.toLowerCase())}
												</button>
											))}
										</PopoverContent>
									</Popover>
								</fieldset>

								<fieldset className="flex flex-col gap-1">
									<label
										className="flex gap-1 justify-between text-sm text-primary items-start"
										htmlFor="derivation-path"
									>
										<span className="text-xs font-semibold">
											Derivation path
										</span>

										<i className="text-xs text-muted-foreground">
											(Separate by dots)
										</i>
									</label>

									<Input
										onChange={(e) => handleChangeDerivationPath(e.target.value)}
										defaultValue={batchTableColumn?.derivation_path?.join(".")}
										placeholder="E.g. data.name"
										id="derivation-path"
										className="h-9"
									/>
								</fieldset>
							</>
						) : null}

						<fieldset className="flex flex-col gap-1">
							<label
								className="text-xs font-semibold"
								htmlFor={promptPlateEditorKey}
							>
								Prompt
							</label>

							<MentionInput
								className="max-h-[80vh] simple-scrollbar border-border-smooth field-sizing-content min-h-16 w-full rounded-md border bg-transparent p-1 text-base shadow-xs outline-none md:text-sm resize-y max-w-[calc(18rem-1.5rem)] wrap-break-word"
								plateInitialValue={platePromptInitialValue}
								onValueChange={handleChangePrompt}
								id={promptPlateEditorKey}
								autoFocus={false}
							/>
						</fieldset>

						<fieldset className="flex flex-col gap-1">
							<label className="text-xs font-semibold" htmlFor="description">
								Description
							</label>

							<StyledTextarea
								className="max-w-[calc(18rem-1.5rem)] p-1 min-h-16"
								defaultValue={batchTableColumn?.description ?? ""}
								onChange={handleChangeDescription}
								id="description"
							/>
						</fieldset>
					</>
				)}

				<div className="flex flex-col gap-2">
					<Button
						onClick={handleSave}
						isLoading={isSaving}
						variant="success"
						size="sm"
					>
						Sav{isSaving ? "ing..." : "e"}
					</Button>

					<Button
						className="w-full border-none rounded-md px-2 justify-center"
						onClick={handleRunColumn}
						variant="purple"
						size="sm"
					>
						<SparklesIcon className="size-3.5 text-yellow-300" />

						<span>Run AI on column</span>
					</Button>
				</div>

				{/* {columnUuid ? (
					<div className="flex flex-col gap-1">
						<hr className="border-border-smooth  mb-1" />

						<Button
							className="w-full border-none rounded-md justify-start text-primary px-2"
							onClick={() => hideColumn(columnUuid)}
							variant="ghost"
							size="sm"
						>
							<EyeOff className="size-3.5" />

							<span>Hide column</span>
						</Button>
					</div>
				) : null} */}
			</PopoverContent>
		</Popover>
	);
}

const ToolSettingsPopover: React.FC<{
	changeableToolSettings: BatchTableToolSettings | undefined | null;
	forceRender: () => void;
}> = ({ changeableToolSettings, forceRender }) => {
	const [isOpen, setIsOpen] = useReducer((_prev: boolean, next: boolean) => {
		if (next === false) {
			forceRender();
		}

		return next;
	}, false);

	if (!changeableToolSettings) return null;

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger className="rounded-md flex items-center gap-2 justify-between button-hover min-h-9 border border-border-smooth py-1 pr-2 pl-1 group">
				<div className="flex items-center gap-2 flex-wrap">
					{changeableToolSettings.tool_configurations?.map((toolConfig) => {
						return (
							<span
								className="text-xs bg-primary/30 rounded-sm py-0.5 px-2"
								key={toolConfig.id}
							>
								{toolConfig.tool.user_name}
							</span>
						);
					})}
				</div>

				<ChevronDown className="size-4 group-data-[state=closed]:rotate-180 flex-none" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col rounded-lg w-[600px] text-sm max-h-[45vh] overflow-hidden p-2"
				sideOffset={7}
				side="bottom"
				align="end"
			>
				<ToolSettings
					changeableToolSettings={changeableToolSettings}
					parentForceRender={forceRender}
					isForBatchTable
				/>
			</PopoverContent>
		</Popover>
	);
};
