import { Button, ButtonVariant } from "#/components/Button";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { FileDetailsSheet } from "#/features/organization-files/components/file-details-sheet";
import { FilesTable } from "#/features/organization-files/components/files-table";
import { OrganizationFilesStoreProvider } from "#/features/organization-files/contexts/organizationFiles";
import { noop } from "#/helpers/utils";
import { useGoogleDriveConnection } from "#/hooks/fetch/use-fetch-all-database-connections";
import { useSyncConnection } from "#/hooks/mutation/use-sync-connection";
import {
	DatabaseConnectionType,
	type GoogleDriveDatabaseConnection,
} from "#/types/databases";
import { BackToDataManager } from "../../back-to-data-manager";
import { ShareConnectionToOtherOrgs } from "../../share-connection-to-other-orgs";
import { FolderNavigation } from "./folder-navigation";

function EditGoogleDriveConnection_() {
	const syncConnection = useSyncConnection<GoogleDriveDatabaseConnection>();
	const googleDriveDatabaseConnection = useGoogleDriveConnection();

	function handleSyncGoogleDrive() {
		if (syncConnection.isPending) return;

		syncConnection
			.mutateAsync({
				connection_type: DatabaseConnectionType.GoogleDrive,
				connection_id: googleDriveDatabaseConnection.id,
				reindex: true,
			})
			.catch(noop);
	}

	return (
		<div className="p-10 flex flex-col gap-5">
			<header className="flex w-full justify-between">
				<div className="flex items-center gap-4">
					<BackToDataManager />

					<span className="text-3xl font-bold w-full">
						Google Drive Connection
					</span>
				</div>

				<Button
					isLoading={syncConnection.isPending}
					onClick={handleSyncGoogleDrive}
					variant={ButtonVariant.PURPLE}
					className="w-fit"
				>
					Sync{syncConnection.isPending ? "ing" : ""} Google Drive
					{syncConnection.isPending ? "..." : ""}
				</Button>
			</header>

			<p className="font-bold">
				Name:{" "}
				<span className="font-normal">
					{googleDriveDatabaseConnection?.name}
				</span>
			</p>

			<hr className="border-border-smooth " />

			<div className="flex flex-col">
				<DefaultSuspenseAndErrorBoundary
					failedText="Something went wrong at 'Edit Google Drive Connection'!"
					fallbackFor="Edit Google Drive Connection"
				>
					<FolderNavigation />

					<FilesTable />

					<FileDetailsSheet />
				</DefaultSuspenseAndErrorBoundary>
			</div>

			<ShareConnectionToOtherOrgs
				connection={googleDriveDatabaseConnection}
				key={googleDriveDatabaseConnection.updated_at}
			/>
		</div>
	);
}

export function EditGoogleDrive() {
	return (
		<OrganizationFilesStoreProvider>
			<EditGoogleDriveConnection_ />
		</OrganizationFilesStoreProvider>
	);
}
