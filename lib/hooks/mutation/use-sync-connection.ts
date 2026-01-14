import { useMutation } from "@tanstack/react-query";

import { clientAPI_V2 } from "#/api";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import type {
	AirtableDatabaseConnection,
	DatabaseConnection,
	DatabaseConnectionType,
	GoogleDriveDatabaseConnection,
} from "#/types/databases";
import { queryKeyFactory } from "../query-keys";

export enum AirtableConnectionFieldsUpdateEntityType {
	Field = "FIELD",
	Table = "TABLE",
	Base = "BASE",
}

export type SyncAirtableRequest = {
	connection_type: DatabaseConnectionType.Airtable;
	resync_models_only?: boolean;
	/* A list of emails */
	collaborators?: string[];
	connection_id: number;
	reindex?: boolean;
	updates?: Array<{
		entity_type: AirtableConnectionFieldsUpdateEntityType;
		include_in_indexing: boolean;
		entity_id: number;
	}>;
};

type SyncGoogleDriveRequest = {
	connection_type: DatabaseConnectionType.GoogleDrive;
	/* A list of emails */
	collaborators?: string[];
	force_reindex?: boolean;
	connection_id: number;
	reindex?: boolean;
};

type SyncConnectionRequest<T extends DatabaseConnection> =
	T extends AirtableDatabaseConnection
		? SyncAirtableRequest
		: T extends GoogleDriveDatabaseConnection
			? SyncGoogleDriveRequest
			: never;

type SyncConnectionResponse<T extends DatabaseConnection> = T;

const mutationKey = queryKeyFactory.put["sync-connection"].queryKey;

export function useSyncConnection<T extends DatabaseConnection>() {
	const organizationId = useWithOrganizationId();

	return useMutation<
		SyncConnectionResponse<T>,
		Error,
		SyncConnectionRequest<T>
	>({
		mutationKey,

		mutationFn: async (body) => {
			const res = await clientAPI_V2.put<SyncConnectionResponse<T>>(
				`/organizations/${organizationId}/integrations`,
				body,
			);

			return res.data;
		},

		meta: {
			invalidateQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			successTitle: "Connection is being synced in the background",
			errorTitle: "Error syncing connection",
		},
	});
}
