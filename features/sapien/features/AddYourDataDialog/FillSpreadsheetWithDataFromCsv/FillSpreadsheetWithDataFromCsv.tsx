import { useLayoutEffect } from "react";

import { FillSheetProvider, useFillSheetStore } from "./fillSheetContext";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { useBatchTableColumnsArray } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";

type Props = {
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function FillSpreadsheetWithDataFromCsv({
	setIsAddDataDialogOpen,
}: Props) {
	return (
		<DefaultSuspenseAndErrorBoundary
			fallbackFor="fill-spreadsheet-with-data-from-csv"
			failedText="An error ocurred in this component!"
		>
			<FillSheetProvider>
				<FillSpreadsheetWithDataFromCsvContent
					setIsAddDataDialogOpen={setIsAddDataDialogOpen}
				/>
			</FillSheetProvider>
		</DefaultSuspenseAndErrorBoundary>
	);
}

function FillSpreadsheetWithDataFromCsvContent({
	setIsAddDataDialogOpen,
}: Props) {
	const batchTableColumns = useBatchTableColumnsArray();
	const steps = useFillSheetStore().use.steps();
	const step = useFillSheetStore().use.step();
	const fillSheetStore = useFillSheetStore();

	const CurrentStepReactNode = steps[step];

	useLayoutEffect(() => {
		fillSheetStore.setState({ setIsAddDataDialogOpen, batchTableColumns });

		// Derive alredyMappedColumns:
		fillSheetStore.subscribe(
			(state) => state.columns,
			(currentColumns) => {
				fillSheetStore.setState({
					alredyMappedColumns: Object.values(currentColumns)
						.filter((column) => column.mapped_batch_column_id !== null)
						.map((column) => column.mapped_batch_column_id!),
				});
			},
		);
	}, [fillSheetStore, setIsAddDataDialogOpen, batchTableColumns]);

	return <CurrentStepReactNode />;
}
