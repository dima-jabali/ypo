import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { TagGroup, type TagGroupProps } from "#/components/tag-group";
import { NO_MORE_ITEMS_TO_SELECT } from "#/features/assign-to/base-project-form/base-project-form";
import {
  ChannelsToUseAsBotSourceSelector,
  type SelectedChannel,
} from "#/features/data-manager/edit/slack/channels-to-use-as-bot-source-selector";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import {
  useCreateBotSource,
  type CreateSlackBotSourceRequest,
} from "#/hooks/mutation/use-create-bot-source";
import {
  useUpdateBotSource,
  type UpdateSlackBotSourceByIdRequest,
} from "#/hooks/mutation/use-update-bot-source";
import {
  BotSourceFormAction,
  BotSourceType,
  type BotSource,
  type SlackBotSource,
} from "#/types/bot-source";
import {
  DatabaseConnectionType,
  type SlackChannel,
  type SlackChannelWithName,
  type SlackConnectionDataWithDefinedChannels,
} from "#/types/databases";
import {
  BOT_NAME_INPUT_NAME,
  BOT_SOURCE_DESCRIPTION_INPUT_NAME,
  EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
  editOrCreateSuccessToast,
  IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
  noBotNameToast,
} from "../../helpers";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type SlackEditFormProps = {
  action: BotSourceFormAction;
  source: SlackBotSource;
  setNextBotSources: React.Dispatch<React.SetStateAction<BotSource[]>>;
  closeDialog: () => void;
};

const isIndexableSlackChannel = (channel: SlackChannel): channel is SlackChannelWithName =>
  typeof channel.name === "string" && channel.should_index === true;

const DEFAULT_ALL_ALLOWED_SLACK_CHANNELS: SlackChannelWithName[] = [];

const isSlackBotSource = (botSource: BotSource): botSource is SlackBotSource =>
  botSource.source_type === BotSourceType.Slack;

