import { dataManagerStore } from "#/contexts/data-manager";
import { DatabaseConnectionType } from "#/types/databases";
import { EditAirtable } from "./airtable/edit-airtable";
import { EditClickUp } from "./clickup/edit-clickup";
import { EditGoogleDrive } from "./google-drive/edit-google-drive-connection";
import { EditPostgres } from "./postgres/edit-postgres";
import { EditSlack } from "./slack/edit-slack";
import { EditSnowflake } from "./snowflake/edit-snowflake";

export function EditSomeDb() {
	const dataManagerConnectionType = dataManagerStore.use.connectionType();
	const dataManagerConnectionId = dataManagerStore.use.connectionId();

	switch (dataManagerConnectionType) {
		case DatabaseConnectionType.Airtable:
			return <EditAirtable />;

		case DatabaseConnectionType.ClickUp:
			return <EditClickUp />;

		case DatabaseConnectionType.GoogleDrive:
			return <EditGoogleDrive />;

		case DatabaseConnectionType.Postgres:
			return <EditPostgres />;

		case DatabaseConnectionType.Slack:
			return <EditSlack />;

		case DatabaseConnectionType.Snowflake:
			return <EditSnowflake />;

		default: {
			console.error("Invalid connection type", {
				dataManagerConnectionType,
				dataManagerConnectionId,
			});

			return (
				<div className="h-full w-full flex items-center justify-center text-muted bg-black">
					Invalid connection. Please, contact support.
				</div>
			);
		}
	}
}
