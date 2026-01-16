import { ChevronRight } from "lucide-react";

import { AddBlockBelowButton } from "#/components/Blocks/add-block-below-button";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { renderBotConversationMessage } from "#/components/msgs/render-bot-conversation-message";
import { renderNotebookBlock } from "#/components/msgs/render-notebook-block";
import { handleDragEnter, handleDragLeave, handleDragOver } from "#/helpers/blocks";
import { CHAT_MESSAGE_LIST_HTML_ELEMENT_ID } from "#/helpers/utils";
import { useNormalizedMessages } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { useIsThereAnyBlock, useSortedNotebookBlocks } from "#/hooks/fetch/use-fetch-notebook";
import { useSendChatFiles } from "#/hooks/mutation/use-send-chat-files";
import { Slash } from "./components/slash-plugin/slash";
import { ToolBar } from "./components/toolbar";

export function Notebook() {
  const sendChatFiles = useSendChatFiles();

  function handleOnDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();

    if (sendChatFiles.isPending) return;

    const files = [...e.dataTransfer.files].filter(
      (f) => f.type === "application/pdf" || f.type === "text/csv" || f.type.startsWith("image/"),
    );

    if (files.length === 0) return;

    sendChatFiles.mutate({ files });

    setTimeout(() => {
      const ol = document.getElementById(CHAT_MESSAGE_LIST_HTML_ELEMENT_ID);

      if (ol) {
        ol.scrollTop = ol.scrollHeight;
      }
    }, 100);
  }

  return (
    <div className="@container/chat relative flex h-[calc(100%-38px)] @3xl:h-[calc(100%-46px)] flex-col justify-between overflow-hidden group/chat">
      <ol
        className="@container/notebook notebook-grid max-h-full h-full w-full max-w-full simple-scrollbar scrollbar-stable"
        id={CHAT_MESSAGE_LIST_HTML_ELEMENT_ID}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleOnDrop}
      >
        <ToolBar />

        <div className="notebook-content w-full flex gap-4 flex-col h-full">
          <Slash />

          <DefaultSuspenseAndErrorBoundary
            failedText="Something went wrong at displaying messages!"
            fallbackFor="MessagesWithoutBlocks"
          >
            <MessagesWithoutBlocks />
          </DefaultSuspenseAndErrorBoundary>

          <AddBlockButtonIfNoBlocks />

          <DefaultSuspenseAndErrorBoundary
            failedText="Something went wrong at displaying notebook blocks!"
            fallbackFor="Blocks"
          >
            <Blocks />
          </DefaultSuspenseAndErrorBoundary>
        </div>

        <li className="flex-none notebook-content size-10"></li>
      </ol>
    </div>
  );
}

function MessagesWithoutBlocks() {
  const msgs = useNormalizedMessages(false).map(renderBotConversationMessage);

  return (
    <details
      className="rounded-lg shadow-lg shadow-black/30 bg-aside my-10 group/chat-messages"
      data-chat
    >
      <summary className="list-none [&::-webkit-details-marker]:hidden text-sm text-muted flex items-center gap-2 px-4 py-2 button-hover rounded-lg select-none">
        <ChevronRight className="size-4 group-open/chat-messages:rotate-90" />

        <span>Chat Messages</span>
      </summary>

      <div className="p-4">{msgs}</div>
    </details>
  );
}

function Blocks() {
  const sortedBlocks = useSortedNotebookBlocks();

  return sortedBlocks.map(renderNotebookBlock);
}

function AddBlockButtonIfNoBlocks() {
  const isThereAnyBlock = useIsThereAnyBlock();

  return isThereAnyBlock ? null : (
    <div className="group/block w-full h-30">
      <AddBlockBelowButton blockAboveUuid={null} alwaysVisible />
    </div>
  );
}
