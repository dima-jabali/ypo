"use client";

import { type InfiniteData, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FilterArchived, generalContextStore } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { NotebookMetadata } from "#/types/notebook";
import { identity } from "#/helpers/utils";

export type FetchNotebookListPageParams = {
  sort_direction?: string | null | undefined;
  archived?: string | null | undefined;
  sort?: string | null | undefined;
  offset: number;
  limit: number;
};

export type FetchNotebookListPageResponse = {
  results: Array<NotebookMetadata>;
  num_results: number;
  offset: string;
  limit: string;
};

export type FetchNotebookListPageInfiniteData = InfiniteData<
  FetchNotebookListPageResponse,
  FetchNotebookListPageParams
>;

type SelectedListPage<SelectedData = FetchNotebookListPageInfiniteData> = (
  data: FetchNotebookListPageInfiniteData,
) => SelectedData;

export function useFetchNotebookListPage<SelectedData = FetchNotebookListPageInfiniteData>(
  select: SelectedListPage<SelectedData> = identity<
    FetchNotebookListPageInfiniteData,
    SelectedData
  >,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const [{ initialPageParam, queryOptions }] = useState(() => {
    const { pageArchived, pageLimit, pageSort, organizationId } = generalContextStore.getState();

    const initialPageParam: FetchNotebookListPageParams = {
      archived: pageArchived === FilterArchived.ALL ? undefined : pageArchived, // If ALL, don't send archived
      sort_direction: pageSort.sort_direction,
      sort: pageSort.sort,
      limit: pageLimit,
      offset: 0,
    };

    const queryOptions = queryKeyFactory.get["notebook-list-page"](organizationId);

    return { initialPageParam, queryOptions };
  });

  return useSuspenseInfiniteQuery({
    staleTime: 5 * 60 * 1_000,
    gcTime: Infinity, // Maintain on cache
    initialPageParam,
    ...queryOptions,
    select,
    getNextPageParam: (
      lastPage,
      _allPages,
      lastPageParams,
      // _allPagesParams,
    ) => {
      const nextOffset = lastPageParams.offset + lastPageParams.limit;

      if (lastPage && nextOffset > lastPage.num_results) return;

      return { ...lastPageParams, offset: nextOffset };
    },
    getPreviousPageParam: (
      _firstPage,
      _allPages,
      firstPageParams,
      // _allPagesParams,
    ) => {
      const prevOffset = firstPageParams.offset - firstPageParams.limit;

      if (prevOffset < 0) return;

      return { ...firstPageParams, offset: prevOffset };
    },
  });
}

function selectHasNotebooksInList(data: FetchNotebookListPageInfiniteData) {
  return data.pages.some((page) => page.results.length > 0);
}
export function useHasNotebooksInList() {
  return useFetchNotebookListPage(selectHasNotebooksInList)!.data;
}
