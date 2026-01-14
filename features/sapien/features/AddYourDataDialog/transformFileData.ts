import { type Options as ParseCSVOptions, parse } from "csv-parse/sync";

import {
	DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
	type ExistingColumn,
	type Options,
	type SelectedColumnToAdd,
} from "./common";

const PARSE_CSV_OPTIONS: ParseCSVOptions = {
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

export function parseCSVAsRows(text: string) {
	const parsedCSVAsColumns = parse(text, PARSE_CSV_OPTIONS);

	return parsedCSVAsColumns as unknown as Array<
		Record<string, string | number>
	>;
}

export function matchColumnNames(
	existingColumns: Array<ExistingColumn>,
	newColumns: Array<SelectedColumnToAdd>,
	caseSensitive: boolean,
): Options["columnsToJoin"] {
	const columnsToJoin: Options["columnsToJoin"] = [
		...DEFAULT_COLUMNS_TO_JOIN_OR_MAP,
	];

	for (const newColumn of newColumns) {
		const newColumnName = caseSensitive
			? newColumn.name
			: newColumn.name.toLowerCase();

		for (const existingColumn of existingColumns) {
			const existingColumnName = caseSensitive
				? existingColumn.name
				: existingColumn.name.toLowerCase();

			if (existingColumnName === newColumnName) {
				columnsToJoin.push([existingColumn, newColumnName]);
			}
		}
	}

	console.log({
		existingColumns,
		caseSensitive,
		columnsToJoin,
		newColumns,
	});

	return columnsToJoin;
}
