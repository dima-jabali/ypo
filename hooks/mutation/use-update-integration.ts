import { useMutation } from "@tanstack/react-query";

import { clientAPI_V2 } from "#/api";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import type {
	AirtableDatabaseConnection,
	DatabaseConnectionType,
	GoogleDriveDatabaseConnection,
	NormalDatabaseConnection,
	PlaidConnection,
	SlackConnectionDataWithDefinedChannels,
} from "#/types/databases";
import type { OrganizationId } from "#/types/general";
import { queryKeyFactory } from "@/hooks/query-keys";

const mutationKey = queryKeyFactory.put["update-integration"].queryKey;

type BaseUpdateIntegrationRequest = {
	organization_ids_with_access?: Array<OrganizationId>;
	connection_type: DatabaseConnectionType;
	/** List of emails */
	collaborators?: Array<string>;
	connection_id: number;
	reindex?: boolean;
};

type UpdateIntegrationRequest<T extends DatabaseConnectionType> =
	BaseUpdateIntegrationRequest &
		(T extends DatabaseConnectionType.GoogleDrive
			? { force_reindex?: boolean }
			: T extends DatabaseConnectionType.Slack
				? {
						channels_to_index?: Array<number>;
						sync_channels?: boolean;
					}
				: T extends DatabaseConnectionType.Plaid
					? { is_enabled: boolean; is_public: boolean; name: string }
					: never);

export type UpdateIntegrationResponse<T extends DatabaseConnectionType> =
	T extends DatabaseConnectionType.GoogleDrive
		? GoogleDriveDatabaseConnection
		: T extends DatabaseConnectionType.Airtable
			? AirtableDatabaseConnection
			: T extends DatabaseConnectionType.Postgres
				? NormalDatabaseConnection
				: T extends DatabaseConnectionType.Slack
					? SlackConnectionDataWithDefinedChannels
					: T extends DatabaseConnectionType.Plaid
						? PlaidConnection
						: never;

export function useUpdateIntegration<T extends DatabaseConnectionType>() {
	const organizationId = useWithOrganizationId();

	return useMutation<
		UpdateIntegrationResponse<T>,
		Error,
		UpdateIntegrationRequest<T>
	>({
		mutationKey,

		mutationFn: async (body) => {
			if (!body) throw new Error("No args provided!");

			const res = await clientAPI_V2.put<UpdateIntegrationResponse<T>>(
				`organizations/${organizationId}/integrations/`,
				body,
			);

			return res.data;
		},

		meta: {
			invalidateQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			cancelQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			successTitle: "Integration updated successfully!",
			errorTitle: "Failed to update integration!",
		},
	});
}
