import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  Minus,
  Search,
  X,
} from "lucide-react";
import { lazy, useEffect, useMemo, useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "#/components/dropdown-menu";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { SortOrder } from "#/components/Tables/TableMaker/filters/utilityTypes";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { CollapseAllIcon } from "#/icons/collapse-all-icon";
import { ExpandAllIcon } from "#/icons/expand-all-icon";
import type { NotebookBlockUuid, QueryUuid, SimilarQuery } from "#/types/notebook";
import { SEARCH_FOR_MATCHES_ON_ALL_BLOCKS } from "./helper-jsxs";
import {
  SIMILAR_QUERIES_FILTER,
  SIMILAR_QUERIES_FILTERS,
  SortBy,
  TIME_TO_SEARCH_FOR_MATCHES,
  type Filters,
  type Sort,
} from "./helpers";

const RelevantQueryCard = lazy(async () => ({
  default: (await import("./relevant-query-card")).RelevantQueryCard,
}));

const SORT_TYPES = [SortBy.Relevance, SortBy.Overlap];

export function SimilarQueriesOfBlock() {
  const [filterBySimilarQueries, setFilterBySimilarQueries] = useState<Filters>("All");
  // Using an object instead of a plain boolean value here because: say you have
  // all cards maximized, then you minimize just one of them; if you click on
  // the maximize button again, it should re-maximize all cards. With a plain
  // boolean value, React sees as nothing has changed. But if we wrap it inside
  // an object, React will see it as a new value and will re-render all in their
  // maximized version.
  const [shouldExpandAll, setShouldExpandAll] = useState({
    shouldExpandAll: false,
  });
  const [sortBy, setSortBy] = useState<Sort>({
    sortBy: SortBy.Relevance,
    order: SortOrder.DESC,
  });

  const overlapValuesRef = useRef<Map<QueryUuid, number>>(new Map());

  const similarQueriesToShow = generalContextStore.use.similarQueriesToShow();

  const sortedAndFilteredBlocks = useMemo(() => {
    const result: Array<SimilarQuery> = [];

    if (!similarQueriesToShow) {
      return result;
    }

    for (const similarQuery of similarQueriesToShow.similarQueries) {
      if (
        filterBySimilarQueries === "All" ||
        SIMILAR_QUERIES_FILTER[filterBySimilarQueries] === similarQuery.query.entity_type
      ) {
        result.push(similarQuery);
      }
    }

    const overlapValues = overlapValuesRef.current;

    function overlapSortFn(a: SimilarQuery, b: SimilarQuery): number {
      const aOverlap = overlapValues.get(a.query.query_uuid) ?? 0;
      const bOverlap = overlapValues.get(b.query.query_uuid) ?? 0;

      if (sortBy.order === SortOrder.DESC) {
        return bOverlap - aOverlap;
      } else {
        return aOverlap - bOverlap;
      }
    }

    function relevanceSortFn(a: SimilarQuery, b: SimilarQuery): number {
      if (sortBy.order === SortOrder.DESC) {
        return b.relevance - a.relevance;
      } else {
        return a.relevance - b.relevance;
      }
    }

    return result.sort(sortBy.sortBy === SortBy.Overlap ? overlapSortFn : relevanceSortFn);
  }, [filterBySimilarQueries, similarQueriesToShow, sortBy]);

  function handleSortByRelevance() {
    setSortBy({
      order: sortBy.order === SortOrder.DESC ? SortOrder.ASC : SortOrder.DESC,
      sortBy: SortBy.Relevance,
    });
  }

  function handleSortByOverlap() {
    setSortBy({
      order: sortBy.order === SortOrder.DESC ? SortOrder.ASC : SortOrder.DESC,
      sortBy: SortBy.Overlap,
    });
  }

  function handleGoToAllBlocks() {
    generalContextStore.setState({
      searchTextForSimilarQueries: null,
      similarQueriesToShow: null,
    });
  }

  return (
    <>
      <header className="flex items-center justify-between gap-2 border-b py-1 border-border-smooth align-middle text-base font-bold">
        <button
          className="button-hover flex h-7 min-h-7 w-fit items-center gap-1 whitespace-nowrap rounded-sm py-1 pl-1 pr-2 text-xs font-light text-primary"
          title="Go back to all blocks with AI relevant queries"
          onPointerDown={handleGoToAllBlocks}
        >
          <ChevronLeftIcon className="size-4 stroke-primary stroke-1" />

          <p>All blocks</p>
        </button>

        <div className="flex h-full w-full items-center justify-end gap-1">
          <Popover>
            <PopoverTrigger
              className="flex aspect-square h-full items-center justify-center rounded-sm button-hover data-[state=open]:bg-button-active"
              title="Sort by"
            >
              <ChevronsUpDownIcon className="size-5 stroke-primary stroke-1" />
            </PopoverTrigger>

            <PopoverContent
              className="flex flex-col gap-1 p-1 text-sm z-500"
              align="center"
              sideOffset={5}
              side="bottom"
            >
              {SORT_TYPES.map((type) => {
                return (
                  <button
                    className="flex items-center justify-between gap-2 rounded-sm p-2 button-hover"
                    title="Toggle order of sort by relevance"
                    onClick={type === SortBy.Overlap ? handleSortByOverlap : handleSortByRelevance}
                    key={type}
                  >
                    <p>{type}</p>

                    {sortBy.order === SortOrder.ASC ? (
                      <ChevronUpIcon
                        className="size-3 data-[should-show=false]:invisible text-primary stroke-1"
                        data-should-show={type === sortBy.sortBy}
                      />
                    ) : sortBy.order === SortOrder.DESC ? (
                      <ChevronDownIcon
                        className="size-3 data-[should-show=false]:invisible text-primary stroke-1"
                        data-should-show={type === sortBy.sortBy}
                      />
                    ) : (
                      <Minus
                        className="size-3 data-[should-show=false]:invisible text-primary stroke-1"
                        data-should-show={type === sortBy.sortBy}
                      />
                    )}

                    <span
                      className="ml-6 flex w-12 items-center justify-center rounded-sm bg-button-hover p-1 px-2 text-center text-xs font-bold uppercase text-white transition-none group-hover:bg-button-active group-hover:text-black group-focus:bg-button-active group-focus:text-black data-[should-show=false]:invisible data-[order=asc]:bg-blue-500 data-[order=desc]:bg-yellow-700 data-[order=asc]:group-hover:bg-blue-400 data-[order=desc]:group-hover:bg-yellow-500 data-[order=asc]:group-focus:bg-blue-400 data-[order=desc]:group-focus:bg-yellow-500"
                      data-should-show={type === sortBy.sortBy}
                      data-order={sortBy.order}
                    >
                      {sortBy.order}
                    </span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <button
            className="flex aspect-square h-full items-center justify-center rounded-sm button-hover"
            onPointerUp={() => setShouldExpandAll({ shouldExpandAll: true })}
            title="Expand all"
          >
            <ExpandAllIcon className="size-5 fill-primary stroke-1" />
          </button>

          <button
            className="flex aspect-square h-full items-center justify-center rounded-sm button-hover"
            onPointerUp={() => setShouldExpandAll({ shouldExpandAll: false })}
            title="Collapse all"
          >
            <CollapseAllIcon className="size-5 fill-primary stroke-1" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex items-center gap-2 rounded-sm bg-button-hover px-2 py-1 text-xs font-bold tracking-wider active:bg-button-active! whitespace-nowrap">
              <span className="min-w-0 truncate max-w-6 xl:max-w-16">{filterBySimilarQueries}</span>

              <ChevronDownIcon className="size-3 flex-none stroke-primary" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="z-500">
              {SIMILAR_QUERIES_FILTERS.map((filterName) => {
                const isActive = filterBySimilarQueries === filterName;

                return (
                  <DropdownMenuCheckboxItem
                    className="group focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onPointerDown={() => setFilterBySimilarQueries(filterName)}
                    checked={isActive}
                    key={filterName}
                  >
                    {filterName}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchForMatches />

      <div className="simple-scrollbar scrollbar-stable">
        <div className="flex flex-col gap-8">
          {similarQueriesToShow &&
            sortedAndFilteredBlocks.map((similarQuery) => (
              <DefaultSuspenseAndErrorBoundary
                failedText="Error in relevant query card"
                fallbackFor="RelevantQueryCard"
                // this was the only thing that fixed the instatiation error on monaco when sorting
                // eslint-disable-next-line react-hooks/purity
                key={Math.random()}
                // key={similarQuery.query.id}
              >
                <RelevantQueryCard
                  overlapValuesRef={overlapValuesRef}
                  block={similarQueriesToShow.block}
                  relevance={similarQuery.relevance}
                  shouldExpandAll={shouldExpandAll}
                  query={similarQuery.query}
                />
              </DefaultSuspenseAndErrorBoundary>
            ))}
        </div>
      </div>
    </>
  );
}

function SearchForMatches() {
  const searchTextForSimilarQueries = generalContextStore.use.searchTextForSimilarQueries();

  const [value, setValue] = useState(searchTextForSimilarQueries?.value ?? "");

  const timerToSearchForMatchesRef = useRef<NodeJS.Timeout>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchForMatches = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setValue(newValue);

    clearTimeout(timerToSearchForMatchesRef.current);

    timerToSearchForMatchesRef.current = setTimeout(() => {
      generalContextStore.setState({
        searchTextForSimilarQueries: {
          blockUUID: SEARCH_FOR_MATCHES_ON_ALL_BLOCKS as NotebookBlockUuid,
          value: newValue,
        },
      });
    }, TIME_TO_SEARCH_FOR_MATCHES);
  };

  function clearSearch() {
    generalContextStore.setState({
      searchTextForSimilarQueries: {
        blockUUID: SEARCH_FOR_MATCHES_ON_ALL_BLOCKS as NotebookBlockUuid,
        value: "",
      },
    });

    inputRef.current?.blur();
    setValue("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      clearSearch();
    }
  }

  useEffect(() => {
    if (searchTextForSimilarQueries?.value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(searchTextForSimilarQueries.value);
    }
  }, [searchTextForSimilarQueries?.value]);

  return (
    <section className="relative flex items-center justify-center py-1">
      <div className="flex w-full shrink-0 items-center justify-start gap-1 rounded-full border border-border-smooth p-1 focus-within:ring-1 focus-within:ring-accent/40">
        <Search className="size-4 stroke-primary stroke-1" />

        <input
          className="h-full flex-1 shrink-0 overflow-clip text-ellipsis bg-transparent text-sm outline-hidden focus-visible:ring-transparent"
          onChange={handleSearchForMatches}
          placeholder="Search for matches"
          onKeyDown={onKeyDown}
          ref={inputRef}
          value={value}
        />

        <button
          className="button-hover flex size-5 items-center justify-center rounded-full p-1"
          onPointerUp={clearSearch}
        >
          <X className="stroke-primary stroke-1" />
        </button>
      </div>
    </section>
  );
}
