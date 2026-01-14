import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { OrganizationId } from "#/types/general";
import type {
	BatchTableDataSource,
	BatchTableDataSourceEntityHandlingType,
	BatchTableDataSourceEntityType,
} from "../get/use-fetch-batch-table-data-sources";
import type { BatchTableColumnId } from "#/types/batch-table";
import type { BotSourceId } from "#/types/bot-source";
import { queryKeyFactory } from "#/hooks/query-keys";
import { clientAPI_V1 } from "#/api";

type CreateBatchTableDataSourceRequest = {
	organizationId: OrganizationId;
	body: {
		entity_handling_type: BatchTableDataSourceEntityHandlingType;
		column_ids_to_remove: Array<BatchTableColumnId>;
		column_ids_to_add: Array<BatchTableColumnId>;
		entity_type: BatchTableDataSourceEntityType;
		interval_minutes: number | undefined;
		cron_schedule: string | undefined;
		column_id: BatchTableColumnId;
		source_id: BotSourceId;
		description: string;
		name: string;
	};
};

type CreateBatchTableDataSourceResponse = BatchTableDataSource;

const mutationKey =
	queryKeyFactory.post["create-batch-table-data-source"].queryKey;

export function useCreateBatchTableDataSource() {
	const queryClient = useQueryClient();

	return useMutation<
		CreateBatchTableDataSourceResponse,
		Error,
		CreateBatchTableDataSourceRequest
	>({
		mutationKey,

		meta: {
			errorTitle: "Error creating Batch Table Data Source!",
		},

		mutationFn: async (args) => {
			const path = `/organizations/${args.organizationId}/data-sources`;

			const res = await clientAPI_V1.post<CreateBatchTableDataSourceResponse>(
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
