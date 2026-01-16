import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export const SORT_ICONS = {
  desc: (
    <span className="flex h-7 flex-col items-center justify-center -space-y-[4px]">
      <ChevronUpIcon className="size-3 opacity-0" />

      <ChevronDownIcon className="size-3 stroke-yellow-600" />
    </span>
  ),
  asc: (
    <span className="flex h-7 flex-col items-center justify-center -space-y-[4px]">
      <ChevronUpIcon className="size-3 stroke-blue-300" />

      <ChevronDownIcon className="size-3 opacity-0" />
    </span>
  ),
  false: (
    <span className="flex h-7 flex-col items-center justify-center -space-y-[4px]">
      <ChevronUpIcon className="size-3 stroke-primary" />

      <ChevronDownIcon className="size-3 stroke-primary" />
    </span>
  ),
};
