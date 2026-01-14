/* eslint-disable @typescript-eslint/no-explicit-any */
import { createColumnHelper } from "@tanstack/react-table";
import { parse, type Options } from "csv-parse/sync";
import { PlusIcon } from "lucide-react";
import { useRef } from "react";

import {
	Step,
	useFillSheetStore,
	type FillSheetStore,
} from "./fillSheetContext";
import { TableHeader, type HeaderMetaProps } from "./TableHeader";
import { GenericCell } from "./GenericCell";
import {
	BatchTableMetadataColumnType,
	type BatchTableColumnIndex,
} from "#/types/batch-table";
import type { ParsedCsv } from "#/components/csv-to-html-table";
import type { AnyColumnDef } from "#/features/sapien/lib/table-utils";
import { createUUID } from "#/helpers/utils";
import { Button } from "#/components/Button";
import { useIntelligentColumnTypeDetection } from "#/features/sapien/hooks/post/use-intelligent-column-type-detection";

const PARSE_CSV_OPTIONS: Options = {
	/** This function is needed to avoid failing to parse when encountering
	 * the value `"NaN"` (a NaN stringified).
	 */
	cast: (
		value: "true" | "false" | "NaN" | "" | ({} & string) | null | undefined,
	) => {
		if (value === "false") return false;
		if (value === "true") return true;

		if (!value) return "";

		const tryAsNumber = Number(value);

		if (!Number.isNaN(tryAsNumber)) return tryAsNumber;

		return value;
	},
	skipRecordsWithError: false,
	relaxColumnCount: true,
	skipEmptyLines: true,
	relaxQuotes: true,
	columns: true,
} as const;

export function SelectFile() {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const intelligentColumnTypeDetection = useIntelligentColumnTypeDetection();
	const isParsingCsv = useFillSheetStore().use.isParsingCsv();
	const resetAll = useFillSheetStore().use.resetAll();
	const error = useFillSheetStore().use.error();
	const fillSheetStore = useFillSheetStore();

	function handleOpenFileChooser() {
		fileInputRef.current?.click();
	}

	async function parseCsv(file: File) {
		const start = performance.now();

		try {
			fillSheetStore.setState({ isParsingCsv: true });

			const csv = await file.text();
			const parsedCSVAsColumns = await new Promise<ParsedCsv>((resolve) => {
				// @ts-expect-error => ignore
				resolve(parse(csv, PARSE_CSV_OPTIONS));
			});

			const csvColumns: FillSheetStore["columns"] = {};
			const columnHelper = createColumnHelper<any>();
			const columnDefs: Array<AnyColumnDef> = [];

			let column_index = 0 as BatchTableColumnIndex;
			for (const header in parsedCSVAsColumns[0] || {}) {
				if (!header) continue;

				const columnDef = columnHelper.accessor(header, {
					enableColumnFilter: false,
					enableGlobalFilter: false,
					header: TableHeader,
					cell: GenericCell,
					minSize: 200,
					id: header,
					meta: {
						headerName: header,
					} satisfies HeaderMetaProps,
				});

				columnDefs.push(columnDef);

				csvColumns[column_index] = {
					column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
					mapped_batch_column_id: null,
					column_name: header,
					column_index,
				};

				++column_index;
			}

			fillSheetStore.setState({
				parsedCsv: { parsedCSVAsColumns, columnDefs },
				step: Step.MapColumns,
				columns: csvColumns,
			});
		} catch (error) {
			console.error("Error parsing CSV:", error);

			fillSheetStore.setState({ parsedCsv: null, error: error as Error });
		} finally {
			console.log("Parsed CSV in", performance.now() - start, "ms");

			fillSheetStore.setState({ isParsingCsv: false });
		}
	}

	async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
		fillSheetStore
			.getState()
			.intelligentColumnTypeDetectionAbortController?.abort();

		const file = event.target.files?.[0] ?? null;

		fillSheetStore.setState({ file });

		if (!file) return;

		Reflect.set(file, "uuid", createUUID());

		intelligentColumnTypeDetection.mutate({ file });

		await parseCsv(file);
	}

	function handleIgnoreError() {
		fillSheetStore.setState({ error: null });
	}

	return (
		<div className="flex flex-col h-full w-full gap-8 justify-between relative">
			{error ? (
				<section
					className="flex items-center justify-center gap-8 rounded-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive p-4 text-primary text-base"
					aria-label="Error"
				>
					<p>{error.message}</p>

					<div className="flex gap-2">
						<Button size="sm" variant="ghost" onClick={handleIgnoreError}>
							Ignore
						</Button>

						<Button size="sm" variant="purple" onClick={resetAll}>
							Reset
						</Button>
					</div>
				</section>
			) : null}

			<input
				onChange={handleFileChosen}
				ref={fileInputRef}
				className="hidden"
				multiple={false}
				accept=".csv"
				type="file"
			/>

			<Button
				icon={<PlusIcon className="size-4" />}
				onClick={handleOpenFileChooser}
				className="mt-auto mb-6"
				isLoading={isParsingCsv}
				title="Add CSV file"
				variant="purple"
			>
				{isParsingCsv ? "Parsing CSV file..." : "Choose CSV file"}
			</Button>
		</div>
	);
}
