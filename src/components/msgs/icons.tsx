import {
  BrainCircuit,
  CheckCheck,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ScanSearch,
  Wrench,
  X,
} from "lucide-react";

export const ANIMATED_DOTS = (
  <span className="ml-0.5 min-w-fit" title="Loading...">
    <span className="dot-with-animation bg-muted-foreground" />
    <span className="dot-with-animation bg-muted-foreground" />
    <span className="dot-with-animation bg-muted-foreground" />
  </span>
);

export const DOUBLE_CHECK = (
  <CheckCheck className="my-auto ml-2 size-4 stroke-positive flex-none" aria-label="Done" />
);
export const CHECK_ICON = <CheckIcon className="size-4 stroke-positive" />;
export const CLIPBOARD_ICON = <ClipboardIcon className="size-4 stroke-2" />;
export const CHEVRON_RIGHT = <ChevronRightIcon className="size-3" />;
export const X_ICON = <X className="size-4 stroke-destructive" />;

export const THINKING_SPAN = (
  <span
    className="flex font-semibold z-10 items-center justify-start w-full text-xs"
    title="To show more, set 'Show intermediate messages' to true on settings"
  >
    <BrainCircuit className="stroke-muted-foreground size-3" />

    <span>&nbsp;Thinking</span>

    {ANIMATED_DOTS}
  </span>
);

export const SEARCHING_CTX = (
  <span
    className="flex font-semibold z-10 items-center justify-start w-full text-xs"
    title="To show more, set 'Show intermediate messages' to true"
  >
    <ScanSearch className="stroke-muted-foreground size-3" />

    <span>&nbsp;Searching in context</span>

    {ANIMATED_DOTS}
  </span>
);

export const SELECTING_TOOL = (
  <span
    className="flex font-semibold z-10 items-center justify-start w-full text-xs"
    title="To show more, set 'Show intermediate messages' to true"
  >
    <Wrench className="stroke-muted-foreground size-3" />

    <span>&nbsp;Selecting tool</span>

    {ANIMATED_DOTS}
  </span>
);
