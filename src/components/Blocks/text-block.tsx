import { classNames } from "#/helpers/class-names";
import { createISODate } from "#/helpers/utils";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import {
  BlockLabel,
  NotebookActionType,
  UpdateBlockActionKey,
  type BlockText,
} from "#/types/notebook";
import { memo, useRef } from "react";
import { AddBlockBelowButton } from "./add-block-below-button";
import { Separator } from "../separator";
import { DeleteBlockFloatingButton } from "../delete-block-floating-button";
import {
  generalContextStore,
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";

const INPUT_CLASSNAMES = {
  [BlockLabel.BLOCKQUOTE]: "min-h-[2.4lh] p-4 my-4 border-s-4 italic border-gray-500 bg-primary/10",
  [BlockLabel.PARAGRAPH]: "leading-7 [&:not(:first-child)]:mt-6",

  [BlockLabel.H1]: "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
  [BlockLabel.H2]: "scroll-m-20 text-3xl font-bold tracking-tight first:mt-0",
  [BlockLabel.H3]: "scroll-m-20 text-2xl font-bold tracking-tight",
  [BlockLabel.H4]: "scroll-m-20 text-xl font-bold tracking-tight",
  [BlockLabel.H5]: "text-base font-bold",
  [BlockLabel.H6]: "text-sm font-bold",
} as const;

const PLACEHOLDERS = {
  [BlockLabel.BLOCKQUOTE]: "Blockquote",
  [BlockLabel.PARAGRAPH]: "Type a paragraph...",

  [BlockLabel.H1]: "H1",
  [BlockLabel.H2]: "H2",
  [BlockLabel.H3]: "H3",
  [BlockLabel.H4]: "H4",
  [BlockLabel.H5]: "H5",
  [BlockLabel.H6]: "H6",
};

export const TextBlock = memo(function TextBlock({ textBlock }: { textBlock: BlockText }) {
  const isNotebookMode = generalContextStore.use.isNotebookMode();
  const patchNotebookBlocks = usePatchNotebookBlocks();
  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId();

  const timerToSave = useRef<NodeJS.Timeout | undefined>(undefined);

  const label = (textBlock.label ||
    textBlock.custom_block_info?.text_type.toLowerCase()) as keyof typeof INPUT_CLASSNAMES;
  const text = textBlock.custom_block_info?.plain_text ?? "";

  if (textBlock.label === BlockLabel.HR) {
    return <Separator />;
  }

  function handleOnChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    clearTimeout(timerToSave.current);

    const newValue = e.target.value;

    timerToSave.current = setTimeout(() => {
      handleSave(newValue);
    }, 2_000);
  }

  function handleSave(newTextValue: string) {
    if (patchNotebookBlocks.isPending) {
      clearTimeout(timerToSave.current);

      timerToSave.current = setTimeout(() => {
        handleSave(newTextValue);
      }, 2_000);

      return;
    }

    patchNotebookBlocks.mutate({
      timestamp: createISODate(),
      botConversationId,
      organizationId,
      notebookId,
      updates: [
        {
          action_type: NotebookActionType.UpdateBlock,
          action_info: {
            key: UpdateBlockActionKey.PlainText,
            block_uuid: textBlock.uuid,
            value: newTextValue,
          },
        },
      ],
    });
  }

  return (
    <div
      data-delete-block-before={isNotebookMode}
      className="flex flex-col group/block"
      id={textBlock.uuid}
    >
      <textarea
        className={classNames(
          "field-sizing-content resize-none w-full min-h-[1lh] focus-visible:outline-0 placeholder:opacity-50 no-ring overflow-hidden disabled:opacity-50 group-[.chat]/chat:text-right group-[.chat]/chat:pr-10",
          INPUT_CLASSNAMES[label],
        )}
        disabled={patchNotebookBlocks.isPending}
        placeholder={PLACEHOLDERS[label]}
        onChange={handleOnChange}
        defaultValue={text}
        tabIndex={0}
      />

      <AddBlockBelowButton blockAboveUuid={textBlock.uuid} />

      <DeleteBlockFloatingButton blockUuid={textBlock.uuid} />
    </div>
  );
});
