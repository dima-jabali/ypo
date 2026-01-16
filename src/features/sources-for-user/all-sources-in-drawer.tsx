import { ChevronLeftIcon } from "lucide-react";
import { memo, useState, useTransition } from "react";

import { Loader } from "#/components/Loader";
import { SourcesDrawer, type SourcesDrawerProps } from "./sources-drawer";

export const AllSourcesInDrawer = memo(function AllSourcesInDrawer(
  props: SourcesDrawerProps & { shouldShow: boolean },
) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen_] = useState(false);

  function setIsOpenOrToggle(nextValue?: boolean | ((prev: boolean) => boolean)) {
    startTransition(() => setIsOpen_(nextValue ?? ((prev) => !prev)));
  }

  return (
    <>
      {props.shouldShow ? (
        <button
          className="flex flex-[1_0_150px] max-w-full min-w-56 gap-2 items-center justify-start border border-border-smooth rounded-full px-2 py-1 bg-user-sources button-hover text-muted"
          onClick={() => setIsOpenOrToggle()}
        >
          {isPending ? (
            <Loader className="size-4 border-t-primary" />
          ) : (
            <ChevronLeftIcon className="size-4" />
          )}

          <p title="Open all sources drawer">All sources</p>
        </button>
      ) : null}

      <SourcesDrawer setIsOpen={setIsOpenOrToggle} isOpen={isOpen} {...props} />
    </>
  );
});
