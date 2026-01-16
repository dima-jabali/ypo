import { DialogClose } from "@radix-ui/react-dialog";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Checkbox } from "#/components/Checkbox";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "#/components/Dialog";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/select";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { DBConnectionModalContent } from "#/features/data-manager/db-connection-modal/db-connection-modal";
import { FolderNavigation } from "#/features/data-manager/edit/google-drive/folder-navigation";
import { FilesTable } from "#/features/organization-files/components/files-table";
import { useOrganizationFilesStore } from "#/features/organization-files/contexts/organizationFiles";
import { getErrorMessage, isValidNumber, preventDefault } from "#/helpers/utils";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import {
  useCreateBotSource,
  type CreateGoogleDriveBotSourceRequest,
} from "#/hooks/mutation/use-create-bot-source";
import {
  useUpdateBotSource,
  type UpdateGoogleDriveBotSourceByIdRequest,
} from "#/hooks/mutation/use-update-bot-source";
import {
  BotSourceFormAction,
  BotSourceType,
  type BotSource,
  type GoogleDriveBotSource,
} from "#/types/bot-source";
import { DatabaseConnectionType, type GoogleDriveDatabaseConnectionId } from "#/types/databases";
import {
  BOT_NAME_INPUT_NAME,
  BOT_SOURCE_DESCRIPTION_INPUT_NAME,
  EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
  editOrCreateSuccessToast,
  IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
  noBotNameToast,
} from "../../helpers";

type Props = {
  source: GoogleDriveBotSource;
  action: BotSourceFormAction;
  setNextBotSources: React.Dispatch<React.SetStateAction<BotSource[]>>;
  closeDialog: () => void;
};

