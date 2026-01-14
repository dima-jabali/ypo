/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HeaderContext } from "@tanstack/react-table";
import { memo, useState } from "react";
import { titleCase } from "scule";

import { Ban, Check, ChevronDownIcon } from "lucide-react";
import { Step, useFillSheetStore } from "./fillSheetContext";
import type { AnyColumn } from "#/features/sapien/lib/table-utils";
import {
	BATCH_TABLE_METADATA_COLUMN_TYPE_OPTIONS,
	type BatchTableColumnIndex,
} from "#/types/batch-table";
import {
	isValidNumber,
	preventDefault,
	stopPropagation,
} from "#/helpers/utils";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { columnNameById } from "#/features/sapien/components/column-options-popover/utils";

type TableHeaderContentProps = {
	tanStackColumn: AnyColumn;
	headerWidth: number;

	headerName: string;
};

export type HeaderMetaProps = {
	headerName: string;
};

const TableHeaderContent: React.FC<TableHeaderContentProps> = memo(
	function TableHeaderContent({ tanStackColumn, headerWidth, headerName }) {
		const [isMapColumnPopoverOpen, setIsMapColumnPopoverOpen] = useState(false);

		const alredyMappedColumns = useFillSheetStore().use.alredyMappedColumns();
		const batchTableColumns = useFillSheetStore().use.batchTableColumns();
		const updateColumns = useFillSheetStore().use.updateColumns();
		const columns = useFillSheetStore().use.columns();
		const step = useFillSheetStore().use.step();

		const columnIndex = tanStackColumn.getIndex() as BatchTableColumnIndex;
		const csvColumn = columns[columnIndex];

		if (!csvColumn) {
			console.error("No CSV column found! This should not happen", {
				columnIndex,
				columns,
			});

			return null;
		}

		const csvColumnSelectedType = csvColumn?.column_type;
		const columnIdMappedTo = csvColumn?.mapped_batch_column_id ?? null;
		const hasColumnMapping = isValidNumber(columnIdMappedTo);
		const columnMappedTo = hasColumnMapping
			? (batchTableColumns.find((column) => column.id === columnIdMappedTo) ??
				null)
			: null;
		const shouldSelectTypesForColumn = step === Step.SelectColumnTypes;
		const isPopoverEnabled =
			step === Step.MapColumns ||
			(shouldSelectTypesForColumn && columnIdMappedTo === null);

		return (
			<th
				className="relative whitespace-nowrap border-r first:border-l border-border-smooth last-of-type:border-none"
				style={{ width: headerWidth }}
			>
				<div className="flex flex-col">
					<span className="truncate flex gap-2 p-2" title={headerName}>
						{headerName}
					</span>

					<section
						className="flex items-center gap-2 p-2 pt-0 overflow-hidden"
						aria-label="Select column mapping"
					>
						{/* <KeyboardReturn
						className="size-4 stroke-2 transform-[scale(1,-1)] rotate-180 fill-muted flex-none"
						title="Map to column"
					/> */}

						<Popover
							onOpenChange={setIsMapColumnPopoverOpen}
							open={isMapColumnPopoverOpen}
							modal={false}
						>
							<PopoverTrigger
								className="flex justify-between items-center h-8 border border-border-smooth rounded-sm py-1 px-2 gap-2 text-xs overflow-hidden button-hover max-w-full"
								disabled={!isPopoverEnabled}
								title={
									isPopoverEnabled
										? "Choose an operator"
										: "Columns already mapped have an existing type"
								}
							>
								<span className="truncate">
									{shouldSelectTypesForColumn
										? hasColumnMapping
											? titleCase(
													columnMappedTo?.column_type?.toLowerCase() || "?",
												)
											: titleCase(csvColumn?.column_type?.toLowerCase() || "?")
										: (columnNameById(batchTableColumns, columnIdMappedTo) ?? (
												<i>Create new column</i>
											))}
								</span>

								{isPopoverEnabled ? (
									<ChevronDownIcon className="size-4 flex-none" />
								) : (
									<Ban className="size-4 flex-none" />
								)}
							</PopoverTrigger>

							{isMapColumnPopoverOpen ? (
								<PopoverContent
									className="flex flex-col justify-start items-start min-w-min w-full gap-1 p-1 max-h-[45vh] pointer-events-auto z-120"
									onCloseAutoFocus={preventDefault}
									onOpenAutoFocus={preventDefault}
									onFocusOutside={preventDefault}
									onFocusCapture={preventDefault}
									onWheel={stopPropagation} // Needed to enable scroll of a popover inside a dialog
									onFocus={preventDefault}
									autoFocus={false}
									side="bottom"
								>
									{shouldSelectTypesForColumn ? (
										<>
											{BATCH_TABLE_METADATA_COLUMN_TYPE_OPTIONS.map(
												(option) => {
													const isActive = csvColumnSelectedType === option;

													return (
														<button
															className="w-full text-left rounded-md py-1 px-2 button-hover text-xs data-[default-checked=true]:bg-button-hover first-letter:capitalize min-h-6 italic"
															onClick={() => {
																updateColumns({
																	...csvColumn,
																	column_type: option,
																});

																setIsMapColumnPopoverOpen(false);
															}}
															data-default-checked={isActive}
															key={option}
														>
															{titleCase(option.toLowerCase())}
														</button>
													);
												},
											)}
										</>
									) : (
										<>
											<button
												className="w-full text-left rounded-xs py-1 px-2 button-hover text-xs data-[default-checked=true]:bg-button-hovermin-h-6 italic"
												onClick={() =>
													updateColumns({
														...csvColumn,
														mapped_batch_column_id: null,
													})
												}
												data-default-checked={columnIdMappedTo === null}
											>
												Create new column
											</button>

											<hr className="border-border-smooth border-t flex-none w-full" />

											<ol className="flex flex-col gap-0 simple-scrollbar">
												{batchTableColumns.map((col) => {
													const batchTableColumnId = col.id;
													const isActive =
														columnIdMappedTo === batchTableColumnId;
													const hasAlreadyBeenMapped =
														!isActive &&
														isValidNumber(
															alredyMappedColumns.find(
																(id) => id === batchTableColumnId,
															),
														);

													return (
														<button
															className="w-full text-left rounded-md py-1 px-2 button-hover text-xs data-[default-checked=true]:bg-button-hover min-h-6 flex gap-2 items-center disabled:cursor-not-allowed"
															title={
																hasAlreadyBeenMapped
																	? "Column already mapped"
																	: "Map to this column"
															}
															onClick={() => {
																updateColumns({
																	...csvColumn,
																	mapped_batch_column_id: batchTableColumnId,
																});

																setIsMapColumnPopoverOpen(false);
															}}
															disabled={hasAlreadyBeenMapped}
															data-default-checked={isActive}
															key={batchTableColumnId}
														>
															{isActive ? (
																<Check className="size-4" />
															) : hasAlreadyBeenMapped ? (
																<Ban className="size-4" />
															) : (
																<span className="size-4"></span>
															)}

															{columnNameById(
																batchTableColumns,
																batchTableColumnId,
															)}
														</button>
													);
												})}
											</ol>
										</>
									)}
								</PopoverContent>
							) : null}
						</Popover>
					</section>
				</div>
			</th>
		);
	},
);

export function TableHeader({ column, header }: HeaderContext<any, unknown>) {
	const columnMeta = column.columnDef.meta as HeaderMetaProps | undefined;
	const { headerName = "" } = columnMeta ?? {};
	const headerWidth = column.getSize();

	return (
		<TableHeaderContent
			headerWidth={headerWidth}
			headerName={headerName}
			tanStackColumn={column}
			key={header.id}
		/>
	);
}
