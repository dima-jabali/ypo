import { invariant } from "es-toolkit";
import { ArrowUpFromLine } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/dropdown-menu";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useMentionablesStore } from "#/features/sapien/contexts/mentionables/mentionables-context";
import { makeCellCoords } from "#/features/sapien/lib/utils";
import { stringifyCellValue } from "#/helpers/utils";
import { BatchTableMetadataColumnType } from "#/types/batch-table";

const LINE_BREAKS_REGEX = /\s+/gm;
const DOUBLE_QUOTES_REGEX = /"/g;

export function ExportAs() {
	const mentionablesStore = useMentionablesStore();

	function getBatchTableData() {
		const { getBatchTable, organizationId, batchTableId } =
			generalContextStore.getState();

		invariant(organizationId, "Expected a valid number for organizationId");
		invariant(batchTableId, "Expected a valid number for batchTableId");

		const batchTable = getBatchTable(organizationId, batchTableId);

		invariant(batchTable, "Expected a batch table to getCellContent");

		return batchTable;
	}

	function handleExportAsCsv() {
		const { mentionables } = mentionablesStore.getState();
		const batchTable = getBatchTableData();

		const csvArrayOfStrings: Array<string> = [];
		const header: Array<string> = [];
		const csvSeparator = ",";

		batchTable.columns.forEach((column) => {
			DOUBLE_QUOTES_REGEX.lastIndex = 0;
			LINE_BREAKS_REGEX.lastIndex = 0;
			const str = (column.name ?? "")
				.replaceAll(LINE_BREAKS_REGEX, " ")
				.trim()
				.replaceAll(DOUBLE_QUOTES_REGEX, '""');

			header.push(`"${str} (${column.column_index + 1})"`);
		});

		csvArrayOfStrings.push(header.join(csvSeparator));

		batchTable.rows.forEach((row) => {
			const rowData: Array<string> = [];

			batchTable.columns.forEach((column) => {
				const isFileColumn =
					column.column_type === BatchTableMetadataColumnType.FILE;

				const cell = batchTable.cells.get(
					makeCellCoords(row.row_index, column.column_index),
				);

				DOUBLE_QUOTES_REGEX.lastIndex = 0;
				LINE_BREAKS_REGEX.lastIndex = 0;
				const str = stringifyCellValue(cell?.value, isFileColumn, mentionables)
					.replaceAll(LINE_BREAKS_REGEX, " ")
					.trim()
					.replaceAll(DOUBLE_QUOTES_REGEX, '""');

				rowData.push(`"${str}"`);
			});

			csvArrayOfStrings.push(rowData.join(csvSeparator));
		});

		const csvString = csvArrayOfStrings.join("\n");

		// Trigger Download
		const link = document.createElement("a");
		link.style.display = "none";
		link.setAttribute("target", "_blank");

		// Create a Data URI for the CSV content
		const uri: string = `data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`;

		// Set attributes for download
		link.setAttribute("href", uri);
		link.setAttribute("download", `${batchTable.name}.csv`);

		// Append and click the link to trigger download, then remove it
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="w-fit bg-transparent items-center rounded-sm button-hover text-primary text-xs p-1 px-2 gap-1 h-fit flex data-[state=open]:bg-button-active">
				<ArrowUpFromLine className="size-3.5 stroke-1 flex-none stroke-primary" />

				<span>Export as</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">
				<DropdownMenuItem onClick={handleExportAsCsv}>CSV</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
