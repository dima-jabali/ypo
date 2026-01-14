import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { Tool } from "#/types/batch-table";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";

export type GetToolsResponse = {
	results: Array<Tool>;
	num_results: number;
};

export function useFetchAvailableTools() {
	const organizationId = generalContextStore.use.organizationId();

	const queryOptions = useMemo(() => {
		return queryKeyFactory.get["available-tools"](organizationId);
	}, [organizationId]);

	return useSuspenseQuery({
		...queryOptions,
		staleTime: 5 * 60 * 1000, // 5 mins
		gcTime: Infinity, // Maintain on cache
	}).data;
}
