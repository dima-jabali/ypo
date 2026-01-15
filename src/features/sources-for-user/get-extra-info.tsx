import {
	GoogleDriveSourceType,
	SourceForUserType,
	StandardDocumentSourceType,
} from "#/types/chat";
import type { SourceMainValues } from "./get-source-main-values";
import type { NormalizedSource } from "./get-top-n-sources";
import { AirtableTable } from "./Snippets/Airtable";
import { DataSchemaTable } from "./Snippets/data-schema";
import {
	GoogleDriveMinimalDetails,
	GoogleDriveVerboseDetails,
} from "./Snippets/google-drive";
import {
	StandardDocumentMinimalDetails,
	StandardDocumentVerboseDetails,
} from "./Snippets/standard-document";
import { WebDescription } from "./Snippets/Web";

export function getExtraInfo(
	sourceMainValues: SourceMainValues<
		SourceForUserType,
		NormalizedSource["values_type"]
	>,
) {
	switch (sourceMainValues.normalizedSource.source_type) {
		case SourceForUserType.Airtable:
			return (
				<AirtableTable normalizedSource={sourceMainValues.normalizedSource} />
			);

		case SourceForUserType.DataSchema:
			return (
				<DataSchemaTable normalizedSource={sourceMainValues.normalizedSource} />
			);

		case SourceForUserType.Web:
			return (
				<WebDescription normalizedSource={sourceMainValues.normalizedSource} />
			);

		case SourceForUserType.GoogleDrive: {
			switch (sourceMainValues.normalizedSource.values_type) {
				case GoogleDriveSourceType.Minimal:
					return (
						<GoogleDriveMinimalDetails
							normalizedSource={sourceMainValues.normalizedSource}
						/>
					);

				case GoogleDriveSourceType.Verbose:
					return (
						<GoogleDriveVerboseDetails
							normalizedSource={sourceMainValues.normalizedSource}
						/>
					);

				default:
					return null;
			}
		}

		case SourceForUserType.StandardDocument: {
			switch (sourceMainValues.normalizedSource.values_type) {
				case StandardDocumentSourceType.Minimal:
					return (
						<StandardDocumentMinimalDetails
							normalizedSource={sourceMainValues.normalizedSource}
						/>
					);

				case StandardDocumentSourceType.Verbose:
					return (
						<StandardDocumentVerboseDetails
							normalizedSource={sourceMainValues.normalizedSource}
						/>
					);

				default:
					return null;
			}
		}

		default:
			return null;
	}
}
