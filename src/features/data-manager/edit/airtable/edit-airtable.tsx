import { Button, ButtonVariant } from "#/components/Button";
import { noop } from "#/helpers/utils";
import { useAirtableConnection } from "#/hooks/fetch/use-fetch-all-database-connections";
import { useSyncConnection } from "#/hooks/mutation/use-sync-connection";
import { DatabaseConnectionType, type AirtableDatabaseConnection } from "#/types/databases";
import { BackToDataManager } from "../../back-to-data-manager";
import { ShareConnectionToOtherOrgs } from "../../share-connection-to-other-orgs";
import { AirtableBasesTable } from "./airtable-bases-table";

export function EditAirtable() {
  const syncConnection = useSyncConnection<AirtableDatabaseConnection>();
  const airtableDatabaseConnection = useAirtableConnection();

  function handleSyncAirtable() {
    if (syncConnection.isPending) return;

    syncConnection
      .mutateAsync({
        connection_type: DatabaseConnectionType.Airtable,
        connection_id: airtableDatabaseConnection.id,
        reindex: true,
      })
      .catch(noop);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-center gap-6">
        <BackToDataManager />

        <span className="text-3xl font-bold w-full">Airtable Connection</span>
      </div>

      <p className="font-bold">
        Name: <span className="font-normal">{airtableDatabaseConnection?.name}</span>
      </p>

      <hr className="border-border-smooth " />

      <Button
        isLoading={syncConnection.isPending}
        variant={ButtonVariant.PURPLE}
        onClick={handleSyncAirtable}
        className="w-fit"
      >
        Sync{syncConnection.isPending ? "ing" : ""} Airtable
        {syncConnection.isPending ? "..." : ""}
      </Button>

      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <p className="text-3xl font-bold">Tables</p>
        </header>

        <AirtableBasesTable connection={airtableDatabaseConnection} />
      </div>

      <ShareConnectionToOtherOrgs
        key={airtableDatabaseConnection.updated_at}
        connection={airtableDatabaseConnection}
      />
    </div>
  );
}
