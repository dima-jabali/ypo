import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

export function TipsPopover() {
  return (
    <Popover>
      <PopoverTrigger
        className="flex size-5 items-center justify-center rounded-full aspect-square flex-none button-hover"
        title="Tips"
      >
        <Info className="size-5" />
      </PopoverTrigger>

      <PopoverContent
        className="z-50 flex max-h-[20vh] min-w-60 max-w-md flex-col gap-[1px]"
        align="end"
        side="top"
        slot="ul"
      >
        <li className="flex w-full items-center justify-start gap-2 border border-transparent rounded p-2 hover:bg-button-hover focus:border-link/50">
          <span className="grid h-5 place-items-center">
            <Info className="size-5 stroke-link" />
          </span>

          <p className="break-words text-sm leading-5 text-primary">
            Press <span className="font-bold tracking-wider">Ctrl+Space</span> to trigger auto
            suggest.
          </p>
        </li>

        <li className="flex w-full items-center justify-start gap-2 border border-transparent rounded p-2 hover:bg-button-hover focus:border-link/50">
          <span className="grid h-5 place-items-center">
            <Info className="size-5 stroke-link" />
          </span>

          <p className="break-words text-sm leading-5 text-primary">
            Press <span className="font-bold tracking-wider">Esc</span> to close the suggestions
            widget.
          </p>
        </li>

        <li className="flex w-full items-center justify-start gap-2 border border-transparent rounded p-2 hover:bg-button-hover focus:border-link/50">
          <span className="grid h-5 place-items-center">
            <Info className="size-5 stroke-link" />
          </span>

          <p className="break-words text-sm leading-5 text-primary">
            Press <span className="font-bold tracking-wider">Tab</span> to accept a suggestion.
          </p>
        </li>
      </PopoverContent>
    </Popover>
  );
}
