import type { Tagged } from "type-fest";

import { createZustandProvider } from "#/contexts/create-zustand-provider";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";
import type {
	GeneralFile,
	GeneralFileType,
	GoogleDriveFileId,
} from "#/types/notebook";

export type VespaSourceId = Tagged<string, "VespaSourceId">;

type OrganizationFilesStore = {
	openedFileDetailsSheetOfFileId: number | null;
	selectedFiles: Map<number, GeneralFile>;
	dateFormatter: Intl.DateTimeFormat;
	isShowingSearchResults: boolean;
	filter: unknown | null;

	googleDriveConnectionId: GoogleDriveDatabaseConnectionId | null;
	googleDriveParentId: GoogleDriveFileId | null;
	vespaSourceId: VespaSourceId | null;
	fileType: GeneralFileType | null;
};

export const {
	Provider: OrganizationFilesStoreProvider,
	useStore: useOrganizationFilesStore,
} = createZustandProvider<OrganizationFilesStore>(
	() => ({
		openedFileDetailsSheetOfFileId: null,
		isShowingSearchResults: false,
		selectedFiles: new Map(),
		filter: null,
		dateFormatter: new Intl.DateTimeFormat(undefined, {
			year: "numeric",
			day: "2-digit",
			month: "short",
		}),

		googleDriveConnectionId: null,
		googleDriveParentId: null,
		vespaSourceId: null,
		fileType: null,
	}),
	{
		name: "OrganizationFilesStore",
	},
);
