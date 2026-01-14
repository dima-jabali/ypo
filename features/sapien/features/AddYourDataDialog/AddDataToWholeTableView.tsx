import { CaseSensitive, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import { ChooseExistingColumnPopover } from "./ChooseExistingColumnPopover";
import { ChooseNewColumnFromFilePopover } from "./ChooseNewColumnFromFilePopover";
import {
	DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
	DEFAULT_OPTIONS,
	HowToAddData,
	type ExistingColumn,
	type SelectedColumnToAdd,
} from "./common";
import { PreviewTable } from "./PreviewTable";
import { SelectMultipleColumnsDialog } from "./SelectMultipleColumnsDialog";
import { matchColumnNames, parseCSVAsRows } from "./transformFileData";
import {
	useBatchTableColumnsArray,
	useIsTableEmpty,
} from "../../hooks/get/use-fetch-batch-table-by-id";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { getErrorMessage, isValidNumber, noop } from "#/helpers/utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { postAndIndexFile } from "../../lib/post-and-index-file";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";
import { Button } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { ToggleGroup, ToggleGroupItem } from "#/components/toggle-group";
import { Loader } from "#/components/Loader";
import { useWebsocketStore } from "#/contexts/Websocket/context";

type Props = {
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AddDataToWholeTableView({ setIsAddDataDialogOpen }: Props) {
	const [isTransforming, setIsTransforming] = useState(false);
	const [options, setOptions] = useState(DEFAULT_OPTIONS);
	const [isAddingData, setIsAddingData] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const columnsArray = useBatchTableColumnsArray();
	const organizationId = useWithOrganizationId();
	const websocketStore = useWebsocketStore();
	const isTableEmpty = useIsTableEmpty();

	const allColumnsFromFile: Array<SelectedColumnToAdd> = Object.keys(
		options.parsedCSVAsRows[0] || {},
	).map((name) => ({
		label: name,
		value: name,
		id: name,
		name,
	}));

	function handleOpenFileChooser() {
		fileInputRef.current?.click();
	}

	function handleSetDefaultMappedColumns(
		allAvailableColumnsFromFile: Array<SelectedColumnToAdd>,
		caseSensitive: boolean,
	) {
		const existingColumns: Array<ExistingColumn> = [];

		for (const column of columnsArray) {
			if (!column.name) continue;

			existingColumns.push({ name: column.name, id: column.id });
		}

		return matchColumnNames(
			existingColumns,
			allAvailableColumnsFromFile,
			caseSensitive,
		);
	}

	async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files ?? [];

		if (!files || files.length === 0) return;

		const [file] = files;

		if (file) {
			let text_ = "",
				parsedCSVAsColumns_: Record<string, string | number>[] = [];

			try {
				setIsTransforming(true);

				if (file?.type === "text/csv") {
					const text = await file.text();
					text_ = text;

					const parsedCSVAsRows = await parseCSVAsRows(text);
					parsedCSVAsColumns_ = parsedCSVAsRows;

					const allColumnsFromFile: Array<SelectedColumnToAdd> = Object.keys(
						parsedCSVAsRows[0] || {},
					).map((name) => ({
						label: name,
						value: name,
						id: name,
						name,
					}));

					setOptions((prev) => ({
						...prev,
						columnsToMap: handleSetDefaultMappedColumns(
							allColumnsFromFile,
							options.caseSensitive,
						),
						columnsToAdd: allColumnsFromFile,
						parsedCSVAsRows,
						file,
					}));
				}
			} catch (error) {
				console.error("Error parsing CSV:", {
					parsedCSVAsColumns_,
					error,
					text_,
					file,
				});

				toast({
					title: `Error parsing CSV file: "${file.name}"`,
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});
			} finally {
				setIsTransforming(false);
			}
		}
	}

	function handleChangeHowToAddData(e: React.ChangeEvent<HTMLInputElement>) {
		const newWay = e.target.value as HowToAddData;

		setOptions((prev) => ({
			...prev,
			howToAddData: newWay,
		}));
	}

	function handleChangeCaseSensitivity(newValues: Array<string>) {
		const isCaseSensitive = newValues.includes("case-sensitive");

		setOptions((prev) => {
			return {
				...prev,
				caseSensitive: isCaseSensitive,
				columnsToMap: handleSetDefaultMappedColumns(
					options.columnsToAdd,
					isCaseSensitive,
				),
			};
		});
	}

	async function handleSaveUploadFiles() {
		if (isAddingData) return;

		const isFormEmpty = options.columnsToAdd.length === 0;

		if (isFormEmpty) {
			toast({
				variant: ToastVariant.Destructive,
				title: "No data to add!",
			});

			return;
		}

		try {
			setIsAddingData(true);

			if (options.file) {
				if (!isValidNumber(organizationId)) {
					throw new Error("Invalid organization id!", {
						cause: `Expected a valid number for "organizationId" but got: "${organizationId}"`,
					});
				}

				const res = await postAndIndexFile({
					tryToSubscribeToFileUpdates:
						websocketStore.tryToSubscribeToFileUpdates,
					onUploadProgress: noop,
					file: options.file,
					organizationId,
				});

				console.log({ res });

				// const columnsToAdd = new Set(
				// 	options.columnsToAdd.map((column) => column.name),
				// );

				// Call the UPDATE_CELL patch with its value set to: [{ id: 1 }]
				// const fileColumn = {};
				// for (const row of options.parsedCSVAsRows) {
				// 	for (const [headerName, value] of Object.entries(row)) {
				// 		if (columnsToAdd.has(headerName)) {
				// 			// const newCell: BatchTableCell = {
				// 			// 	column: { id: NaN },
				// 			// 	value,
				// 			// };
				// 		} else {
				// 			continue;
				// 		}
				// 	}
				// }
			}

			// if (hasEntityColumn) {
			// 	// If there's an entity column on the table, only add data there:
			// } else if (isThereAnyColumnsOnTable) {
			// 	// Only add the file's id to the file column on the table:
			// }

			setIsAddDataDialogOpen(false);
		} catch (error) {
			console.log("Error sending data to add to table!", { error, options });

			toast({
				title: "Error sending data to add to table!",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsAddingData(false);
		}
	}

	function handleSelectExistingColumnToJoin(
		existingColumn: ExistingColumn,
		index: number,
	) {
		setOptions((prev) => {
			const prevColumnsToJoin = prev.columnsToJoin;
			const nextColumnsToJoin = [...prevColumnsToJoin];
			const oldValue = nextColumnsToJoin[index];

			if (!oldValue) {
				console.log("unimplemented! oldValue is undefined", {
					existingColumn,
					index,
					prev,
				});

				return prev;
			}

			nextColumnsToJoin[index] = [existingColumn, oldValue[1]];

			return {
				...prev,
				columnsToJoin: nextColumnsToJoin,
			};
		});
	}

	function handleSelectNewColumnToJoin(nameOfNewColumn: string, index: number) {
		setOptions((prev) => {
			const prevColumnsToJoin = prev.columnsToJoin;
			const nextColumnsToJoin = [...prevColumnsToJoin];
			const oldValue = nextColumnsToJoin[index];

			if (!oldValue) {
				console.log("unimplemented! oldValue is undefined", {
					nameOfNewColumn,
					index,
					prev,
				});

				return prev;
			}

			nextColumnsToJoin[index] = [oldValue[0], nameOfNewColumn];

			return {
				...prev,
				columnsToJoin: nextColumnsToJoin,
			};
		});
	}

	function handleSelectExistingColumnToMap(
		existingColumn: ExistingColumn,
		index: number,
	) {
		setOptions((prev) => {
			const prevColumnsToMap = prev.columnsToMap;
			const nextColumnsToMap = [...prevColumnsToMap];
			const oldValue = nextColumnsToMap[index];

			if (!oldValue) {
				console.log("unimplemented! oldValue is undefined", {
					existingColumn,
					index,
					prev,
				});

				return prev;
			}

			nextColumnsToMap[index] = [existingColumn, oldValue[1]];

			return {
				...prev,
				columnsToMap: nextColumnsToMap,
			};
		});
	}

	function handleSelectNewColumnToMap(nameOfNewColumn: string, index: number) {
		setOptions((prev) => {
			const prevColumnsToMap = prev.columnsToMap;
			const nextColumnsToMap = [...prevColumnsToMap];
			const oldValue = nextColumnsToMap[index];

			if (!oldValue) {
				console.log("unimplemented! oldValue is undefined", {
					nameOfNewColumn,
					index,
					prev,
				});

				return prev;
			}

			nextColumnsToMap[index] = [oldValue[0], nameOfNewColumn];

			return {
				...prev,
				columnsToMap: nextColumnsToMap,
			};
		});
	}

	function handleAddMapColumnsRow() {
		setOptions((prev) => ({
			...prev,
			columnsToJoin: [...prev.columnsToMap, DEFAULT_COLUMNS_TO_JOIN_OR_MAP[0]!],
		}));
	}

	function handleRemoveJoinRow() {
		setOptions((prev) => ({
			...prev,
			columnsToJoin: DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
		}));
	}

	function handleRemoveMapColumnRow(index: number) {
		setOptions((prev) => ({
			...prev,
			columnsToMap: prev.columnsToMap.filter((_, i) => i !== index),
		}));
	}

	function handleSelectColumnsToAdd(columnsToAdd: Array<SelectedColumnToAdd>) {
		setOptions((prev) => ({
			...prev,
			columnsToAdd,
			columnsToJoin: handleSetDefaultMappedColumns(
				columnsToAdd,
				options.caseSensitive,
			),
		}));
	}

	return (
		<div className="flex flex-col h-full w-full gap-8 justify-between">
			<section className="flex h-full flex-col gap-4">
				<input
					onChange={handleFileChosen}
					ref={fileInputRef}
					className="hidden"
					accept=".csv"
					type="file"
				/>

				{options.file ? (
					<section className="flex justify-between gap-4">
						<div className="flex gap-4">
							{isTableEmpty ? null : (
								<>
									<fieldset className="flex flex-col gap-2 p-3 rounded-lg border-2 border-border-smooth ">
										<label className="text-sm font-semibold">
											How to handle new data?
										</label>

										<RadioGroup
											className="flex flex-col text-primary gap-1"
											onChange={handleChangeHowToAddData}
											defaultValue={options.howToAddData}
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value={HowToAddData.Concat} id="r1" />

												<label
													className="w-full hover:underline text-sm"
													htmlFor="r1"
												>
													{HowToAddData.Concat}
												</label>
											</div>

											<div className="flex items-center space-x-2">
												<RadioGroupItem value={HowToAddData.Merge} id="r2" />

												<label
													className="w-full hover:underline text-sm"
													htmlFor="r2"
												>
													{HowToAddData.Merge}
												</label>
											</div>
										</RadioGroup>
									</fieldset>

									<ToggleGroup
										className="flex gap-1 p-1 border-2 border-border-smooth  rounded-lg bg-transparent h-fit"
										onValueChange={handleChangeCaseSensitivity}
										type="multiple"
									>
										<ToggleGroupItem
											className="button-hover data-[state=on]:bg-button-active aspect-square overflow-hidden p-0"
											title="Toggle case sensitivity"
											value="case-sensitive"
										>
											<CaseSensitive className="stroke-primary size-6" />
										</ToggleGroupItem>
									</ToggleGroup>
								</>
							)}
						</div>

						<div>
							<SelectMultipleColumnsDialog
								description="Choose the columns from your file that you want to be added."
								onSelect={handleSelectColumnsToAdd}
								initialValue={options.columnsToAdd}
								allColumns={allColumnsFromFile}
							/>
						</div>
					</section>
				) : (
					<Button
						onClick={handleOpenFileChooser}
						title="Add CSV file"
						className="mt-auto"
						variant="purple"
					>
						<Plus className="size-4" />

						<span>Choose CSV file</span>
					</Button>
				)}

				{/* Preview of file section: */}
				{options.file ? (
					<section className="flex flex-col max-w-full overflow-hidden">
						<PreviewTable
							parsedCSVAsColumns={options.parsedCSVAsRows}
							columnsToAdd={options.columnsToAdd}
						/>
					</section>
				) : isTransforming ? (
					<div className="flex items-center justify-center h-full w-full">
						<Loader />
					</div>
				) : null}

				{/* SQL Join section: */}
				{options.file && !isTableEmpty ? (
					<section className="flex flex-col gap-6">
						<hr className="border-border-smooth" />

						<header>
							<h3 className="text-lg font-semibold">Join columns</h3>

							<p className="text-sm text-muted-foreground">
								Choose the column that you want to perform a SQL join operation.
							</p>
						</header>

						<div className="flex flex-col gap-2">
							{options.columnsToJoin.map(
								([existingColumn, newColumn], index) => (
									<div
										className="flex items-center gap-4 w-full max-w-full"
										key={Math.random()}
									>
										<ChooseExistingColumnPopover
											onSelect={handleSelectExistingColumnToJoin}
											defaultValue={existingColumn.name}
											index={index}
										/>

										<ChooseNewColumnFromFilePopover
											onSelect={handleSelectNewColumnToJoin}
											columnsfromFile={allColumnsFromFile}
											defaultValue={newColumn}
											index={index}
										/>

										{options.columnsToJoin.length <= 1 ? null : (
											<Button
												onClick={() => handleRemoveJoinRow()}
												title="Delete join operation"
												variant="destructive"
											>
												<X className="size-4 h-full flex-none" />
											</Button>
										)}
									</div>
								),
							)}
						</div>
					</section>
				) : null}

				{/* Map of columns section: */}
				{options.file && !isTableEmpty ? (
					<section className="flex flex-col gap-6">
						<hr className="border-border-smooth" />

						<header>
							<h3 className="text-lg font-semibold">Map columns</h3>

							<p className="text-sm text-muted-foreground">
								Choose columns from your file that you want to map to the
								existing columns in your table.
							</p>
						</header>

						<section className="flex flex-col gap-2">
							{options.columnsToMap.map(
								([existingColumn, newColumn], index) => (
									<div
										className="flex items-center gap-4 w-full max-w-full"
										key={Math.random()}
									>
										<ChooseExistingColumnPopover
											onSelect={handleSelectExistingColumnToMap}
											defaultValue={existingColumn.name}
											index={index}
										/>

										<ChooseNewColumnFromFilePopover
											onSelect={handleSelectNewColumnToMap}
											columnsfromFile={allColumnsFromFile}
											defaultValue={newColumn}
											index={index}
										/>

										{options.columnsToMap.length <= 1 ? null : (
											<Button
												onClick={() => handleRemoveMapColumnRow(index)}
												title="Delete row of map of columns"
												variant="destructive"
											>
												<X className="size-4 h-full flex-none" />
											</Button>
										)}
									</div>
								),
							)}
						</section>

						<footer>
							<Button onClick={handleAddMapColumnsRow} variant="default">
								<Plus className="size-4" />

								<span>Add column to be mapped</span>
							</Button>
						</footer>
					</section>
				) : null}
			</section>

			<section className="flex flex-col gap-[23px]">
				<DialogFooter className="flex w-full items-center">
					<Button
						onClick={handleSaveUploadFiles}
						isLoading={isAddingData}
						variant="success"
					>
						Add{isAddingData ? "ing" : ""} data{isAddingData ? "..." : ""}
					</Button>
				</DialogFooter>

				<div className="min-h-[1px]">{/* To prevent margin collapse! */}</div>
			</section>
		</div>
	);
}
