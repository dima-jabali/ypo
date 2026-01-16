import { useOrganizationFilesStore } from "#/features/organization-files/contexts/organizationFiles";
import { useFetchAllOrganizationFilesPage } from "#/hooks/fetch/use-fetch-organization-files";
import { matchIcon } from "#/icons/match-icon";
import type { GoogleDriveFileId } from "#/types/notebook";

export function FolderNavigation() {
  const googleDriveConnectionId = useOrganizationFilesStore().use.googleDriveConnectionId();
  const googleDriveParentId = useOrganizationFilesStore().use.googleDriveParentId();
  const organizationFilesStore = useOrganizationFilesStore();
  const orgFiles = useFetchAllOrganizationFilesPage();

  // @ts-expect-error => parents are present on Google Drive files:
  const filesParents = orgFiles.results[0]?.parents as Array<GoogleDriveFileId> | undefined;
  const upParent = filesParents?.at(-2);

  const isRoot = !googleDriveParentId && (!filesParents || filesParents.length === 0);
  const canGoUpAFolder = !isRoot;

  return (
    <header className="flex w-full">
      <button
        className="aria-disabled:pointer-events-none aria-disabled:opacity-50 rounded-full p-2 pr-3 button-hover flex items-center gap-2 text-sm"
        aria-disabled={!canGoUpAFolder}
        title="Go up a folder"
        onClick={() => {
          organizationFilesStore.setState({
            ...organizationFilesStore.getInitialState(),
            googleDriveParentId: upParent || null,
            googleDriveConnectionId,
          });
        }}
      >
        {matchIcon("back")}

        <span className="">Go up a folder</span>
      </button>
    </header>
  );
}
