import { type InfiniteData, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { PDF, PDFOrCSVSourceType } from "#/types/bot-source";
import { queryKeyFactory } from "../query-keys";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export type GetPDFOrCSVFilesPageRequest = {
  file_type: PDFOrCSVSourceType;
  vespa_source_id?: string;
  document_source?: string;
  organizationId: number;
  offset: number;
  limit: number;
};

export type GetPDFOrCSVFilesPageResponse = {
  num_results: number;
  offset: string;
  results: PDF[];
  limit: string;
};

export function useFetchPDFOrCSVFilesPage(file_type: PDFOrCSVSourceType) {
  const organizationId = generalContextStore.use.organizationId();

  const { initialPageParam, queryOptions } = useMemo(() => {
    const initialPageParam: GetPDFOrCSVFilesPageRequest = {
      organizationId: Number(organizationId),
      limit: 10,
      offset: 0,
      file_type,
    };

    const queryOptions = queryKeyFactory.get["pdf-or-csv-files-page"](organizationId, file_type);

    return {
      initialPageParam,
      queryOptions,
    };
  }, [organizationId, file_type]);

  const pdfOrCSVFilesPageQuery = useSuspenseInfiniteQuery({
    initialPageParam,
    ...queryOptions,
    select: (
      data: InfiniteData<GetPDFOrCSVFilesPageResponse, GetPDFOrCSVFilesPageRequest> | undefined,
    ) => data?.pages.flatMap((page) => page?.results),
    getNextPageParam: (lastPage, _allPages, lastPageParams) => {
      const nextOffset = lastPageParams.offset + lastPageParams.limit;

      if (lastPage && nextOffset > lastPage.num_results) return;

      return { ...lastPageParams, offset: nextOffset };
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
      const prevOffset = firstPageParams.offset - firstPageParams.limit;

      if (prevOffset < 0) return;

      return { ...firstPageParams, offset: prevOffset };
    },
  });

  return pdfOrCSVFilesPageQuery;
}
