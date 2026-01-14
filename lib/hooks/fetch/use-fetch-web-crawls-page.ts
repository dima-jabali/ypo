import {
	useSuspenseInfiniteQuery,
	type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { WebCrawlCreationSource, type WebCrawl } from "#/types/bot-source";
import { queryKeyFactory } from "@/hooks/query-keys";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export type GetWebCrawlsPageRequest = {
	creation_source: WebCrawlCreationSource;
	organizationId: number;
	offset: number;
	limit: number;
};

export type GetWebCrawlsPageResponse = {
	results: WebCrawl[];
	num_results: number;
	offset: string;
	limit: string;
};

export const DEFAULT_WEBCRAWLS: WebCrawl[] = [];

export function useFetchWebCrawlsPage() {
	const organizationId = generalContextStore.use.organizationId();

	const { initialPageParam, queryOptions } = useMemo(() => {
		const initialPageParam: GetWebCrawlsPageRequest = {
			creation_source: WebCrawlCreationSource.User,
			organizationId,
			limit: 30,
			offset: 0,
		};

		const queryOptions = queryKeyFactory.get["web-crawls-page"](organizationId);

		return { initialPageParam, queryOptions };
	}, [organizationId]);

	return useSuspenseInfiniteQuery({
		refetchOnWindowFocus: false,
		staleTime: Infinity, // Maintain on cache
		initialPageParam,
		...queryOptions,
		select: (
			data:
				| InfiniteData<GetWebCrawlsPageResponse, GetWebCrawlsPageRequest>
				| undefined,
		) => ({
			results:
				data?.pages.flatMap((page) => page?.results) ?? DEFAULT_WEBCRAWLS,
			total: data?.pages.at(-1)?.num_results || 0,
		}),
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
}
