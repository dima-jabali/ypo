import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import {
  generalContextStore,
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { createISODate, createNotebookBlockUuid, getRandomSnakeCaseName } from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useDownloadedNotebookId, useNotebookBlocks } from "#/hooks/fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import {
  BlockLabel,
  BlockObjectType,
  BlockType,
  NotebookActionType,
  SqlBlockSourceType,
  type NotebookBlockUuid,
  type SimilarQuery,
} from "#/types/notebook";
import { Ellipsis, ExternalLink, FileDiffIcon, Plus } from "lucide-react";
import { getQueryUrl, type getUserInfo } from "./helper-jsxs";
import { scrollBlockIntoView } from "./helpers";

type Props = {
  userInfo: ReturnType<typeof getUserInfo>;
  query: SimilarQuery["query"];
  blockUUID: NotebookBlockUuid;
};

export function ThreeDotsPopover({ blockUUID, userInfo, query }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const patchNotebookBlocks = usePatchNotebookBlocks();
  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId();
  const notebookBlocks = useNotebookBlocks();
  const user = useFetchBetterbrainUser();

  function handleCreateBlockInCurrentProject() {
    setIsOpen(false);

    const blockAboveUuid = notebookBlocks.at(-1)?.uuid || null;
    const uuid = createNotebookBlockUuid();
    const timestamp = createISODate();

    patchNotebookBlocks.mutate({
      botConversationId,
      organizationId,
      notebookId,
      timestamp,
      updates: [
        {
          action_type: NotebookActionType.CreateBlock,
          timestamp,
          action_info: {
            block: {
              custom_block_info: {
                source_type: SqlBlockSourceType.Integration,
                command: query.prompt,
                query: query.answer,
                title: "",
                source_integration: {
                  type: query.connection_type,
                  id: query.connection_id,
                },
              },
              write_variables: [{ name: getRandomSnakeCaseName() }],
              block_above_uuid: blockAboveUuid,
              object: BlockObjectType.Block,
              last_modified_at: timestamp,
              label: BlockLabel.SQLE,
              parent_block_uuid: null,
              last_modified_by: user,
              created_at: timestamp,
              similar_queries: [],
              type: BlockType.Sql,
              is_running: false,
              last_run_at: null,
              last_run_by: null,
              created_by: user,
              id: undefined,
              uuid,
            },
            order_by_timestamp_ms: new Date().getTime(),
            block_above_uuid: blockAboveUuid,
            is_description_block: false,
            parent_block_uuid: null,
            block_below_uuid: null,
          },
        },
      ],
    });

    scrollBlockIntoView(uuid);
  }

  function handleViewSideBySide() {
    setIsOpen(false);

    scrollBlockIntoView(blockUUID);

    generalContextStore.setState({
      blockDiffEditor: {
        blockUuid: blockUUID,
        value: query.answer,
      },
    });

    return;
  }

  function handleOpenProject() {
    // setCurrentNotebookMode(NotebookMode.Notebook);
  }

  const href = getQueryUrl(query);
  const isUrlExternal = href?.startsWith("http");
  let urlJSX;

  if (href) {
    if (isUrlExternal) {
      urlJSX = (
        <a
          className="box-border flex w-full cursor-pointer items-center justify-start gap-2 rounded-sm px-2 py-1 text-sm tracking-wider text-primary outline-hidden transition-[background-color] duration-100 onfocus:bg-button-hover active:brightness-200 [&_svg]:h-[0.92rem] [&_svg]:w-[0.92rem]"
          rel="noreferrer"
          target="_blank"
          href={href}
        >
          <ExternalLink className="size-4 fill-primary" />

          <p>Open project in new tab</p>
        </a>
      );
    } else if (userInfo) {
      urlJSX = (
        <button
          className="box-border flex w-full cursor-pointer items-center justify-start gap-2 rounded-sm px-2 py-1 text-sm tracking-wider text-primary outline-hidden transition-[background-color] duration-100 onfocus:bg-button-hover active:brightness-200 [&_svg]:h-[0.92rem] [&_svg]:w-[0.92rem]"
          title="Will open in a new tab"
          onClick={() => handleOpenProject()}
        >
          <ExternalLink className="size-4 fill-primary" />

          <p>Open project</p>
        </button>
      );
    }
  }
  // We can't really open it on another tab at the moment because notebookId is saved on local storage, so it would change it on the current tab as well.
  urlJSX = null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="flex cursor-pointer items-center justify-center gap-1 rounded-sm p-1 outline-hidden button-hover"
        title="More options"
      >
        <Ellipsis className="size-5 fill-primary" />
      </PopoverTrigger>

      <PopoverContent className="flex gap-1 flex-col" side="top">
        {urlJSX}

        <button
          className="flex items-center justify-start py-1 px-2 rounded-sm button-hover gap-2"
          onClick={handleCreateBlockInCurrentProject}
        >
          <Plus className="size-4 stroke-primary" />

          <p>Create block in current project</p>
        </button>

        <button
          className="flex items-center justify-start py-1 px-2 rounded-sm button-hover gap-2"
          onClick={handleViewSideBySide}
        >
          <FileDiffIcon className="size-4 stroke-primary" />

          <p>View side-by-side</p>
        </button>
      </PopoverContent>
    </Popover>
  );
}