export const SlackForm: React.FC<SlackEditFormProps> = ({
  action,
  source,
  setNextBotSources,
  closeDialog,
}) => {
  const [selectedChannels, setSelectedChannels] = useState<SelectedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlackConnections, setSelectedSlackConnections] = useState<
    SlackConnectionDataWithDefinedChannels[]
  >([]);

  const allDatabaseConnections = useFetchAllDatabaseConnections();
  const organizationId = generalContextStore.use.organizationId();
  const createBotSource = useCreateBotSource();
  const updateBotSource = useUpdateBotSource();

  const { botDatabaseConnections } = allDatabaseConnections.data;

  const allAllowedSlackChannels: SlackChannelWithName[] = useMemo(
    () =>
      botDatabaseConnections
        .find((db) => isSlackBotSource(source) && db.id === source.slack_connection_id)
        ?.channels.filter(isIndexableSlackChannel) ?? DEFAULT_ALL_ALLOWED_SLACK_CHANNELS,
    [botDatabaseConnections, source],
  );

  useEffect(() => {
    setSelectedChannels(source.slack_channels || []);
  }, [source.slack_channels]);

  async function handleSendSlackForm() {
    const [selectedSlackConnection] = selectedSlackConnections;

    if (isLoading) return;

    if (!selectedSlackConnection) {
      toast({
        title: "Please select a Slack connection!",
        variant: ToastVariant.Destructive,
      });

      return;
    }

    const form = document.getElementById(
      EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
    ) as HTMLFormElement | null;

    if (!form) return;

    const formData = new FormData(form);

    const rawIsBotSourceArchived = formData.get(IS_BOT_SOURCE_ARCHIVED_INPUT_NAME);
    const rawDescription = formData.get(BOT_SOURCE_DESCRIPTION_INPUT_NAME);
    const rawBotName = formData.get(BOT_NAME_INPUT_NAME);

    if (!rawBotName) {
      console.error("Error getting form entries", {
        rawDescription,
        formData,
        source,
      });

      return;
    }

    // Casting to string because we know it's a string:
    const botName = (rawBotName as string).trim();

    if (!botName) {
      noBotNameToast();

      return;
    }

    // Casting to string because we know it's a string:
    const description = (rawDescription as string).trim();

    console.log({
      rawIsBotSourceArchived,
      rawBotName,
      rawDescription,
      selectedSlackConnection,
    });

    const isBotSourceArchived = rawIsBotSourceArchived === "on";

    try {
      setIsLoading(true);

      let newBotSource: BotSource | undefined;

      if (action === BotSourceFormAction.Create) {
        const newBotSourceInfo: CreateSlackBotSourceRequest = {
          slack_channel_ids: selectedChannels.map((c) => c.id),
          slack_connection_id: selectedSlackConnection.id,
          add_to_bot_ids: source.bots.map((b) => b.id),
          source_type: source.source_type,
          organizationId,
          name: botName,
          description,
        };

        newBotSource = await createBotSource.mutateAsync(newBotSourceInfo);
      } else {
        const updatedBotSourceInfo: UpdateSlackBotSourceByIdRequest = {
          slack_channel_ids: selectedChannels.map((c) => c.id),
          slack_connection_id: selectedSlackConnection.id,
          archived: isBotSourceArchived,
          sourceId: source.id,
          organizationId,
          name: botName,
          description,
        };

        newBotSource = await updateBotSource.mutateAsync(updatedBotSourceInfo);
      }

      console.log("create or edit BotSource", { newBotSource });

      setNextBotSources((prev) => {
        if (!newBotSource) {
          return prev;
        }

        const index = prev.findIndex((s) => s.id === source.id);

        if (index === -1) {
          return [...prev, newBotSource];
        }

        const next = prev.with(index, newBotSource);

        return next;
      });

      editOrCreateSuccessToast(action);

      closeDialog();
    } finally {
      setIsLoading(false);
    }
  }

  let submitButtonText = "";

  if (isLoading) {
    if (action === BotSourceFormAction.Edit) {
      submitButtonText = "Saving...";
    } else {
      submitButtonText = "Creating...";
    }
  } else {
    if (action === BotSourceFormAction.Edit) {
      submitButtonText = "Save";
    } else {
      submitButtonText = "Create";
    }
  }

  return (
    <>
      {action === BotSourceFormAction.Edit ? (
        <ChannelsToUseAsBotSourceSelector
          refreshAvailableChannels={allDatabaseConnections.refetch}
          connectionType={DatabaseConnectionType.Slack}
          connectionId={source.slack_connection_id}
          setSelectedChannels={setSelectedChannels}
          allChannels={allAllowedSlackChannels}
          selectedChannels={selectedChannels}
          showRefreshButton={false}
          showSaveButton={false}
        />
      ) : (
        <label className="flex flex-col gap-1">
          <p className="pl-2 font-bold">Slack connection</p>

          <TagGroup
            renderRemovableItem={renderRemovableSlackConnectionItem}
            setSelectedValues={setSelectedSlackConnections}
            noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
            selectedValues={selectedSlackConnections}
            renderItem={renderSlackConnectionItem}
            allValues={botDatabaseConnections}
            placeholder="Search Slack connection"
            wrapperClassName="w-full"
            isMulti={false}
            withSearch
          />
        </label>
      )}

      <DialogFooter className="mr-2 h-full grow">
        <Button
          form={EDIT_OR_CREATE_BOT_SOURCE_FORM_ID}
          variant={ButtonVariant.SUCCESS}
          onClick={handleSendSlackForm}
          isLoading={isLoading}
          className="mt-auto"
          type="submit"
        >
          {submitButtonText}
        </Button>
      </DialogFooter>
    </>
  );
};

const renderRemovableSlackConnectionItem: TagGroupProps<SlackConnectionDataWithDefinedChannels>["renderRemovableItem"] =
  (item, index, handleRemoveSelectedValue) => (
    <div /* Selected item container */
      className="relative box-border flex w-min items-center justify-between gap-1 overflow-hidden rounded-sm bg-accent shadow-md shadow-black/15"
      key={item.id}
    >
      <p className="max-w-52 truncate whitespace-nowrap px-2" title={item.name || undefined}>
        {item.name}
      </p>

      <div /* Remove item button */
        className="h-full p-2 transition-none onfocus:bg-destructive/80 onfocus:text-primary"
        onClick={() => handleRemoveSelectedValue(index)}
        role="button"
      >
        <X className="size-4" />
      </div>
    </div>
  );

const renderSlackConnectionItem: TagGroupProps<SlackConnectionDataWithDefinedChannels>["renderItem"] =
  (item, handleAddSelectedValue) => (
    <div key={item.id}>
      <button
        className="w-full p-2 transition-none button-hover rounded"
        onPointerUp={() => handleAddSelectedValue(item)}
      >
        <span className="relative box-border flex w-min items-center justify-center overflow-hidden truncate whitespace-nowrap rounded-sm px-2 py-1">
          {item.name}
        </span>
      </button>
    </div>
  );
