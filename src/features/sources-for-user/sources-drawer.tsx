import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { X } from "lucide-react";
import { Portal } from "radix-ui";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "#/components/Button";
import { URL_TEXT_SEARCH, WEBSITE_PREFIX } from "#/components/Markdown/pre-processors";
import { StringFilterCombobox } from "#/components/string-filter-combobox";
import { useFilterRegexStore } from "#/contexts/filter-regex";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { type SourceID, useSourceCitationContextStore } from "#/contexts/source-citation-context";
import { createUUID } from "#/helpers/utils";
import { usePreviousPersistent } from "#/hooks/use-previous-persistent";
import { matchIcon } from "#/icons/match-icon";
import { SourceForUserType } from "#/types/chat";
import { SourcesForUserCtxProvider, useSourcesForUserCtx } from "./ctx";
import { getExtraInfo } from "./get-extra-info";
import { type SourceMainValues } from "./get-source-main-values";
import type { NormalizedSource } from "./get-top-n-sources";
import { searchNestedObject } from "./search-nested-object";
import { DocumentSource } from "#/types/notebook";

export type SourcesDrawerProps = {
  sourcesMainValues: Array<SourceMainValues<SourceForUserType, NormalizedSource["values_type"]>>;
};

const TYPES_TO_FILTER = Object.values(SourceForUserType);
const ESCAPE_REGEX = /[-[\]{}()*+?.,\\^$|]/g;
const TIME_TO_SEARCH = 500; // ms

