import { useEffect, useMemo, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
  slackChannelWithName,
  useFetchAllDatabaseConnections,
  useSlackConnection,
} from "#/hooks/fetch/use-fetch-all-database-connections";
import { useUpdateIntegration } from "#/hooks/mutation/use-update-integration";
import { DatabaseConnectionType, type SlackChannelWithName } from "#/types/databases";
import { ShareConnectionToOtherOrgs } from "../../share-connection-to-other-orgs";
import { BotsTable } from "./bots-table";
import { CreateBotDialog } from "./create-bot-dialog";
import { ChannelsToUseAsBotSourceSelector } from "./channels-to-use-as-bot-source-selector";
import { BackToDataManager } from "../../back-to-data-manager";

export function EditSlack() {
  const fetchAllDatabaseConnectionsQuery = useFetchAllDatabaseConnections();
  const {
    // fetchAllDatabaseConnectionsQuery,
    // allBotSourcesQuery,
    // allBotsQuery,
    alreadySelectedChannels,
    slackConnection,
  } = useSlackConnection();

  const [selectedChannels, setSelectedChannels] = useState(alreadySelectedChannels);

  const allAllowedSlackChannels: SlackChannelWithName[] = useMemo(
    () => slackConnection.channels.filter(slackChannelWithName) ?? [],
    [slackConnection.channels],
  );

  const updateIntegration = useUpdateIntegration<DatabaseConnectionType.Slack>();

  useEffect(() => {
    setSelectedChannels(alreadySelectedChannels);
  }, [alreadySelectedChannels]);

  const lastSynced = slackConnection.last_indexed
    ? new Date(slackConnection.last_indexed).toUTCString()
    : null;

  const handleSyncSlackMessages = async () => {
    try {
      await updateIntegration.mutateAsync({
        connection_type: DatabaseConnectionType.Slack,
        // Using `!` cause we assured above:
        connection_id: slackConnection.id,
        reindex: true,
      });

      toast({
        description: "A bot is now syncing your messages.",
        title: "Messages are syncing...",
        variant: ToastVariant.Success,
      });
    } catch (error) {
      console.error("Error syncing messages:", error);

      toast({
        description: "Error on request. Please, try again. If the issue persists, contact support.",
        variant: ToastVariant.Destructive,
        title: "Error syncing messages!",
      });
    }
  };

  return (
    <div className="flex gap-10 flex-col">
      <div className="flex items-center justify-between gap-4">
        <BackToDataManager />

        <span className="text-3xl font-bold w-full">Slack Connection</span>
      </div>

      <p className="pl-2 font-bold">
        Name: <span className="font-normal">{slackConnection?.name}</span>
      </p>

      <ChannelsToUseAsBotSourceSelector
        refreshAvailableChannels={fetchAllDatabaseConnectionsQuery.refetch}
        key={fetchAllDatabaseConnectionsQuery.dataUpdatedAt}
        connectionType={DatabaseConnectionType.Slack}
        setSelectedChannels={setSelectedChannels}
        allChannels={allAllowedSlackChannels}
        selectedChannels={selectedChannels}
        connectionId={slackConnection.id}
        showRefreshButton
      />

      <hr className="my-16 border-border-smooth " />

      <Button
        isLoading={updateIntegration.isPending}
        onClick={handleSyncSlackMessages}
        variant={ButtonVariant.PURPLE}
        className="w-fit"
      >
        Sync{updateIntegration.isPending ? "ing" : ""} messages
        {updateIntegration.isPending ? "..." : ""}
      </Button>

      <p className="mt-5">Last synced: {lastSynced}</p>

      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <span className="text-3xl font-bold">Bots</span>

          <CreateBotDialog connection={slackConnection} />
        </header>

        <BotsTable connection={slackConnection} />
      </div>

      <ShareConnectionToOtherOrgs connection={slackConnection} key={slackConnection.updated_at} />
    </div>
  );
}
