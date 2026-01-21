"use client";

import { FileSearch } from "lucide-react";
import { memo, useEffect, useState, useTransition } from "react";

import { Loader } from "#/components/Loader";
import { FilterRegexProvider } from "#/contexts/filter-regex";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useAllChatSourcesMainValues } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { SourcesDrawer } from "./sources-for-user/sources-drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { CustomWindowEvents } from "#/contexts/window-events";

import "client-only";

export const AllSourcesInChatSidebar = memo(function AllSourcesInChatSidebar() {
  const shouldShowSidebar = generalContextStore.use.showSourcesSidebar();

  return !shouldShowSidebar ? null : <WhenNotStreaming />;
});

function WhenNotStreaming() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen_] = useState(false);

  const sourcesMainValues = useAllChatSourcesMainValues()!;

  function setIsOpenOrToggle(nextValue?: boolean | ((prev: boolean) => boolean)) {
    startTransition(() => setIsOpen_(nextValue ?? ((prev) => !prev)));
  }

  useEffect(() => {
    const abortController = new AbortController();
    const options = { signal: abortController.signal };

    function setIsOpenOrToggle(nextValue?: boolean | ((prev: boolean) => boolean)) {
      startTransition(() => setIsOpen_(nextValue ?? ((prev) => !prev)));
    }

    window.addEventListener(
      CustomWindowEvents.CloseSourcesDrawer,
      () => {
        setIsOpenOrToggle(false);
      },
      options,
    );

    window.addEventListener(
      CustomWindowEvents.OpenSourcesDrawer,
      () => {
        setIsOpenOrToggle(true);
      },
      options,
    );

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <FilterRegexProvider>
      <Tooltip>
        <TooltipTrigger
          className="absolute top-2 left-3 flex bg-notebook items-center justify-center rounded-full border border-border-smooth button-hover size-6 @3xl:size-7 z-50"
          title="All profiles referenced in this chat"
          onClick={() => setIsOpenOrToggle()}
        >
          {isPending ? (
            <Loader className="size-3 @3xl:size-3.5 border-t-muted-foreground" />
          ) : (
            <FileSearch className="size-3 @3xl:size-3.5 stroke-1 text-muted-foreground" />
          )}
        </TooltipTrigger>

        <TooltipContent
          className="w-fit max-h-28 simple-scrollbar text-primary text-xs"
          align="center"
        >
          All profiles referenced in this chat
        </TooltipContent>
      </Tooltip>

      <SourcesDrawer
        sourcesMainValues={sourcesMainValues}
        setIsOpen={setIsOpenOrToggle}
        isOpen={isOpen}
      />
    </FilterRegexProvider>
  );
}
