import { Info } from "lucide-react";

import type { TableDataAsArray } from "#/components/Tables/TableMaker/useTableHelper";
import {
	KernelResultsTypes,
	type DataPreview,
	type KernelResult,
	type Variable,
} from "#/types/notebook";

type HandleDataPreviewProps = {
	dataPreview: DataPreview | { error: string } | undefined | null;
	putSavedDataInTheTable: (
		data: TableDataAsArray,
		num_rows: number | null,
		page: number,
	) => void;
	setKernelResults?: (kernelResults: Array<KernelResult>) => void;
};

export const handleDataPreview = ({
	dataPreview,
	putSavedDataInTheTable,
	setKernelResults,
}: HandleDataPreviewProps) => {
	if (!dataPreview) return;

	// Casting here because if it exists and is not an error (checked above),
	// then it is DataPreview:
	const { data, num_rows, limit, offset } = dataPreview as DataPreview;

	if (num_rows === 0 && setKernelResults) {
		setKernelResults(ZERO_RESULTS_KERNEL_RESULTS);

		return;
	}

	let index = offset;

	if (data && Array.isArray(data)) {
		const dataAsArrayFromMap = data.map((item) => [
			index++,
			item,
			// Casting here because the data received will have similar type:
		]) as TableDataAsArray;

		putSavedDataInTheTable(
			dataAsArrayFromMap,
			num_rows,
			Math.round(offset / limit + 1),
		);
	}
};

export function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
	e.stopPropagation();
	e.preventDefault();
}

export function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
	e.stopPropagation();
	e.preventDefault();
}

export function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
	e.stopPropagation();
}

export function getVariableName(
	jsonVariableName: string | undefined | Array<Partial<Variable>>,
): string {
	if (!jsonVariableName) return "";

	if (typeof jsonVariableName === "string") {
		let variable = "";

		try {
			variable = JSON.parse(jsonVariableName)[0]?.name || "";
		} catch {
			// do nothing
		}

		return variable;
	}

	return jsonVariableName[0]?.name || "";
}

export const FIXED_SQL_KERNEL_MSG: KernelResult = {
	type: KernelResultsTypes.FIXED_SQL,
	value: "",
};

export const ZERO_RESULTS_KERNEL_RESULTS: Array<KernelResult> = [
	{
		type: KernelResultsTypes.REACT_NODE,
		value: "",
		reactNode: (
			<article
				className="flex w-full gap-4 border border-blue-400 p-4"
				key="no-rows"
			>
				<Info className="size-6 stroke-blue-400" />

				<p className="text-sm font-bold tracking-wider">
					Your query returned a result with 0 rows.
				</p>
			</article>
		),
	},
];

export const PYTHON_DEFAULT_CODE = "start = 'here'";

export const FIXED_PYTHON_KERNEL_MSG: KernelResult = {
	type: KernelResultsTypes.FIXED_PYTHON,
	value: "",
};
