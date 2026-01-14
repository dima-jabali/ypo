import type { Tagged } from "type-fest";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { BatchTableColumnId } from "#/types/batch-table";
import type { BotSource } from "#/types/bot-source";
import type { ISODateString } from "#/types/general";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";

export enum BatchTableDataSourceEntityType {
	FILE = "FILE",
}

export const BatchTableDataSourceEntityTypes = Object.values(
	BatchTableDataSourceEntityType,
);

export enum BatchTableDataSourceEntityHandlingType {
	ADD_NEW_ENTITIES_AND_DELETE_OLD = "ADD_NEW_ENTITIES_AND_DELETE_OLD",
	ADD_NEW_ENTITIES_AND_KEEP_OLD = "ADD_NEW_ENTITIES_AND_KEEP_OLD",
}

export const BatchTableDataSourceEntityHandlingTypes = Object.values(
	BatchTableDataSourceEntityHandlingType,
);

export type BatchTableDataSourceId = Tagged<number, "BatchTableDataSourceId">;

export type BatchTableDataSource = {
	entity_handling_type: BatchTableDataSourceEntityHandlingType;
	batch_table_columns: Array<{ id: BatchTableColumnId }>;
	entity_type: BatchTableDataSourceEntityType;
	interval_minutes: number | undefined;
	cron_schedule: string | undefined;
	id: BatchTableDataSourceId;
	last_run_at: ISODateString;
	description: string;
	source: BotSource;
	name: string;
};

export type GetBatchTableDataSourcesResponse = {
	results: Array<BatchTableDataSource>;
	num_results: number;
};

export function useFetchBatchTableDataSources() {
	const organizationId = useWithOrganizationId();

	const queryOptions = useMemo(
		() => queryKeyFactory.get["batch-table-data-sources"](organizationId),
		[organizationId],
	);

	return useSuspenseQuery({
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		gcTime: Infinity, // Maintain on cache
		...queryOptions,
	}).data;
}
