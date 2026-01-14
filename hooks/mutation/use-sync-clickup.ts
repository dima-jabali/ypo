import { useMutation } from "@tanstack/react-query";

import { clientAPI_V2 } from "#/api";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import type {
	ClickUpConnectionId,
	ClickUpConnectionType,
	ClickUpEntityType,
	DatabaseConnectionType,
} from "#/types/databases";
import { queryKeyFactory } from "@/hooks/query-keys";

export type ClickUpConnectionFieldsUpdate = {
	index_documents_for_children_by_default?: boolean;
	select_index_documents_recursive?: boolean;
	select_indexing_recursive?: boolean;
	index_children_by_default?: boolean;
	entity_type: ClickUpEntityType;
	include_in_indexing: boolean;
	index_documents?: boolean;
	entity_id: number;
};

export type SyncClickUpRequest = {
	connection_type: DatabaseConnectionType.ClickUp;
	connection_id: ClickUpConnectionId;
	/* A list of emails */
	collaborators?: string[];
	force_reindex?: boolean;
	reindex?: boolean;

	updates: Array<ClickUpConnectionFieldsUpdate>;
	index_everything_documents?: boolean;
	sync_document_pages_to_db?: boolean;
	sync_documents_to_db?: boolean;
	sync_root_entities?: boolean;
	sync_tasks_to_db?: boolean;
	index_data?: boolean;
};

export type SyncClickUpResponse = ClickUpConnectionType;

const mutationKey = queryKeyFactory.put["sync-clickup"].queryKey;

export function useSyncClickUp() {
	const organizationId = useWithOrganizationId();

	return useMutation<SyncClickUpResponse, Error, SyncClickUpRequest>({
		mutationKey,

		mutationFn: async (body) => {
			const res = await clientAPI_V2.put<SyncClickUpResponse>(
				`organizations/${organizationId}/integrations/`,
				body,
			);

			return res.data;
		},

		meta: {
			invalidateQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			errorTitle: "Failed to sync ClickUp",
			successTitle: "ClickUp sync started",
		},
	});
}
