import {
	useSuspenseInfiniteQuery,
	type InfiniteData,
	type QueryFunction,
} from "@tanstack/react-query";
import { useMemo } from "react";

import {
	FilterArchived,
	generalContextStore,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BatchTableMetadata, BatchTableMode } from "#/types/batch-table";

export enum ProjectColumnToSortOn {
	LastModifiedBy = "last_modified_by",
	LastModifiedAt = "last_modified_at",
	CreatedBy = "created_by",
	CreatedAt = "created_at",
	Importance = "priority",
	Status = "status",
	Title = "title",
	Name = "name",
	Id = "id",
}

export enum ProjectSortDirection {
	DESC = "desc",
	ASC = "asc",
}

export type GetBatchTableMetadatasPageRequest = {
	sort_direction: ProjectSortDirection | undefined;
	archived: FilterArchived | undefined;
	sort: string | undefined;
	offset: number;
	limit: number;
};

export type GetBatchTableMetadatasResponse = {
	results: Array<BatchTableMetadata>;
	num_results: number;
	offset: number;
	limit: number;
};

export type PostBatchTableMetadataRequest = Partial<{
	batch_table_mode: BatchTableMode;
	description: string;
	name: string;
}>;

export type PostBatchTableMetadataResponse = BatchTableMetadata;

export type InfiniteDataBatchTableMetadataList = InfiniteData<
	GetBatchTableMetadatasResponse,
	GetBatchTableMetadatasPageRequest
>;

export function useFetchBatchTableMetadatasPage() {
	const pageArchived = generalContextStore.use.pageArchived();
	const pageLimit = generalContextStore.use.pageLimit();
	const pageSort = generalContextStore.use.pageSort();
	const organizationId = useWithOrganizationId();

	const { initialPageParam, queryOptions } = useMemo(() => {
		const initialPageParam: GetBatchTableMetadatasPageRequest = {
			archived: pageArchived === FilterArchived.ALL ? undefined : pageArchived, // If ALL, don't send archived
			sort_direction:
				pageSort.sort_direction as GetBatchTableMetadatasPageRequest["sort_direction"],
			sort: pageSort.sort as GetBatchTableMetadatasPageRequest["sort"],
			limit: pageLimit,
			offset: 0,
		};

		generalContextStore
			.getState()
			.lastBatchTableMetadataListQueryParams.set(
				organizationId,
				initialPageParam,
			);

		const queryOptions = queryKeyFactory.get["batch-table-metadata-page"](
			organizationId,
			initialPageParam,
		);

		return { queryOptions, initialPageParam };
	}, [pageLimit, pageSort, pageArchived, organizationId]);

	return useSuspenseInfiniteQuery<
		GetBatchTableMetadatasResponse,
		Error,
		InfiniteDataBatchTableMetadataList,
		typeof queryOptions.queryKey,
		GetBatchTableMetadatasPageRequest
	>({
		queryFn: queryOptions.queryFn as QueryFunction<
			GetBatchTableMetadatasResponse,
			typeof queryOptions.queryKey,
			GetBatchTableMetadatasPageRequest
		>,
		queryKey: queryOptions.queryKey,
		gcTime: Infinity,
		initialPageParam,
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
