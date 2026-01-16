import { useReducer, useState } from "react";

import { FilterType } from "../filters/utilityTypes";
import { useColumnFilter } from "./utils";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";

export type Col = {
  visibleIndex: number;
  dataField: string;
  type?: FilterType;
  visible: boolean;
  dataType: string;
  name: string;
};

function Content() {
  const [, forceRender] = useReducer((prev) => !prev, true);

  const { searchResults, searchString, setSearchString } = useColumnFilter();

  return (
    <>
      <input
        className="flex justify-start items-center h-7 w-full border border-border-smooth rounded px-1 outline-hidden"
        onChange={(e) => setSearchString(e.target.value)}
        placeholder="Search for a column..."
        value={searchString}
        type="search"
      />

      {searchResults.map((column, index) => {
        const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          column.getToggleVisibilityHandler()(e);

          requestAnimationFrame(forceRender);
        };

        return (
          <label
            className="flex w-full cursor-pointer gap-3 rounded-sm p-2 hover:bg-button-hover focus:bg-button-hover active:bg-button-active"
            key={index}
          >
            <input
              checked={column.getIsVisible()}
              onChange={handleOnChange}
              type="checkbox"
              id={column.id}
            />

            {column.id}
          </label>
        );
      })}
    </>
  );
}

export function PopoverForColumnChooser() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="text-xs border border-transparent button-hover px-2 py-0.5 rounded-sm text-muted-foreground"
        title="Choose colums to display"
      >
        Display
      </PopoverTrigger>

      <PopoverContent
        className="max-h-48 max-w-xs relative flex flex-col justify-start z-50 simple-scrollbar rounded-sm border min-w-min w-full gap-1 *:tracking-wide text-sm [&_svg]:size-[14px] text-primary"
        align="center"
        side="bottom"
      >
        {isOpen ? <Content /> : null}
      </PopoverContent>
    </Popover>
  );
}
