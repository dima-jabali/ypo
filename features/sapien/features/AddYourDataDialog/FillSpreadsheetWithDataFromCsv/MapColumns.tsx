/* eslint-disable @typescript-eslint/no-explicit-any */

import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { ArrowRight } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

import { BodyTableRow } from "./BodyTableRow";
import { Step, useFillSheetStore } from "./fillSheetContext";
import {
	mapHeaderToCell,
	measureDynamicRowHeight,
	type AnyCell,
	type AnyHeaderGroup,
	type AnyTableOptions,
} from "#/features/sapien/lib/table-utils";
import { useUploadCsvToSapien } from "#/features/sapien/hooks/post/use-upload-csv-to-sapien";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { Button } from "#/components/Button";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";

const getRowId: NonNullable<AnyTableOptions["getRowId"]> = (
	_originalRow,
	index,
) => `${index}`;
const estimateSize = () => 20;

const mapRowToCells = (cell: AnyCell) => (
	<td
		style={{ width: cell.column.getSize() }}
		className="relative"
		key={cell.id}
	>
		{flexRender(cell.column.columnDef.cell, cell.getContext())}
	</td>
);
const mapHeaderGroupToRows = (headerGroup: AnyHeaderGroup) => (
	<tr
		className="flex min-h-10 w-full text-primary font-bold text-sm border-border-smooth border-y bg-popover"
		key={headerGroup.id}
	>
		{headerGroup.headers.map(mapHeaderToCell)}
	</tr>
);

function MapColumnsRoot() {
	const fillSheetStore = useFillSheetStore();
	const parsedCsv = fillSheetStore.use.parsedCsv();
	const file = fillSheetStore.use.file();
	const step = fillSheetStore.use.step();

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable<any>({
		data: parsedCsv!.parsedCSVAsColumns,
		columns: parsedCsv!.columnDefs,
		enableColumnResizing: false,
		enableSortingRemoval: true,
		getSortedRowModel: getSortedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getRowId,
	});

	const bodyRef = useRef<HTMLTableSectionElement>(null);
	// The scrollable element for your list
	const parentRef = useRef<HTMLDivElement>(null);

	const [getScrollElement] = useState(() => () => parentRef.current);

	const { rows } = table.getRowModel();

	// @ts-expect-error => ignore
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		overscan: 50,
		measureElement: measureDynamicRowHeight,
		getScrollElement,
		estimateSize,
	});

	const mapRows = useCallback(
		(virtualRow: VirtualItem) => {
			const row = rows[virtualRow.index]!;

			return (
				<BodyTableRow
					ref={rowVirtualizer.measureElement} // Measure dynamic row height.
					virtualRow={virtualRow}
					item={row.original}
					table={table}
					key={row.id}
					row={row}
				>
					{row.getVisibleCells().map(mapRowToCells)}
				</BodyTableRow>
			);
		},
		[rowVirtualizer.measureElement, rows, table],
	);

	if (!file || !parsedCsv) return null;

	return (
		<>
			<h6 className="font-semibold text-lg m-0">
				{step === Step.MapColumns
					? "Map CSV columns to existing Sapien columns"
					: "Select types of new columns"}
			</h6>

			<section
				className="grid max-w-full grid-cols-1 overflow-hidden"
				aria-label="CSV table"
			>
				<div
					className="relative overflow-auto h-[45vh] simple-scrollbar" // should be a fixed height
					ref={parentRef}
				>
					<table
						/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */
						className="table-fixed"
						cellPadding="0"
						cellSpacing="0"
					>
						<thead className="grid sticky top-0 z-10">
							{table.getHeaderGroups().map(mapHeaderGroupToRows)}
						</thead>

						<tbody // tells scrollbar how big the table is:
							style={{ height: rowVirtualizer.getTotalSize() }}
							className="grid relative"
							ref={bodyRef}
						>
							{rows.length > 0 ? (
								rowVirtualizer.getVirtualItems().map(mapRows)
							) : (
								<tr>
									<td
										className="h-10 text-center flex items-center justify-center font-bold"
										colSpan={table.getAllColumns().length}
									>
										No rows
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			<Footer />
		</>
	);
}

const Footer: React.FC = memo(function Footer() {
	const resetAll = useFillSheetStore().use.resetAll();
	const uploadCsvToSapien = useUploadCsvToSapien();
	const step = useFillSheetStore().use.step();
	const fillSheetStore = useFillSheetStore();

	const handleContinue = async () => {
		const fillSheetState = fillSheetStore.getState();

		if (fillSheetState.step === Step.MapColumns) {
			fillSheetStore.setState((prev) => {
				const { batchTableColumns, columns, columnTypeSuggestions } = prev;

				const nextColumns = { ...columns };

				// Update the column types:
				if (columnTypeSuggestions) {
					for (const suggestion of Object.values(columnTypeSuggestions)) {
						const prevColumn = prev.columns[suggestion.column_index];

						if (prevColumn) {
							const mappedToColumnId = prevColumn.mapped_batch_column_id;
							const isMapped = mappedToColumnId !== null;

							nextColumns[suggestion.column_index] = {
								...prevColumn,
								column_type: isMapped
									? (batchTableColumns.find(({ id }) => id === mappedToColumnId)
											?.column_type ?? suggestion.column_type)
									: suggestion.column_type,
							};
						}
					}
				}

				return { step: Step.SelectColumnTypes, columns: nextColumns };
			});
		} else {
			if (uploadCsvToSapien.isPending) return;

			const { columns, file } = fillSheetState;

			/** Send the information to the backend:
			 - column mapping data
			 - selected column types
			 - the csv itself
			 */
			try {
				if (!file) {
					throw new Error("No file selected");
				}

				if (!columns) {
					throw new Error("No columns");
				}

				await uploadCsvToSapien.mutateAsync({
					columns: Object.values(columns),
					file,
				});

				fillSheetStore.getState().setIsAddDataDialogOpen(false);
			} catch (error) {
				const msg = "Failed to upload CSV file and columns to Sapien!";

				console.error(msg, error);

				toast({
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
					title: msg,
				});
			}
		}
	};

	function handleGoBack() {
		fillSheetStore.setState({ step: Step.MapColumns });
	}

	return (
		<footer className="flex w-full items-center gap-2 flex-row-reverse mb-6">
			<Button
				isLoading={uploadCsvToSapien.isPending}
				onClick={handleContinue}
				variant="success"
				size="sm"
			>
				<span>
					{step === Step.MapColumns ? "Select types of new columns" : "Finish"}
				</span>

				<ArrowRight className="size-4 text-white" />
			</Button>

			<Button
				disabled={uploadCsvToSapien.isPending}
				onClick={resetAll}
				variant="purple"
				size="sm"
			>
				Reset
			</Button>

			{step === Step.SelectColumnTypes ? (
				<Button
					disabled={uploadCsvToSapien.isPending}
					onClick={handleGoBack}
					variant="ghost"
					size="sm"
				>
					Back
				</Button>
			) : null}
		</footer>
	);
});

export function MapColumns() {
	return (
		<DefaultSuspenseAndErrorBoundary
			fallbackFor="map-columns-wrapper"
			failedText="Failed to parse CSV!"
		>
			<MapColumnsRoot />
		</DefaultSuspenseAndErrorBoundary>
	);
}
