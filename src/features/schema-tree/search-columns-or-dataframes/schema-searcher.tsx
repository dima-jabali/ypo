import { useDebounce } from "@uidotdev/usehooks";
import { ChevronLeftIcon, Search, X } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { LOADER } from "#/components/Button";
import { databasesSchemaStore, OpenView } from "#/contexts/databases-schema";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isRecord, noop } from "#/helpers/utils";
import { useSearchSchema } from "#/hooks/mutation/use-search-schema";
import type { DatabaseConnection, SearchSchemaResponse } from "#/types/databases";
import { LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND } from "../utils";
import { SearchResult } from "./search-result";

type SchemaSearcherProps = {
  selectedDatabase?: DatabaseConnection | null;
  openView: OpenView;
  setOpenView: React.Dispatch<React.SetStateAction<OpenView>>;
};

const TIMEOUT_TO_SEARCH_SCHEMA = 500;

export const SchemaSearcher: React.FC<SchemaSearcherProps> = ({
  selectedDatabase,
  openView,
  setOpenView,
}) => {
  const [searchResults, setSearchResults] = useState<SearchSchemaResponse>();
  const [searchValue, setSearchValue] = useState("");

  const previousExpandedSearchResultRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchValue = useDebounce(searchValue, TIMEOUT_TO_SEARCH_SCHEMA);

  const organizationId = generalContextStore.use.organizationId();
  const searchSchemaMutation = useSearchSchema();

  const [searchString, searchStringRegExp] = useMemo(() => {
    const str = debouncedSearchValue.trim().toLowerCase();

    return [str, new RegExp(str, "gi")];
  }, [debouncedSearchValue]);

  const searchResultsJSXs = useMemo(
    () =>
      searchResults?.results.map((result) => {
        const id = `${result.result.id}${result.result.name}`;

        return (
          <SearchResult
            previousExpandedSearchResultRef={previousExpandedSearchResultRef}
            searchStringRegExp={searchStringRegExp}
            setOpenView={setOpenView}
            searchResult={result}
            key={id}
            id={id}
          />
        );
      }),
    [searchResults?.results, searchStringRegExp, setOpenView],
  );

  const hasSearchResults = Boolean(
    searchResults?.results && searchResults.results.length > 0 && !searchSchemaMutation.isPending,
  );
  const shouldShowBackToResultsButton = openView === OpenView.SearchResultExpandedDatabaseTree;
  const shouldShowSearchResults = openView === OpenView.SearchResults;
  const searchSchema = searchSchemaMutation.mutateAsync;
  const hasText = searchValue.length > 0;

  function handleCloseSearcher() {
    databasesSchemaStore.setState({ searchResultItemsToExpand: [] });
    setOpenView(OpenView.DatabasesTree);
    setSearchValue("");
  }

  function handleGoBackToSearchResults() {
    setOpenView(OpenView.SearchResults);

    databasesSchemaStore.setState({
      searchResultItemsToExpand: [LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND],
      columns: null,
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();

      inputRef.current?.blur();

      handleCloseSearcher();
    }
  }

  useLayoutEffect(() => {
    if (!searchString) {
      setSearchResults(undefined);

      return;
    }

    const abortController = new AbortController();

    (async () => {
      try {
        databasesSchemaStore.setState({ searchResultItemsToExpand: [] });
        setOpenView(OpenView.SearchResults);

        const res = await searchSchema({
          connection_id: selectedDatabase?.id ?? undefined,
          abortControllerSignal: abortController.signal,
          connection_type: selectedDatabase?.type,
          orgId: organizationId,
          prompt: searchString,
        });

        setSearchResults(res);
      } catch (error) {
        const wasAborted = isRecord(error) && "code" in error && error.code === "ERR_CANCELED";

        if (!wasAborted) {
          console.error("Error searching for schema:", error);
        }
      }
    })().catch(noop);

    return () => {
      abortController.abort(); // Cancel ongoing fetch request when something changes or the component unmounts.
    };
  }, [
    selectedDatabase?.type,
    selectedDatabase?.id,
    organizationId,
    searchString,
    searchSchema,
    setOpenView,
  ]);

  useLayoutEffect(() => {
    // If no text was typed, close the searcher (this is used to show the SchemaTree when there is no search going on).
    if (!hasText) {
      setOpenView(OpenView.DatabasesTree);
    }
  }, [hasText, setOpenView]);

  return (
    <>
      <div className="m-2 my-2 flex shrink-0 items-center justify-start gap-1 rounded-full border border-border-smooth p-1 focus-within:ring-1 focus-within:ring-accent/40">
        <Search className="size-5 stroke-primary stroke-1" />

        <input
          className="h-full flex-1 shrink-0 overflow-clip text-ellipsis bg-transparent text-sm tracking-wide outline-hidden focus-visible:ring-transparent ring-offset-transparent placeholder:text-sm"
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search column or dataframe..."
          onKeyDown={onKeyDown}
          value={searchValue}
          ref={inputRef}
          type="text"
        />

        <button
          className="button-hover flex size-5 items-center justify-center rounded-full p-1"
          onClick={handleCloseSearcher}
        >
          <X className="stroke-primary stroke-1" />
        </button>
      </div>

      {shouldShowBackToResultsButton ? (
        <button
          className="mb-2 ml-2 flex w-fit items-center gap-2 rounded-sm p-1 pr-2 text-sm text-primary button-hover"
          onClick={handleGoBackToSearchResults}
        >
          <ChevronLeftIcon className="size-4 stroke-primary stroke-1" />

          <p>Back to search results</p>
        </button>
      ) : null}

      {searchSchemaMutation.isPending ? (
        <div className="flex h-[67vh] w-full items-center justify-center">{LOADER}</div>
      ) : shouldShowSearchResults ? (
        <div className="simple-scrollbar relative flex h-[67vh] scrollbar-stable">
          <div className="w-full">
            {hasSearchResults ? (
              searchResultsJSXs
            ) : (
              <div className="absolute left-1/2 top-1/3 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-2 px-3 text-center text-xs font-bold">
                <p className="rounded-full border border-border-smooth  p-3">
                  <Search className="size-7 stroke-primary stroke-1" />
                </p>

                <p>No results found</p>
              </div>
            )}

            <div className="h-96"></div>
          </div>
        </div>
      ) : null}
    </>
  );
};
