import { useMutation } from "@tanstack/react-query";

import { clientAPI_V2 } from "#/api";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import type { CreateConnectionObject } from "#/types/connection-creation";
import type {
	AirtableDatabaseConnection,
	DatabaseConnectionType,
	GoogleDriveDatabaseConnection,
	NormalDatabaseConnection,
} from "#/types/databases";
import { queryKeyFactory } from "../query-keys";

export type CreateIntegrationResponseBase<T extends DatabaseConnectionType> =
	T extends DatabaseConnectionType.GoogleDrive
		? GoogleDriveDatabaseConnection
		: T extends DatabaseConnectionType.Airtable
			? AirtableDatabaseConnection
			: T extends DatabaseConnectionType.Postgres
				? NormalDatabaseConnection
				: never;

const mutationKey = queryKeyFactory.post["create-integration"].queryKey;

export function useCreateIntegration<T extends DatabaseConnectionType>() {
	type CreateIntegrationResponse = CreateIntegrationResponseBase<T>;
	type CreateIntegrationRequest = CreateConnectionObject<T>;

	const organizationId = useWithOrganizationId();

	return useMutation<
		CreateIntegrationResponse,
		Error,
		CreateIntegrationRequest
	>({
		mutationKey,

		mutationFn: async (body) => {
			const res = await clientAPI_V2.post(
				`/organizations/${organizationId}/integrations`,
				body,
			);

			return res.data;
		},

		meta: {
			invalidateQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			cancelQuery:
				queryKeyFactory.get["all-database-connections"](organizationId),
			errorTitle: "Failed to create integration with database!",
		},
	});
}
