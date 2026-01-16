import { useSuspenseInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

import { generalContextStore, type PageOffset } from "#/contexts/general-ctx/general-context";
import { identity } from "#/helpers/utils";
import type { Bot } from "#/types/bot-source";
import { queryKeyFactory } from "../query-keys";

export type GetAllBotsRequest = {
  sort_direction?: "desc" | "asc" | null;
  organizationId: number;
  sort?: string | null;
  offset: number;
  limit: number;
};

export type GetAllBotsResponse = {
  num_results: number;
  results: Bot[];
  offset: string;
  limit: string;
};

type GetAllBotsInfiniteData = InfiniteData<GetAllBotsResponse, GetAllBotsRequest>;

export function useFetchBotsPage<SelectedData = GetAllBotsInfiniteData>(
  select: (data: GetAllBotsInfiniteData) => SelectedData = identity<
    GetAllBotsInfiniteData,
    SelectedData
  >,
) {
  const organizationId = generalContextStore.use.organizationId();
  const offset = generalContextStore.use.pageOffset();
  const pageSort = generalContextStore.use.pageSort();
  const limit = generalContextStore.use.pageLimit();

  const queryOptions = useMemo(() => {
    return queryKeyFactory.get["bots-page"](organizationId);
  }, [organizationId]);

  return useSuspenseInfiniteQuery({
    refetchOnWindowFocus: false,
    gcTime: 20 * 1_000 * 60, // 20 minutes
    staleTime: Infinity, // Maintain on cache
    initialPageParam: {
      sort_direction: pageSort.sort_direction,
      sort: pageSort.sort,
      organizationId,
      offset,
      limit,
    },
    ...queryOptions,
    select,
    getNextPageParam: (lastPage, _allPages, lastPageParams) => {
      const nextOffset = lastPageParams.offset + lastPageParams.limit;

      if (lastPage && nextOffset > lastPage.num_results) return;

      return { ...lastPageParams, offset: nextOffset as PageOffset };
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
      const prevOffset = firstPageParams.offset - firstPageParams.limit;

      if (prevOffset < 0) return;

      return { ...firstPageParams, offset: prevOffset as PageOffset };
    },
  });
}