export function SourcesDrawer({
  sourcesMainValues,
  setIsOpen,
  isOpen,
}: SourcesDrawerProps & {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
}) {
  const [isClearingFilters, startTransitionToClearFilters] = useTransition();

  const [selectedTypesToFilter, setSelectedTypesToFilter] = useState<Array<string>>([]);
  const [matchedSource, setMatchedSource] = useState<SourceMainValues<
    SourceForUserType,
    NormalizedSource["values_type"]
  > | null>(null);
  const [virtualListKey, setVirtualListKey] = useState(createUUID());
  const [handler, setHandler] = useState<HTMLElement | null>(null);
  const [rawFilterString, setRawFilterString] = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);

  const numberOfAvailableItemsForEachValue = useMemo(() => {
    const numberOfAvailableItemsForEachValue = new Map<string, number>();

    TYPES_TO_FILTER.forEach((sourceType) => {
      numberOfAvailableItemsForEachValue.set(sourceType, 0);
    });

    sourcesMainValues.forEach((source) => {
      const sourceType = source.normalizedSource.source_type;
      const prevNumber = numberOfAvailableItemsForEachValue.get(sourceType) as number;

      numberOfAvailableItemsForEachValue.set(sourceType, prevNumber + 1);
    });

    return numberOfAvailableItemsForEachValue;
  }, [sourcesMainValues]);

  const timerToFilter = useRef<NodeJS.Timeout>(undefined);

  const sourceCitationsStore = useSourceCitationContextStore();
  const currentSourceId = sourceCitationsStore.use.currentSourceId();
  const prevSourceCited = usePreviousPersistent(currentSourceId);
  const filterRegexStore = useFilterRegexStore();
  const filterRegex = filterRegexStore.use.filterRegex();

  const isFiltered = selectedTypesToFilter.length > 0 || !!filterRegex;

  function handleClose() {
    setMatchedSource(null);
    setIsOpen(false);
  }

  function handleClearFilter() {
    startTransitionToClearFilters(() => {
      filterRegexStore.setState({ filterRegex: undefined });
      setSelectedTypesToFilter([]);
      setRawFilterString("");
    });
  }

  function handleFilterBySearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timerToFilter.current);

    setRawFilterString(() => {
      clearTimeout(timerToFilter.current);

      const next = e.target.value;

      timerToFilter.current = setTimeout(() => {
        ESCAPE_REGEX.lastIndex = 0;

        const trimmedAndEscapedFilterString = next.trim().replaceAll(ESCAPE_REGEX, "\\$&");

        if (trimmedAndEscapedFilterString) {
          // We must first set it to undefined, otherwise, it will look like there was no change:

          filterRegexStore.setState({
            filterRegex: new RegExp(trimmedAndEscapedFilterString, "gi"),
          });
        } else {
          filterRegexStore.setState({ filterRegex: undefined });
        }
      }, TIME_TO_SEARCH);

      return next;
    });
  }

  useQuery({
    queryKey: ["sources-drawer-filtering", currentSourceId, prevSourceCited],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const currentSourceId = sourceCitationsStore.getState().currentSourceId;

      if (!currentSourceId) return null;

      const currentSourceId_ = currentSourceId.replace(WEBSITE_PREFIX, "");

      if (currentSourceId_ && prevSourceCited !== currentSourceId_) {
        // Open modal and show cited source if it is here.
        // Also, perform a check to see if any source does not exist
        // in the page.

        let matchedSource: SourceMainValues<
          SourceForUserType,
          NormalizedSource["values_type"]
        > | null = null;

        for (const sourceMainValues of sourcesMainValues) {
          if (sourceMainValues.id === currentSourceId_) {
            matchedSource = sourceMainValues;

            break;
          } else if (sourceMainValues.id.replace(URL_TEXT_SEARCH, "") === currentSourceId_) {
            console.log("Partial match found", {
              sourceMainValues,
              currentSourceId_,
            });

            matchedSource = sourceMainValues;

            break;
          }
        }

        if (matchedSource) {
          sourceCitationsStore.setState({ currentSourceId: "" as SourceID });
          setMatchedSource(matchedSource);
          setIsOpen(true);
        } else {
          setMatchedSource(null);
          setIsOpen(false);
        }
      }

      return null;
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!handler) {
      console.log("handlerRef not found");

      return;
    }

    const drawer = drawerRef.current;

    if (!drawer) {
      console.log("drawerRef not found");

      return;
    }

    let animationFrame: number | null = null;
    let drawerStartWidth = NaN;
    let startPositionX = NaN;
    let minX = NaN;
    let maxX = NaN;

    const changeXPosition = (e: PointerEvent) => {
      e.stopPropagation();

      const newHandlerX = e.clientX;

      const canChangeWidth = newHandlerX > minX && newHandlerX < maxX;

      if (canChangeWidth) {
        const delta = newHandlerX - startPositionX;

        const newWidthOfDrawer = drawerStartWidth - delta;

        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }

        animationFrame = requestAnimationFrame(() => {
          drawer.style.width = `${newWidthOfDrawer}px`;
        });
      }
    };

    const stopChangeXPosition = () => {
      window.removeEventListener("pointermove", changeXPosition, true);

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const prepareForResize = (e: PointerEvent) => {
      drawerStartWidth = drawer.getBoundingClientRect().width;
      startPositionX = e.pageX;

      const _100vw = document.body.clientWidth;
      // These are kinda inverted cause the width grows from left to right:
      minX = Math.min(400, _100vw); // px
      maxX = _100vw - 400; // px

      handler.setPointerCapture(e.pointerId);

      window.addEventListener("pointermove", changeXPosition, {
        passive: false,
        capture: true,
      });
      window.addEventListener("pointerup", stopChangeXPosition, {
        once: true,
      });
    };

    function handleCloseDrawerOnEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMatchedSource(null);
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleCloseDrawerOnEscape);
    handler.addEventListener("pointerdown", prepareForResize);

    return () => {
      document.removeEventListener("keydown", handleCloseDrawerOnEscape);
      handler.removeEventListener("pointerdown", prepareForResize);
    };
  }, [isOpen, setIsOpen, handler]);

  const filteredSources = useMemo(() => {
    // eslint-disable-next-line react-hooks/set-state-in-render
    setVirtualListKey(createUUID());

    if (isFiltered) {
      const hasBothFilters = selectedTypesToFilter.length > 0 && filterRegex;
      const sources: typeof sourcesMainValues = [];

      if (hasBothFilters) {
        for (const source of sourcesMainValues) {
          if (
            selectedTypesToFilter.includes(source.normalizedSource.source_type) &&
            searchNestedObject(source.normalizedSource.values, filterRegex)
          ) {
            sources.push(source);
          }
        }
      } else if (filterRegex) {
        for (const source of sourcesMainValues) {
          if (searchNestedObject(source.normalizedSource.values, filterRegex)) {
            sources.push(source);
          }
        }
      } else {
        for (const source of sourcesMainValues) {
          if (selectedTypesToFilter.includes(source.normalizedSource.source_type)) {
            sources.push(source);
          }
        }
      }

      return sources;
    } else {
      return sourcesMainValues;
    }
  }, [isFiltered, selectedTypesToFilter, filterRegex, sourcesMainValues]);

  return isOpen ? (
    <Portal.Root>
      <section
        className="fixed right-0 top-0 bottom-0 outline-none flex bg-popover border-l z-500 border-border-smooth shadow-lg shadow-black/40 p-0 overflow-hidden w-[min(60vw,500px)] group/drawer"
        ref={drawerRef}
        data-is-drawer
      >
        <div className="relative flex flex-col w-full max-w-full max-h-full">
          <div
            className="absolute left-0 top-0 bottom-0 button-hover w-1 h-full flex-none cursor-ew-resize z-50"
            title="Drag to resize drawer"
            ref={setHandler}
          ></div>

          <button
            className="absolute left-2 top-4 p-1 button-hover rounded-lg"
            onClick={handleClose}
            title="Close drawer"
          >
            <X className="size-5" />
          </button>

          <header className="flex flex-col gap-6 flex-none items-center justify-center bg-popover min-h-16 py-2">
            <h1 className="text-xl pt-2 whitespace-nowrap text-center">All sources</h1>

            <search className="flex flex-wrap gap-2 w-full items-center px-3">
              <input
                className="focus:outline-offset-2 border border-border-smooth onfocus:border-white/40 rounded-md px-1.5 py-1"
                onChange={handleFilterBySearchChange}
                placeholder="Filter all sources..."
                title="Filter all sources"
                value={rawFilterString}
                type="search"
              />

              <StringFilterCombobox
                numberOfAvailableItemsForEachValue={numberOfAvailableItemsForEachValue}
                setSelectedValuesToFilter={setSelectedTypesToFilter}
                selectedValuesToFilter={selectedTypesToFilter}
                allValuesToFilter={TYPES_TO_FILTER}
                inputPlaceholder="Filter types..."
                filterTitle="Type"
              />

              {isFiltered && (
                <Button
                  loaderClassNames="border-t-primary"
                  isLoading={isClearingFilters}
                  className="h-8 px-2 lg:px-3"
                  onClick={handleClearFilter}
                  title="Clear filters"
                  variant="ghost"
                >
                  <span>Reset</span>

                  <X className="ml-2 size-4" />
                </Button>
              )}
            </search>
          </header>

          <SourcesForUserCtxProvider key={virtualListKey}>
            <List sourcesMainValues={filteredSources} matchedSource={matchedSource} />
          </SourcesForUserCtxProvider>
        </div>
      </section>
    </Portal.Root>
  ) : null;
}

