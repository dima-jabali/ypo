import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import {
	AVAILABLE_VALUE_OPERATORS_FOR_TYPES,
	type ChildFilter,
	ValueOperator,
} from "../filters/utilityTypes";
import { useSetValueOperator } from "./helperFilterHooks";
import { ChevronDownIcon } from "lucide-react";

type Props = {
	filter: ChildFilter;
};

export const PopoverToSelectValueOperator: React.FC<Props> = ({ filter }) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const setValueOperator = useSetValueOperator();

	const selectAndClose = (valueOperator: ValueOperator): void => {
		setValueOperator(filter, valueOperator);
		setIsPopoverOpen(false);
	};

	return (
		<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
			<PopoverTrigger
				className="inline-flex justify-between items-center min-h-[31px] w-full border border-border-smooth py-1 px-2 button-hover rounded text-sm"
				title="Choose an operator"
			>
				{filter.valueOperator}

				<ChevronDownIcon className="size-4 flex-none" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col gap-1 justify-start items-start min-w-min w-full max-h-[40vh]"
				side="bottom"
			>
				{AVAILABLE_VALUE_OPERATORS_FOR_TYPES[
					filter.column.type as keyof typeof AVAILABLE_VALUE_OPERATORS_FOR_TYPES
				]?.map((valueOperator) => (
					<button
						className="flex justify-start items-center w-full gap-2 rounded py-1 px-2 button-hover data-[default-checked=true]:bg-button-active text-sm"
						data-default-checked={valueOperator === filter.valueOperator}
						onPointerUp={() => selectAndClose(valueOperator)}
						data-value={valueOperator}
						key={valueOperator}
					>
						{valueOperator}
					</button>
				)) || <p className="p-2">Select a column first</p>}
			</PopoverContent>
		</Popover>
	);
};
