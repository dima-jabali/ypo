import { object, string, minLength, trim } from "zod/mini";

import type { ConstrainedConnectionData } from "#/types/connection-creation";
import { DatabaseConnectionType } from "#/types/databases";

export const AIRTABLE_CONNECTION_NAME_INPUT_ID = "airtable-connection-name";
export const AIRTABLE_PAT_INPUT_ID = "airtable-auth-token";

export const getConstrainedData = (type: DatabaseConnectionType) => {
	switch (type) {
		case DatabaseConnectionType.Postgres:
			return (connFormData: {
				password: string;
				database: string;
				username: string;
				port: number;
				host: string;
			}) => {
				const data: ConstrainedConnectionData[DatabaseConnectionType.Postgres] =
					{
						port: connFormData.port as number,
						password: connFormData.password,
						database: connFormData.database,
						user: connFormData.username,
						host: connFormData.host,
					};

				return data;
			};

		case DatabaseConnectionType.ExternalDatasource:
		case DatabaseConnectionType.OracleDatabase:
		case DatabaseConnectionType.Snowflake:
		case DatabaseConnectionType.Airtable:
		case DatabaseConnectionType.BigQuery:
		case DatabaseConnectionType.Polygon:
		case DatabaseConnectionType.Spotify:
		case DatabaseConnectionType.Notion:
		case DatabaseConnectionType.Slack:
			return null;

		default:
			return null;
	}
};

export const assureHasPrivateKeyIdField = object({
	private_key_id: string().check(
		trim(),
		minLength(1, "`private_key_id` is a required field!"),
	),
});