function List({
  sourcesMainValues,
  matchedSource,
}: {
  sourcesMainValues: Array<SourceMainValues<SourceForUserType, NormalizedSource["values_type"]>>;
  matchedSource: SourceMainValues<SourceForUserType, NormalizedSource["values_type"]> | null;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  const showReferenceMetadata = generalContextStore.use.showReferenceMetadata();
  const clickupSourceIconUrl = generalContextStore.use.clickupSourceIconUrl();
  const sourcesForUserCtx = useSourcesForUserCtx();

  const parentRef = useRef<HTMLDivElement | null>(null);

  const [{ getItemKey, getScrollElement, measureElement }] = useState({
    measureElement: (element: HTMLElement) => element.getBoundingClientRect().height,
    getItemKey: (index: number) => sourcesMainValues[index]?.id ?? index,
    getScrollElement: () => parentRef.current,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer<HTMLElement, HTMLElement>({
    estimateSize: () => (showReferenceMetadata ? 100 : 60),
    count: sourcesMainValues.length,
    overscan: 5,
    getScrollElement,
    measureElement,
    getItemKey,
  });

  sourcesForUserCtx.setState({
    measure: () => {
      rowVirtualizer.measureElement(null);
      rowVirtualizer.measure();
    },
    rowVirtualizer,
  });

  useQuery({
    queryKey: ["sources-drawer-list", matchedSource?.id, isMounted],
    enabled: isMounted && !!matchedSource,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      if (!isMounted || !matchedSource) return null;

      const index = sourcesMainValues.findIndex(
        (sourceMainValues) => sourceMainValues.id === matchedSource.id,
      );

      if (index === -1) {
        console.log("Matched source not found in sourcesMainValues", {
          sourcesMainValues,
          matchedSource,
        });

        return null;
      }

      rowVirtualizer.scrollToIndex(index, {
        behavior: "auto",
        align: "center",
      });

      return null;
    },
  });

  return (
    <div ref={parentRef} className="w-full h-[83vh] simple-scrollbar px-3">
      <div
        className="relative w-full h-[attr(data-height_px)]"
        data-height={rowVirtualizer.getTotalSize()}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const sourceMainValues = sourcesMainValues[virtualRow.index];

          if (!sourceMainValues) return null;

          let icon = null;
          if (
            // Check if sources is from ClickUp:
            sourceMainValues.normalizedSource.source_type === SourceForUserType.StandardDocument &&
            (("fields" in sourceMainValues.normalizedSource.values &&
              sourceMainValues.normalizedSource.values.fields.document_source ===
                DocumentSource.Clickup) ||
              ("values" in sourceMainValues.normalizedSource &&
                // @ts-expect-error => document_source is sometimes in values
                sourceMainValues.normalizedSource.values.document_source ===
                  DocumentSource.Clickup))
          ) {
            icon = clickupSourceIconUrl ? (
              <img src={clickupSourceIconUrl} className="size-8 flex-none" />
            ) : (
              matchIcon(sourceMainValues.normalizedSource.source_type, "size-8")
            );
          } else {
            icon = matchIcon(sourceMainValues.normalizedSource.source_type, "size-8");
          }

          return (
            <article
              className="top-0 left-0 absolute w-full translate-y-[attr(data-translate_px)] min-h-[attr(data-height_px)] py-4 flex flex-col gap-2 max-w-full select-text data-[selected=true]:bg-orange-400/20"
              data-selected={matchedSource?.id === sourceMainValues.id}
              title={sourceMainValues.normalizedSource.source_type}
              ref={rowVirtualizer.measureElement}
              data-translate={virtualRow.start}
              data-height={virtualRow.size}
              data-index={virtualRow.index}
              key={sourceMainValues.id}
            >
              <div className="flex items-center justify-start gap-4 max-w-full">
                {icon}

                {sourceMainValues.titleJSX}
              </div>

              <div className="w-full max-w-full flex flex-col gap-2 pl-12.5">
                {showReferenceMetadata ? getExtraInfo(sourceMainValues) : null}

                {showReferenceMetadata ? sourceMainValues.descriptionJSX : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
