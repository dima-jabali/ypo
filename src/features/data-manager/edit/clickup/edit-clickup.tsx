import { useLayoutEffect, useRef, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Switch } from "#/components/switch";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { useClickupConnection } from "#/hooks/fetch/use-fetch-all-database-connections";
import {
  useSyncClickUp,
  type ClickUpConnectionFieldsUpdate,
} from "#/hooks/mutation/use-sync-clickup";
import { DatabaseConnectionType } from "#/types/databases";
import { ShareConnectionToOtherOrgs } from "../../share-connection-to-other-orgs";
import { Tree } from "./tree";
import { BackToDataManager } from "../../back-to-data-manager";

export function EditClickUp() {
  const [shouldIndexEverythingDocs, setShouldIndexEverythingDocs] = useState(false);
  const [isSyncingClickUp, setIsSyncingClickUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updatesRef = useRef<Array<ClickUpConnectionFieldsUpdate>>([]);

  const clickUpDatabaseConnection = useClickupConnection();
  const syncClickUp = useSyncClickUp().mutateAsync;

  useLayoutEffect(() => {
    setShouldIndexEverythingDocs(clickUpDatabaseConnection?.index_everything_documents ?? false);
  }, [clickUpDatabaseConnection?.index_everything_documents]);

  async function handleSaveWithoutSync() {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const updates = [...updatesRef.current];

      await syncClickUp({
        index_everything_documents: shouldIndexEverythingDocs,
        connection_type: DatabaseConnectionType.ClickUp,
        connection_id: clickUpDatabaseConnection.id,
        reindex: false,
        updates,
      });

      toast({
        title: "ClickUp's connection saved successfully",
        variant: ToastVariant.Success,
      });
    } catch (error) {
      console.error("Error saving ClickUp configuration:", error);

      toast({
        title: "Error saving ClickUp configuration",
        description: getErrorMessage(error),
        variant: ToastVariant.Destructive,
      });
    } finally {
      setIsSaving(false);

      updatesRef.current.length = 0;
    }
  }

  async function handleSyncClickUp() {
    if (isSyncingClickUp) return;

    setIsSyncingClickUp(true);

    const updates = [...updatesRef.current];

    updatesRef.current.length = 0;

    await syncClickUp({
      index_everything_documents: shouldIndexEverythingDocs,
      connection_type: DatabaseConnectionType.ClickUp,
      connection_id: clickUpDatabaseConnection.id,
      reindex: true,
      updates,
    }).finally(() => {
      setIsSyncingClickUp(false);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-center gap-6">
        <BackToDataManager />

        <span className="text-3xl font-bold w-full">ClickUp Connection</span>
      </div>

      <p className="font-bold">
        Name: <span className="font-normal">{clickUpDatabaseConnection.name}</span>
      </p>

      <section className="rounded-3xl bg-black/20 flex flex-col gap-4">
        <fieldset className="flex gap-4 items-center p-4 pb-0">
          <label htmlFor="index-everything-docs" className="text-sm">
            Index Everything docs
          </label>

          <Switch
            onCheckedChange={setShouldIndexEverythingDocs}
            checked={shouldIndexEverythingDocs}
            id="index-everything-docs"
          />
        </fieldset>

        <hr className="border-border-smooth " />

        <fieldset className="flex flex-col gap-2 p-4 pt-0">
          <label className="text-sm">Select which workspaces to index:</label>

          <Tree
            clickUpDatabaseConnection={clickUpDatabaseConnection}
            key={clickUpDatabaseConnection.updated_at}
            updatesRef={updatesRef}
          />
        </fieldset>
      </section>

      <div className="flex gap-4">
        <Button
          variant={ButtonVariant.PURPLE}
          isLoading={isSyncingClickUp}
          onClick={handleSyncClickUp}
          className="w-fit"
        >
          Sync{isSyncingClickUp ? "ing" : ""} ClickUp
          {isSyncingClickUp ? "..." : ""}
        </Button>

        <Button
          variant={ButtonVariant.DEFAULT}
          onClick={handleSaveWithoutSync}
          isLoading={isSaving}
          className="w-fit"
        >
          Sav{isSaving ? "ing" : "e"} without syncing
          {isSaving ? "..." : ""}
        </Button>

        <ShareConnectionToOtherOrgs
          key={clickUpDatabaseConnection.updated_at}
          connection={clickUpDatabaseConnection}
        />
      </div>
    </div>
  );
}
