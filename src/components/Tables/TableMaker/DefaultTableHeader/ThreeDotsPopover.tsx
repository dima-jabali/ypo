import { Ellipsis, MinusIcon } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import type { Filter } from "../filters/utilityTypes";
import { AddFilterButtons } from "./AddFilterPopover";
import { useDeleteFilter } from "./helperFilterHooks";

type Props = {
  filter: Filter;
};

export const ThreeDotsPopover: React.FC<Props> = ({ filter }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const deleteFilter = useDeleteFilter();

  const handleDeleteFilter = (): void => {
    deleteFilter(filter);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger className="inline-flex justify-center items-center size-[31px] aspect-square py-1 px-2 button-hover rounded text-sm">
        <Ellipsis className="size-5 text-primary" />
      </PopoverTrigger>

      <PopoverContent
        className="flex flex-col justify-start items-start min-w-min gap-1"
        side="bottom"
      >
        <button
          className="flex justify-start items-center w-full gap-2 rounded border border-border-smooth py-1 px-2 button-hover text-sm disabled:opacity-50"
          onClick={handleDeleteFilter}
        >
          <MinusIcon className="size-4 text-primary" />
          Delete filter
        </button>

        <AddFilterButtons parentFilter={filter.parent} filterAbove={filter} flexStart />
      </PopoverContent>
    </Popover>
  );
};