export function GoogleForm({ source, action, setNextBotSources, closeDialog }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const organizationFilesStore = useOrganizationFilesStore();
  const googleDriveConnectionId = organizationFilesStore.use.googleDriveConnectionId();
  const fetchAllDatabaseConnectionsQuery = useFetchAllDatabaseConnections();
  const selectedFolders = organizationFilesStore.use.selectedFiles();
  const organizationId = useWithOrganizationId();
  const updateBotSource = useUpdateBotSource();
  const createBotSource = useCreateBotSource();

  const { googleDriveDatabases } = fetchAllDatabaseConnectionsQuery.data;

  useEffect(() => {
    organizationFilesStore.setState({
      googleDriveConnectionId: isValidNumber(source.google_drive_connection_id)
        ? source.google_drive_connection_id
        : null,
    });
  }, [source.google_drive_connection_id, organizationFilesStore]);

  async function handleCreateOrEditGoogleDriveBotSource() {
    if (!isValidNumber(googleDriveConnectionId)) {
      console.error(
        "Error getting Google Drive connection ID when trying to create Google Drive bot source.",
      );

      return;
    }

    const form = document.getElementById(
      EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
    ) as HTMLFormElement | null;

    if (!form) {
      console.error("Form not found when trying to create Google Drive bot source.");

      return;
    }

    const formData = new FormData(form);

    console.log({
      ...Object.fromEntries(formData.entries()),
    });

    const rawIsBotSourceArchived = formData.get(IS_BOT_SOURCE_ARCHIVED_INPUT_NAME);
    const rawDescription = formData.get(BOT_SOURCE_DESCRIPTION_INPUT_NAME);
    const rawDirectChildrenOnly = formData.get("direct_children_only");
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
      description,
      source,
    });

    // Casting here because we know it's `"on" | undefined`:
    const isBotSourceArchived = rawIsBotSourceArchived === "on";
    const directChildrenOnly = rawDirectChildrenOnly === "on";

    try {
      setIsLoading(true);

      let newBotSource: BotSource | undefined;

      if (action === BotSourceFormAction.Create) {
        const newBotSourceInfo: CreateGoogleDriveBotSourceRequest = {
          google_drive_folder_ids: [...selectedFolders.values().map((folder) => folder.id)],
          google_drive_connection_id: googleDriveConnectionId,
          direct_children_only: directChildrenOnly,
          source_type: BotSourceType.GoogleDrive,
          add_to_bot_ids: [],
          organizationId,
          name: botName,
          description,
        };

        console.log({
          newBotSourceInfo,
        });

        newBotSource = await createBotSource.mutateAsync(newBotSourceInfo);
      } else {
        const updatedBotSourceInfo: UpdateGoogleDriveBotSourceByIdRequest = {
          google_drive_folder_ids: [...selectedFolders.values().map((folder) => folder.id)],
          google_drive_connection_id: googleDriveConnectionId,
          direct_children_only: directChildrenOnly,
          archived: isBotSourceArchived,
          sourceId: source.id,
          organizationId,
          name: botName,
          description,
        };

        newBotSource = await updateBotSource.mutateAsync(updatedBotSourceInfo);
      }

      console.log("created or edited BotSource", { newBotSource });

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
    } catch (error) {
      const msg = `Error ${action === BotSourceFormAction.Create ? "creating" : "editing"} bot source!`;
      console.error(msg, error);

      toast({
        description: getErrorMessage(error),
        variant: ToastVariant.Destructive,
        title: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <fieldset className="flex flex-col gap-1">
        <label className="font-semibold text-sm">Google Drive connection</label>

        <Select
          onValueChange={(dbIdAsString) => {
            const newValue = Number(dbIdAsString || undefined) as GoogleDriveDatabaseConnectionId;
            const isValid = isValidNumber(newValue);

            if (!isValid) return;

            organizationFilesStore.setState({
              googleDriveConnectionId: isValid ? newValue : null,
            });
          }}
          value={`${googleDriveConnectionId}`}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="capitalize" />
          </SelectTrigger>

          <SelectContent className="z-110">
            {googleDriveDatabases.map((db) => (
              <SelectItem
                className="capitalize flex items-center justify-between w-full gap-4"
                value={`${db.id}`}
                key={db.id}
              >
                <span>{db.name}</span>

                <span className="text-xs text-muted group-hover:text-accent-foreground">
                  ({db.id})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CreateGoogleDriveConnection />
      </fieldset>

      <SelectGoogleDriveFolders />

      <DialogFooter className="mr-2 h-full grow">
        <Button
          onClick={handleCreateOrEditGoogleDriveBotSource}
          form={EDIT_OR_CREATE_BOT_SOURCE_FORM_ID}
          variant={ButtonVariant.SUCCESS}
          isLoading={isLoading}
          className="mt-auto"
          type="button"
        >
          {action}
        </Button>
      </DialogFooter>
    </>
  );
}

function CreateGoogleDriveConnection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="mt-1" size="sm">
          Create Google Drive connection
        </Button>
      </DialogTrigger>

      <DialogContent
        className="z-120 h-[90vh] simple-scrollbar"
        onPointerDownOutside={preventDefault}
        overlayClassName="z-120"
      >
        <DBConnectionModalContent
          dbToCreate={DatabaseConnectionType.GoogleDrive}
          attemptToConnectStatus={undefined}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}

function SelectGoogleDriveFolders() {
  const [isOpen, setIsOpen] = useState(false);

  const organizationFilesStore = useOrganizationFilesStore();
  const selectedFolders = organizationFilesStore.use.selectedFiles();
  const googleDriveConnectionId = organizationFilesStore.use.googleDriveConnectionId();

  const hasSelectedConn = isValidNumber(googleDriveConnectionId);

  console.log({ hasSelectedConn, googleDriveConnectionId });

  function onOpenChange(newIsOpen: boolean) {
    setIsOpen(newIsOpen);
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <label className="font-semibold text-sm">Google Drive folders</label>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <div className="flex items-center justify-between gap-4">
          <DialogTrigger
            className="flex items-center w-[50%] text-sm border border-border-smooth rounded py-2 px-2 justify-between gap-2 button-hover disabled:pointer-events-none disabled:opacity-50"
            disabled={!hasSelectedConn}
          >
            <span>
              {selectedFolders.size > 0
                ? `${selectedFolders.size} selected`
                : hasSelectedConn
                  ? "Select folders"
                  : "Select connection first"}
            </span>

            <ChevronDown className="size-4 stroke-1 flex-none" />
          </DialogTrigger>

          <fieldset>
            <label className="text-sm flex items-center gap-2 select-none">
              <Checkbox name="direct_children_only" className="size-4" />

              <span>Direct children only</span>
            </label>
          </fieldset>
        </div>

        <DialogContent
          className="z-110 md:max-w-[80vw] w-[80vw]"
          onPointerDownOutside={preventDefault}
          overlayClassName="z-110"
        >
          <DefaultSuspenseAndErrorBoundary
            fallbackFor="SelectGoogleDriveFolders"
            failedText="Something went wrong!"
          >
            <FolderNavigation />

            <FilesTable />

            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DefaultSuspenseAndErrorBoundary>
        </DialogContent>
      </Dialog>
    </fieldset>
  );
}
