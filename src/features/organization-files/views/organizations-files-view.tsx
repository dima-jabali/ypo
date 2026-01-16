import { FileDetailsSheet } from "../components/file-details-sheet";
import { FilesTable } from "../components/files-table";
import {
  OrganizationFilesStoreProvider,
  useOrganizationFilesStore,
} from "../contexts/organizationFiles";
import { SearchResults } from "./search-results";

const OrganizationsFiles: React.FC = () => {
  const isShowingSearchResults = useOrganizationFilesStore().use.isShowingSearchResults();

  return (
    <>
      <header className="w-full flex flex-col gap-6 my-6">
        <h1 className="text-center text-2xl font-bold w-full">Organizations Files</h1>

        {/* <SearchComponent /> */}
      </header>

      <div className="p-10 pt-0">{isShowingSearchResults ? <SearchResults /> : <FilesTable />}</div>

      <FileDetailsSheet />
    </>
  );
};

export const OrganizationsFilesView: React.FC = () => (
  <OrganizationFilesStoreProvider>
    <OrganizationsFiles />
  </OrganizationFilesStoreProvider>
);
