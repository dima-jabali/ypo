import { titleCase } from "scule";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import {
	COLUMN_OPTIONS_VALUE_OPERATORS,
	type ChildFilter,
	type ColumnOptionsValueOperator,
} from "./generalFilterTypes";
import { useSetValueOperator } from "./hooks";
import { useFiltersStore } from "./FiltersContextProvider";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";

export type PopoverToSelectValueOperatorProps = {
	childFilter: ChildFilter;
};

export const PopoverToSelectValueOperator = ({
	childFilter,
}: PopoverToSelectValueOperatorProps) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const setValueOperator = useSetValueOperator();

	useFiltersStore().use.forceRefresh();

	const selectAndClose = (valueOperator: ColumnOptionsValueOperator): void => {
		setValueOperator(childFilter, valueOperator);

		setIsPopoverOpen(false);
	};

	return (
		<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
			<PopoverTrigger
				className="inline-flex justify-between items-center min-h-8 min-w-full border border-border-smooth rounded-sm py-1 px-2 gap-2 text-xs overflow-hidden button-hover"
				title="Choose an operator"
			>
				<span
					title={childFilter.value_operator}
					className="truncate capitalize"
				>
					{titleCase(childFilter.value_operator.toLowerCase())}
				</span>

				<ChevronDownIcon className="size-3 flex-none" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col justify-start items-start min-w-min w-full gap-1 p-1"
				side="bottom"
			>
				{COLUMN_OPTIONS_VALUE_OPERATORS.map((valueOperator) => (
					<button
						className="flex justify-start items-center w-full gap-2 rounded py-1 px-2 button-hover-accent text-xs simple-scrollbar data-[default-checked=true]:bg-accent data-[default-checked=true]:text-accent-foreground capitalize"
						data-default-checked={valueOperator === childFilter.value_operator}
						onClick={() => selectAndClose(valueOperator)}
						data-value={valueOperator}
						key={valueOperator}
					>
						{titleCase(valueOperator.toLowerCase())}
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
};
