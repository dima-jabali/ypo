"use client";

import { PlateController } from "platejs/react";
import { memo } from "react";

import { AutoScrollIfOnBottom } from "#/components/auto-scroll-if-on-bottom";
import { EmptyData } from "#/components/empty-states/empty-data";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { LoadMoreButton } from "#/components/load-more-button";
import { renderBotConversationMessage } from "#/components/msgs/render-bot-conversation-message";
import { ScrollToBottomButton } from "#/components/scroll-to-bottom-button";
import { WithChatData } from "#/components/with-chat-data";
import { ChatContextProvider, useChatStore } from "#/contexts/chat-context";
import { SourceCitationContextProvider } from "#/contexts/source-citation-context";
import { SlashProvider } from "#/features/notebook/components/slash-plugin/ctx";
import {
  CHAT_MESSAGE_LIST_HTML_ELEMENT_ID,
  createNotebookUuid,
  OPTIMISTIC_NEW_NOTEBOOK_ID,
} from "#/helpers/utils";
import {
  useHasAnyMessage,
  useNormalizedMessages,
} from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { ClientOnly } from "@/components/client-only";
import dynamic from "next/dynamic";
import { EmptyFallbackSuspense } from "#/components/empty-fallback-suspense";
import { AllSourcesInChatSidebar } from "#/features/all-sources-in-chat-sidebar";
import {
  NewCreateProjectRequestBody,
  useCreateNotebook,
} from "#/hooks/mutation/use-create-notebook";
import { useIsCreatingNotebook } from "#/hooks/mutation/use-is-creating-notebook";
import { BotConversationId, NotebookId } from "#/types/general";
import { NotebookImportance, NotebookStatus } from "#/types/notebook";
import { Loader } from "@/components/Loader";
import { Plus } from "lucide-react";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { Sidebar } from "#/components/layout/Sidebar";
import { RerenderTreeProvider } from "#/contexts/use-rerender-tree";

import "client-only";

const MessageInput = dynamic(
  () => import("#/components/message-input").then((mod) => mod.MessageInput),
  { ssr: false },
);

function handleGoToChat(notebookId: NotebookId, botConversationId: BotConversationId | null) {
  const { notebookId: notebookIdFromStore } = generalContextStore.getState();

  if (notebookId === notebookIdFromStore) {
    return;
  }

  generalContextStore.setState({
    botConversationId,
    notebookId,
  });
}

function AddChat() {
  if (typeof window === "undefined") {
    return null;
  }

  const organizationId = generalContextStore.use.organizationId();
  const isCreatingNotebook = useIsCreatingNotebook();
  const createNotebook = useCreateNotebook();

  async function handleCreateChat(createAnyway?: boolean) {
    if (isCreatingNotebook) return;

    const newNotebookData: NewCreateProjectRequestBody = {
      blocks: [],
      organizationId,
      metadata: {
        bot_conversation: {
          id: OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId,
        },
        status: NotebookStatus.NotStarted,
        priority: NotebookImportance.Low,
        id: OPTIMISTIC_NEW_NOTEBOOK_ID,
        uuid: createNotebookUuid(),
        title: "New chat",
        favorited: false,
        assigned_to: [],
        description: "",
        tags: [],
      },
    };

    createNotebook.mutate(newNotebookData);

    handleGoToChat(newNotebookData.metadata.id!, newNotebookData.metadata.bot_conversation!.id);
  }

  return (
    <button
      className="flex gap-2 p-2 pl-3.5 items-center justify-between button-hover text-sm rounded-lg text-muted-foreground w-full"
      onClick={() => handleCreateChat()}
      title="Create a new chat"
      type="button"
    >
      <div className="flex items-center gap-2">
        {isCreatingNotebook ? (
          <Loader className="size-5 stroke-1 border-t-muted-foreground" />
        ) : (
          <Plus className="size-5 stroke-1" />
        )}
      </div>
    </button>
  );
}

export const ChatOrNotebook = memo(function ChatOrNotebook() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className="h-[calc(100vh-65px)] max-h-[calc(100vh-65px)] relative grid [grid-template-rows:1fr] [grid-template-columns:0.01fr_1fr] [grid-template-areas:'aside_main'] gap-0 w-full overflow-hidden">
      <ClientOnly>
        <RerenderTreeProvider>
          <SourceCitationContextProvider>
            <EmptyFallbackSuspense>
              <WithChatData>

                <Sidebar />
              </WithChatData>
            </EmptyFallbackSuspense>

            <DefaultSuspenseAndErrorBoundary
              failedText="Something went wrong"
              fallbackFor="with-chat-data"
            >
              <WithChatData>
                <ChatContextProvider>
                  <SlashProvider>
                    <main className="max-w-full h-[calc(100vh-65px)] max-h-[calc(100vh-65px)] relative overflow-hidden [grid-area:main] bg-transparent">
                <AllSourcesInChatSidebar />

                      <Chat />
                    </main>
                  </SlashProvider>
                </ChatContextProvider>
              </WithChatData>
            </DefaultSuspenseAndErrorBoundary>
          </SourceCitationContextProvider>
        </RerenderTreeProvider>
      </ClientOnly>
    </div>
  );
});

function Chat() {
  if (typeof window === "undefined") {
    return null;
  }

  const hasAnyMessage = useHasAnyMessage();
  const chatStore = useChatStore();

  return (
    // `group/chat chat` are used to style text blocks:

    <div className="@container/chat relative flex h-[calc(100vh-75px)] flex-col justify-between overflow-hidden group/chat w-full max-w-full">
      {hasAnyMessage ? (
        <ol
          className="chat-sm-grid @3xl:chat-md-grid max-h-full h-fit w-full max-w-full simple-scrollbar scrollbar-stable"
          ref={(ref) => chatStore.setState({ scrollContainer: ref })}
          id={CHAT_MESSAGE_LIST_HTML_ELEMENT_ID}
        >
          <LoadMoreButton />

          <div className="chat-content size-8"></div>

          <Messages />

          <AutoScrollIfOnBottom />
        </ol>
      ) : (
        <EmptyData title="No messages" description="Start a conversation" />
      )}

      <div className="chat-sm-grid @3xl:chat-md-grid w-full relative pr-(--simple-scrollbar-width)">
        {hasAnyMessage ? <ScrollToBottomButton /> : null}

        <ClientOnly>
          <PlateController>
            <ClientOnly>
              <DefaultSuspenseAndErrorBoundary
                failedText="Error in message input"
                fallbackFor="message-input"
              >
                <ClientOnly>
                  <MessageInput />
                </ClientOnly>
              </DefaultSuspenseAndErrorBoundary>
            </ClientOnly>
          </PlateController>
        </ClientOnly>
      </div>
    </div>
  );
}

function Messages() {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedMsgs = useNormalizedMessages(true)!;

  return normalizedMsgs.map(renderBotConversationMessage);
}
