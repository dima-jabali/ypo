import { useEffect, useRef } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { makeDefaultGroupOfFilters } from "../filters/filters";
import { serializeFiltersToJson } from "../filters/serialize";
import { AddFilterButtons } from "./AddFilterPopover";
import { FiltersToBeApplied } from "./FiltersToBeApplied";
import { useSetTableData, useTableData } from "../tableDataContextUtils";
import { CheckIcon, FunnelIcon, MinusIcon } from "lucide-react";

export const FiltersButtonForPopover: React.FC = () => {
  const { groupOfFilters, isFiltersPopoverOpen } = useTableData((store) => ({
    isFiltersPopoverOpen: store.isFiltersPopoverOpen,
    groupOfFilters: store.groupOfFilters,
  }));
  const setTableData = useSetTableData();

  const hasOpenedRef = useRef(false);

  function handleDeleteAllFilters() {
    setTableData((prev) => ({
      ...prev,
      groupOfFilters: makeDefaultGroupOfFilters(),
    }));
  }

  function handleApplyFilters() {
    setTableData((prev) => ({
      ...prev,
      isFiltersPopoverOpen: false,
    }));
  }

  useEffect(() => {
    // Prevent re-rendering when popover is open:
    if (isFiltersPopoverOpen) {
      hasOpenedRef.current = true;

      return;
    }

    if (!hasOpenedRef.current) return;

    let serializedFiltersOrUndefined = serializeFiltersToJson(groupOfFilters);
    let shouldChangeToFirstPage = true;

    if (Object.keys(serializedFiltersOrUndefined || {}).length === 0) {
      serializedFiltersOrUndefined = undefined;
      shouldChangeToFirstPage = false;
    }

    setTableData((prev) => ({
      ...prev,
      currPage: shouldChangeToFirstPage ? 1 : prev.currPage,
      blockFilterAndSort: {
        sort_by: prev.blockFilterAndSort?.sort_by,
        filters: serializedFiltersOrUndefined,
      },
    }));
  }, [isFiltersPopoverOpen, groupOfFilters, setTableData]);

  return (
    <Popover
      onOpenChange={(newValue) =>
        setTableData((prev) => ({ ...prev, isFiltersPopoverOpen: newValue }))
      }
      open={isFiltersPopoverOpen}
    >
      <PopoverTrigger className="flex justify-center items-center h-[21px] rounded-sm py-0 px-2 text-xs button-hover text-muted-foreground gap-2">
        <FunnelIcon className="size-4 stroke-muted-foreground stroke-1" />
        Filters
      </PopoverTrigger>

      <PopoverContent
        className="flex flex-col items-start p-0 justify-start max-h-[80vh] min-w-sm max-w-[80vw] text-sm w-[unset]"
        sideOffset={5}
        side="right"
      >
        {isFiltersPopoverOpen ? (
          <>
            <FiltersToBeApplied />

            <div className="flex justify-start items-center w-full gap-1 pb-1 px-1">
              <AddFilterButtons />
            </div>

            <div className="flex justify-start items-center w-full gap-1 pb-1 px-1">
              <button
                className="flex justify-center items-center gap-2 w-full border border-border-smooth rounded py-1 px-2 button-hover disabled:opacity-50"
                onClick={handleDeleteAllFilters}
              >
                <MinusIcon className="size-4 text-primary" />
                Delete all filters
              </button>

              <button
                className="flex justify-center items-center gap-2 w-full border border-border-smooth rounded py-1 px-2 button-hover disabled:opacity-50"
                onClick={handleApplyFilters}
              >
                <CheckIcon className="size-4 text-primary" />
                Apply
              </button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
