import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "#/api";
import {
	type PageLimit,
	type PageOffset,
} from "#/contexts/general-ctx/general-context";
import type { OrgMemberWithRole } from "#/types/notebook";
import { queryKeyFactory } from "@/hooks/query-keys";
import { useWithCurrentOrg } from "../use-current-organization";

export type FetchOrganizationUsersRequest = {
	sort_by?: "NAME" | "EMAIL";
	offset: PageOffset;
	limit: PageLimit;
	query?: string;
};

export type FetchOrganizationUsersResponse = {
	results: Array<OrgMemberWithRole>;
	total_results: number;
	offset: PageOffset;
	limit: PageLimit;
};

export function useFetchOrganizationUsersPage(enabled: boolean) {
	const organization = useWithCurrentOrg();

	const queryOptions = queryKeyFactory.get["organization-users"](
		organization.id,
	);

	return useInfiniteQuery({
		initialPageParam: {
			offset: organization.members.offset,
			limit: 100 as PageLimit,
		},
		staleTime: 5 * 60 * 1000, // 5 mins
		gcTime: Infinity, // Maintain on cache
		enabled,

		...queryOptions,

		queryFn: async ({ pageParam, client }) =>
			await api.get["organization-users"](organization.id, pageParam, client),

		getNextPageParam: (lastPage, _allPages, lastPageParams) => {
			const nextOffset = lastPageParams.offset + lastPageParams.limit;

			if (lastPage && nextOffset > lastPage.total_results) return;

			return { ...lastPageParams, offset: nextOffset as PageOffset };
		},

		getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
			const prevOffset = firstPageParams.offset - firstPageParams.limit;

			if (prevOffset < 0) return;

			return { ...firstPageParams, offset: prevOffset as PageOffset };
		},
	});
}
