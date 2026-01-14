import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
	BatchTableDataSource,
	BatchTableDataSourceEntityHandlingType,
	BatchTableDataSourceEntityType,
	BatchTableDataSourceId,
} from "../get/use-fetch-batch-table-data-sources";
import type { OrganizationId } from "#/types/general";
import type { BatchTableColumnId } from "#/types/batch-table";
import { queryKeyFactory } from "#/hooks/query-keys";
import { clientAPI_V1 } from "#/api";

type CreateBatchTableDataSourceRequest = {
	batchTableDataSourceId: BatchTableDataSourceId;
	organizationId: OrganizationId;
	body: {
		entity_handling_type: BatchTableDataSourceEntityHandlingType;
		column_ids_to_remove: Array<BatchTableColumnId>;
		column_ids_to_add: Array<BatchTableColumnId>;
		entity_type: BatchTableDataSourceEntityType;
		interval_minutes: number | undefined;
		cron_schedule: string | undefined;
		description: string;
		name: string;
	};
};

type CreateBatchTableDataSourceResponse = BatchTableDataSource;

const mutationKey =
	queryKeyFactory.put["edit-batch-table-data-source"].queryKey;

export function useEditBatchTableDataSource() {
	const queryClient = useQueryClient();

	return useMutation<
		CreateBatchTableDataSourceResponse,
		Error,
		CreateBatchTableDataSourceRequest
	>({
		retry: false,
		mutationKey,

		mutationFn: async (args) => {
			const path = `/organizations/${args.organizationId}/data-sources/${args.batchTableDataSourceId}`;

			const res = await clientAPI_V1.put<CreateBatchTableDataSourceResponse>(
				path,
				args.body,
			);

			await queryClient.invalidateQueries(
				queryKeyFactory.get["batch-table-data-sources"](args.organizationId),
			);

			return res.data;
		},
	});
}
