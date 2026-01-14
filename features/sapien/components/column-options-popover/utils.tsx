import { titleCase } from "scule";

import type {
	BatchTableColumn,
	BatchTableColumnId,
	BatchTableMetadataColumnType,
} from "#/types/batch-table";
import { matchIcon } from "#/icons/match-icon";
import { isValidNumber } from "#/helpers/utils";

export function matchType(
	type: BatchTableMetadataColumnType | null | undefined,
) {
	return titleCase(type?.toLowerCase() ?? "");
}

export function matchBatchTableColumnTypeAndIcon(
	type: BatchTableMetadataColumnType | null,
	className?: string,
) {
	if (!type) return null;

	return (
		<div className="flex gap-3 items-center group">
			{matchIcon(type, className ?? "group-hover:stroke-accent-foreground")}

			<span>{matchType(type)}</span>
		</div>
	);
}

export function columnNameById(
	columns: Array<BatchTableColumn>,
	columnId: BatchTableColumnId | undefined | null,
) {
	if (!isValidNumber(columnId)) return undefined;

	const col = columns.find((column) => column.id === columnId);

	if (!col) return undefined;

	return (
		<p className="flex items-start justify-between gap-4">
			<span title="Column's name" className="truncate">
				{col.name}
			</span>

			<span
				className="text-xs text-muted-foreground group-hover:text-accent-foreground group-active:text-accent-foreground"
				title="Column's ID"
			>
				({columnId})
			</span>
		</p>
	);
}
