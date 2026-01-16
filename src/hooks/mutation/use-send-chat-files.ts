import { useMutation } from "@tanstack/react-query";

import { type PromiseToWaitForFileToBeUploaded, droppedFiles } from "#/contexts/dropped-files";
import {
  generalContextStore,
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import {
  TITLE_YOUR_BLOCK,
  createISODate,
  createNotebookBlockUuid,
  getRandomSnakeCaseName,
  isValidNumber,
  shouldNeverHappen,
} from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import { queryKeyFactory } from "#/hooks/query-keys";
import {
  type BlockBase,
  type BlockCsv,
  type BlockImage,
  BlockLabel,
  BlockObjectType,
  type BlockPDF,
  BlockType,
  type CreateBlockAction,
  NotebookActionType,
} from "#/types/notebook";
import type { ISODateString } from "#/types/general";

type SendChatFilesRequest = {
  files: Array<File>;
};

const mutationKey = queryKeyFactory.post["send-chat-files"].queryKey;

export function useSendChatFiles() {
  const patchNotebookBlocks = usePatchNotebookBlocks();
  const botConversationId = useWithBotConversationId();
  const betterbrainUser = useFetchBetterbrainUser();
  const organizationId = useWithOrganizationId();

  return useMutation<null, Error, SendChatFilesRequest>({
    mutationKey,

    mutationFn: async (args) => {
      if (args.files.length === 0) return null;

      /*
			We need to create blocks in the normal project.
			The response from the websockets will create the blocks.
			The new blocks will go through the process of initialization
			and encounter a file in the `droppedFiles`, which will fire
			the needed steps to upload the file and run it.
			*/

      const { getNotebook, notebookId } = generalContextStore.getState();

      if (!isValidNumber(notebookId)) {
        shouldNeverHappen("Notebook id not valid!");
      }

      const notebook = getNotebook(notebookId);

      if (!notebook) {
        shouldNeverHappen("Notebook not found!");
      }

      const promisesToWaitForFilesToBeUploaded: Array<PromiseToWaitForFileToBeUploaded> = [];

      const createBlockActions = (() => {
        let blockIndex = notebook.blocks.length;

        const uuidForNewBlocks = args.files.map(() => ({
          uuid: createNotebookBlockUuid(),
        }));
        const blocks = notebook.blocks.map(({ uuid }) => ({ uuid })).concat(...uuidForNewBlocks);

        blockIndex = notebook.blocks.length;

        const newBlocks = args.files.map((file, fileIndex) => {
          const now = new Date();
          const nowISO = now.toISOString() as ISODateString;
          const isImageBlock = file.type.startsWith("image/");
          const isCSVBlock = file.type === "text/csv";
          const blockAbove = blocks[blockIndex - 1];
          const blockBelow = blocks[blockIndex + 1];

          const baseBlock: BlockBase = {
            write_variables: [{ name: getRandomSnakeCaseName() }],
            label: isCSVBlock ? BlockLabel.CSV : BlockLabel.PDF,
            // @ts-expect-error => this is just so it is accessible later in this code:
            block_below_uuid: blockBelow?.uuid ?? null,
            block_above_uuid: blockAbove?.uuid ?? null,
            uuid: uuidForNewBlocks[fileIndex]!.uuid,
            order_by_timestamp_ms: now.getTime(),
            last_modified_by: betterbrainUser,
            object: BlockObjectType.Block,
            last_run_by: betterbrainUser,
            created_by: betterbrainUser,
            last_modified_at: nowISO,
            parent_block_uuid: null,
            last_run_at: nowISO,
            similar_queries: [],
            created_at: nowISO,
            read_variables: [],
            is_running: false,
            id: undefined,
          };

          const block = (() => {
            if (isCSVBlock) {
              const csvBlock: BlockCsv = {
                ...baseBlock,
                type: BlockType.Csv,

                custom_block_info: {
                  data_preview_updated_at: null,
                  is_data_preview_stale: false,
                  file_size_bytes: file.size,
                  title: TITLE_YOUR_BLOCK,
                  file_name: file.name,
                  data_preview: null,
                  filters: null,
                  file_info: "",
                },
              };

              return csvBlock;
            } else if (isImageBlock) {
              const imageBlock: BlockImage = {
                ...baseBlock,
                type: BlockType.Image,

                custom_block_info: {
                  title: TITLE_YOUR_BLOCK,
                  preview_url: null,
                  aws_bucket: null,
                  aws_key: null,
                  caption: null,
                },
              };

              return imageBlock;
            } else {
              const pdfBlock: BlockPDF = {
                ...baseBlock,
                type: BlockType.Pdf,

                custom_block_info: {
                  title: TITLE_YOUR_BLOCK,
                  pdf: {
                    file_size_bytes: `${file.size}`,
                    file_name: file.name,
                    file_info: file.type,
                    type: "pdf",
                  },
                },
              };

              return pdfBlock;
            }
          })();

          if (!block) return null;

          {
            // We need to make sure `droppedFiles` has the files for the new
            // blocks, so they can upload the files to the backend:

            const promiseToWaitForFileToBeUploaded = {} as PromiseToWaitForFileToBeUploaded;

            const promise = new Promise<void>((resolve, reject) => {
              promiseToWaitForFileToBeUploaded.resolve = resolve;
              promiseToWaitForFileToBeUploaded.reject = reject;
            });
            promiseToWaitForFileToBeUploaded.promise = promise;
            promisesToWaitForFilesToBeUploaded.push(promiseToWaitForFileToBeUploaded);

            droppedFiles.set(block.uuid, {
              promiseToWaitForFileToBeUploaded,
              file,
            });
          }

          ++blockIndex;

          return block;
        });

        console.log({ droppedFiles });

        const createActions: Array<CreateBlockAction> = newBlocks
          .map((newBlock) =>
            newBlock
              ? ({
                  action_type: NotebookActionType.CreateBlock,
                  action_info: {
                    order_by_timestamp_ms: newBlock.order_by_timestamp_ms ?? null,
                    block_above_uuid: newBlock.block_above_uuid,
                    // @ts-expect-error => this is where we are accessing `block_below_uuid`
                    block_below_uuid: newBlock.block_below_uuid,
                    parent_block_uuid: null,
                    block: newBlock,
                  },
                  timestamp: createISODate(),
                } satisfies CreateBlockAction)
              : false,
          )
          .filter(Boolean) as Array<CreateBlockAction>;

        return createActions;
      })();

      await patchNotebookBlocks.mutateAsync({
        notebookId: notebook.metadata.id,
        updates: createBlockActions,
        timestamp: createISODate(),
        botConversationId,
        organizationId,
      });

      await Promise.allSettled(promisesToWaitForFilesToBeUploaded.map((p) => p.promise));

      return null;
    },

    meta: {
      errorTitle: "Error sending chat files!",
    },
  });
}
