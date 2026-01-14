import type { ParsedCsv } from "#/components/csv-to-html-table";
import type {
	BatchTableColumn,
	BatchTableColumnId,
	BatchTableColumnIndex,
	BatchTableMetadataColumnType,
} from "#/types/batch-table";
import { MapColumns } from "./MapColumns";
import { SelectFile } from "./SelectFile";
import { createZustandProvider } from "#/contexts/create-zustand-provider";
import { noop } from "#/helpers/utils";
import type { AnyColumnDef } from "#/features/sapien/lib/table-utils";

export type ColumnTypeSuggestions = {
	[column_name: string]: {
		column_type: BatchTableMetadataColumnType;
		column_index: BatchTableColumnIndex;
		column_name: string;
	};
};

export type ColumnFromCsv = {
	mapped_batch_column_id: BatchTableColumnId | null;
	column_type: BatchTableMetadataColumnType;
	column_index: BatchTableColumnIndex;
	column_name: string;
};

export type FillSheetStore = {
	batchTableColumns: Array<BatchTableColumn>;
	steps: Record<Step, React.FC>;
	isParsingCsv: boolean;
	error: Error | null;
	file: File | null;
	step: Step;
	parsedCsv: {
		columnDefs: Array<AnyColumnDef>;
		parsedCSVAsColumns: ParsedCsv;
	} | null;

	intelligentColumnTypeDetectionAbortController: AbortController | null;
	columnTypeSuggestions: ColumnTypeSuggestions | null;
	alredyMappedColumns: Array<BatchTableColumnId>;

	columns: Record<BatchTableColumnIndex, ColumnFromCsv>;

	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	updateColumns: (newColumn: ColumnFromCsv) => void;
	resetAll: () => void;
};

export enum Step {
	SelectColumnTypes,
	SelectFile,
	MapColumns,
}

export const { Provider: FillSheetProvider, useStore: useFillSheetStore } =
	createZustandProvider<FillSheetStore>(
		(get, set) => ({
			steps: {
				[Step.SelectColumnTypes]: MapColumns,
				[Step.SelectFile]: SelectFile,
				[Step.MapColumns]: MapColumns,
			},
			batchTableColumns: [],
			step: Step.SelectFile,
			isParsingCsv: false,
			parsedCsv: null,
			error: null,
			file: null,

			intelligentColumnTypeDetectionAbortController: null,
			columnTypeSuggestions: null,
			alredyMappedColumns: [],

			columns: {},

			setIsAddDataDialogOpen: noop,

			updateColumns(newColumn) {
				set((prev) => ({
					columns: {
						...prev.columns,
						[newColumn.column_index]: newColumn,
					},
				}));
			},

			resetAll() {
				get().intelligentColumnTypeDetectionAbortController?.abort();

				set({
					intelligentColumnTypeDetectionAbortController: null,
					step: Step.SelectFile,
					isParsingCsv: false,
					parsedCsv: null,
					error: null,
					file: null,
				});
			},
		}),
		{ name: "FillSheetProvider" },
	);
