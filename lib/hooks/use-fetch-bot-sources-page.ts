import {
	useSuspenseInfiniteQuery,
	type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { BotSource } from "#/types/bot-source";
import type { OrganizationId } from "#/types/general";
import { queryKeyFactory } from "../query-keys";

export type GetAllBotSourcesRequest = {
	sort_direction?: "desc" | "asc";
	organizationId: OrganizationId;
	offset: number;
	limit: number;
	sort?: string;
};

export type GetAllBotSourcesResponse = {
	results: BotSource[];
	num_results: number;
	offset: string;
	limit: string;
};

export const DEFAULT_BOT_SOURCES: BotSource[] = [];

export function useFetchBotSourcesPage() {
	const organizationId = generalContextStore.use.organizationId();

	const { initialPageParam, queryOptions } = useMemo(() => {
		const initialPageParam: GetAllBotSourcesRequest = {
			organizationId,
			limit: 30,
			offset: 0,
		};

		const queryOptions =
			queryKeyFactory.get["bot-sources-page"](organizationId);

		return { initialPageParam, queryOptions };
	}, [organizationId]);

	return useSuspenseInfiniteQuery({
		initialPageParam,
		...queryOptions,
		select: (
			data:
				| InfiniteData<GetAllBotSourcesResponse, GetAllBotSourcesRequest>
				| undefined,
		) => ({
			results:
				data?.pages.flatMap((page) => page?.results) ?? DEFAULT_BOT_SOURCES,
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
