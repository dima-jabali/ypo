import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { ChildFilter } from "./generalFilterTypes";
import { useSetColumnId } from "./hooks";
import { useFiltersStore } from "./FiltersContextProvider";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import type { BatchTableColumnId } from "#/types/batch-table";
import { columnNameById } from "../../components/column-options-popover/utils";

export const PopoverToSelectColumnId: React.FC<{
	childFilter: ChildFilter;
}> = ({ childFilter }) => {
	const [isColumnPopoverOpen, setIsColumnPopoverOpen] = useState(false);

	const columns = useFiltersStore().use.columns();
	const setColumnId = useSetColumnId();

	const handleChangeColumn = (columnId: BatchTableColumnId): void => {
		setColumnId(childFilter, columnId);

		setIsColumnPopoverOpen(false);
	};

	return (
		<Popover onOpenChange={setIsColumnPopoverOpen} open={isColumnPopoverOpen}>
			<PopoverTrigger
				className="inline-flex justify-between items-center min-h-8 min-w-full border border-border-smooth rounded-sm py-1 px-2 gap-2 text-xs overflow-hidden button-hover"
				title="Choose an operator"
			>
				{columnNameById(columns, childFilter.column_id) ?? (
					<i className="text-muted">Select column</i>
				)}

				<ChevronDownIcon className="size-3 flex-none" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col justify-start items-start min-w-min w-full gap-1 p-1 max-h-[50vh] simple-scrollbar"
				side="bottom"
			>
				{columns.map((col) => (
					<button
						className="group w-full text-left rounded py-1 px-2 button-hover-accent text-xs data-[default-checked=true]:bg-accent first-letter:capitalize"
						data-default-checked={childFilter.column_id === col.id}
						onClick={() => handleChangeColumn(col.id)}
						key={col.id}
					>
						{columnNameById(columns, col.id)}
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
};
