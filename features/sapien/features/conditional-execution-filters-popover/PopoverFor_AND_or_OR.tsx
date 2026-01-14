import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { Filter } from "./generalFilterTypes";
import { useSetAnd_or_Or } from "./hooks";
import { isAParent } from "./helpers";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { FilterOperator } from "#/components/Tables/TableMaker/filters/utilityTypes";

type Props = {
	isSecondInARow?: boolean;
	filter: Filter;
};

export const PopoverFor_AND_or_OR = ({ isSecondInARow, filter }: Props) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const setAnd_or_Or = useSetAnd_or_Or();

	const selectAndClose = (newValue: FilterOperator): void => {
		setAnd_or_Or(filter, newValue);

		setIsPopoverOpen(false);
	};

	const filterOperator =
		isAParent(filter) && !isSecondInARow
			? filter.filter_operator
			: filter.parent?.filter_operator || FilterOperator.AND;

	return (
		<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
			<PopoverTrigger className="inline-flex justify-between items-center h-8 w-16 gap-2 border border-border-smooth rounded-sm px-2 button-hover text-xs capitalize">
				{filterOperator.toLowerCase()}

				<ChevronDownIcon className="size-3 flex-none" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col gap-1 justify-start items-start min-w-min w-full p-1"
				side="bottom"
			>
				<button
					className="flex justify-start items-center text-sm w-full gap-2 rounded-md py-1 px-2 button-hover data-[default-checked=true]:bg-button-hover"
					data-default-checked={filterOperator === FilterOperator.AND}
					onPointerDown={() => selectAndClose(FilterOperator.AND)}
				>
					<span>And</span>

					<span className="text-muted-foreground text-xs">
						All filters must match
					</span>
				</button>

				<button
					className="flex justify-start items-center text-sm w-full gap-2 rounded-md py-1 px-2 button-hover data-[default-checked=true]:bg-button-hover"
					data-default-checked={filterOperator === FilterOperator.OR}
					onPointerDown={() => selectAndClose(FilterOperator.OR)}
				>
					<span>Or</span>

					<span className="text-muted-foreground text-xs">
						At least one filter must match
					</span>
				</button>
			</PopoverContent>
		</Popover>
	);
};
