"use client";

import { PlateController } from "platejs/react";
import { memo } from "react";

import { AutoScrollIfOnBottom } from "#/components/auto-scroll-if-on-bottom";
import { EmptyData } from "#/components/empty-states/empty-data";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { LoadMoreButton } from "#/components/load-more-button";
import { MessageInput } from "#/components/message-input";
import { PlanMessage } from "#/components/msgs/PlanMessage/PlanMessage";
import { renderBotConversationMessage } from "#/components/msgs/render-bot-conversation-message";
import { ScrollToBottomButton } from "#/components/scroll-to-bottom-button";
import { WithChatData } from "#/components/with-chat-data";
import { ChatContextProvider, useChatStore } from "#/contexts/chat-context";
import { SourceCitationContextProvider } from "#/contexts/source-citation-context";
import { SlashProvider } from "#/features/notebook/components/slash-plugin/ctx";
import { CHAT_MESSAGE_LIST_HTML_ELEMENT_ID } from "#/helpers/utils";
import {
  useHasAnyMessage,
  useNormalizedMessages,
} from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { ClientOnly } from "@/components/client-only";

export const ChatOrNotebook = memo(function ChatOrNotebook() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <ClientOnly>
      <SourceCitationContextProvider>
        <DefaultSuspenseAndErrorBoundary
          failedText="Something went wrong"
          fallbackFor="with-chat-data"
        >
          <WithChatData>
            <ChatContextProvider>
              <SlashProvider>
                <Chat />
              </SlashProvider>
            </ChatContextProvider>
          </WithChatData>
        </DefaultSuspenseAndErrorBoundary>
      </SourceCitationContextProvider>
    </ClientOnly>
  );
});

function Chat() {
  const hasAnyMessage = useHasAnyMessage();
  const chatStore = useChatStore();

  return (
    // `group/chat chat` are used to style text blocks:

    <div className="@container/chat relative flex h-[calc(100%-38px)] @3xl:h-[calc(100%-46px)] flex-col justify-between overflow-hidden group/chat">
      {hasAnyMessage ? (
        <ol
          className="chat-sm-grid @3xl:chat-md-grid max-h-full h-fit w-full max-w-full simple-scrollbar scrollbar-stable"
          ref={(ref) => chatStore.setState({ scrollContainer: ref })}
          id={CHAT_MESSAGE_LIST_HTML_ELEMENT_ID}
        >
          <LoadMoreButton />

          <Messages />

          <AutoScrollIfOnBottom />
        </ol>
      ) : (
        <EmptyData title="No messages" description="Start a conversation" />
      )}

      <PlanMessage />

      <div className="chat-sm-grid @3xl:chat-md-grid w-full relative pr-(--simple-scrollbar-width)">
        {hasAnyMessage ? <ScrollToBottomButton /> : null}

        <PlateController>
          <DefaultSuspenseAndErrorBoundary
            failedText="Error in message input"
            fallbackFor="message-input"
          >
            <MessageInput />
          </DefaultSuspenseAndErrorBoundary>
        </PlateController>
      </div>
    </div>
  );
}

function Messages() {
  const normalizedMsgs = useNormalizedMessages(true);

  return normalizedMsgs.map(renderBotConversationMessage);
}
