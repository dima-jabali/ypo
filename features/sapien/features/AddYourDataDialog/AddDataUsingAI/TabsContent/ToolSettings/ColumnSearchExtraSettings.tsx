import { Checkbox } from "#/components/Checkbox";
import { useSortedBatchTableColumns } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";
import { useForceRender } from "#/hooks/use-force-render";
import {
	BatchTableToolSettingsInheritanceType,
	type BatchTableColumnId,
	type BatchTableToolSettings,
} from "#/types/batch-table";
import type { SelectedColumnToAdd } from "../../../common";
import { SelectMultipleColumnsDialog } from "../../../SelectMultipleColumnsDialog";

export const ColumnSearchExtraSettings: React.FC<{
	changeableToolSettings: BatchTableToolSettings;
}> = ({ changeableToolSettings }) => {
	const allColumns = useSortedBatchTableColumns();
	const forceRender = useForceRender();

	const [allSourceColumns, initialValueOfColumnsToSelect] = (() => {
		const allSourceColumns: Array<SelectedColumnToAdd> = allColumns.map(
			(c) => ({
				label: c.name ?? "",
				value: c.name ?? "",
				name: c.name ?? "",
				id: `${c.id}`,
			}),
		);

		const initialValueOfColumnsToSelect: Array<SelectedColumnToAdd> = [];

		changeableToolSettings?.source_columns?.forEach((colId) => {
			const col = allColumns.find((c) => c.id === colId);

			if (col) {
				initialValueOfColumnsToSelect.push({
					label: col.name ?? "",
					value: col.name ?? "",
					name: col.name ?? "",
					id: `${colId}`,
				});
			}
		});

		return [allSourceColumns, initialValueOfColumnsToSelect];
	})();

	const handleSelectSourceColumns = (columns: Array<SelectedColumnToAdd>) => {
		if (!changeableToolSettings) {
			console.log("No settings to change!", { changeableToolSettings });

			return;
		}

		changeableToolSettings.inheritance_type =
			BatchTableToolSettingsInheritanceType.CUSTOM;
		changeableToolSettings.source_columns = columns.map(
			(col) => Number(col.id) as BatchTableColumnId,
		);

		forceRender();
	};

	const handleToggleUseAllColumns = () => {
		if (!changeableToolSettings) {
			console.log("No settings to change!", { changeableToolSettings });

			return;
		}

		const newChecked = !isUseAllColumnsEnabled;

		changeableToolSettings.inheritance_type =
			BatchTableToolSettingsInheritanceType.CUSTOM;
		changeableToolSettings.use_all_columns = newChecked;

		forceRender();
	};

	const isUseAllColumnsEnabled =
		changeableToolSettings?.use_all_columns ?? false;

	return (
		<>
			<hr className="border-border-smooth  px-2" />

			<label
				className="flex items-center gap-4 button-hover rounded-md px-2 py-1 mx-2"
				htmlFor="use_all_columns"
			>
				<Checkbox
					onCheckedChange={handleToggleUseAllColumns}
					checked={isUseAllColumnsEnabled}
					className="size-4 flex-none"
					id="use_all_columns"
				/>

				<div className="flex flex-col justify-start">
					<span className="w-fit">Use all columns</span>

					<span className="text-xs text-primary">
						Extract data from all other columns
					</span>
				</div>
			</label>

			<hr className="border-border-smooth " />

			<fieldset className="flex items-center gap-2 mx-2 mb-2">
				<label className="font-semibold">Source columns</label>

				<SelectMultipleColumnsDialog
					description="Select the columns from your table that will be used as source."
					initialValue={initialValueOfColumnsToSelect}
					onSelect={handleSelectSourceColumns}
					allColumns={allSourceColumns}
				/>
			</fieldset>
		</>
	);
};
