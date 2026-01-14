import { Ellipsis, MinusIcon } from "lucide-react";
import { useState } from "react";

import type { Filter } from "./generalFilterTypes";
import { useDeleteFilter } from "./hooks";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { AddFilterButtons } from "./conditional-execution-filter-popover";

type Props = {
	filter: Filter;
};

export const ThreeDotsPopover = ({ filter }: Props) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const deleteFilter = useDeleteFilter();

	const handleDeleteFilter = (): void => {
		deleteFilter(filter);
	};

	return (
		<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
			<PopoverTrigger className="inline-flex items-center justify-center size-8 aspect-square gap-0.5 rounded-sm button-hover">
				<Ellipsis className="size-4 flex-none text-primary" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col gap-1 justify-start items-start min-w-min p-1"
				side="bottom"
			>
				<button
					className="flex justify-start items-center w-full gap-2 border border-border-smooth py-1 px-2 button-hover text-sm rounded"
					onClick={handleDeleteFilter}
				>
					<MinusIcon className="size-4 flex-none text-primary" />

					<span>Delete filter</span>
				</button>

				<AddFilterButtons
					parentFilter={filter.parent}
					filterAbove={filter}
					flexStart
				/>
			</PopoverContent>
		</Popover>
	);
};
