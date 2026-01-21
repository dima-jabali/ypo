"use client";

import { memo, useEffect } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
  type BotConversationMessage,
  BotConversationMessageStatus,
  type BotConversationMessageType,
} from "#/types/chat";
import { ANIMATED_DOTS, DOUBLE_CHECK, SEARCHING_CTX } from "./icons";
import { MessageWrapper } from "./MessageWrapper";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { CustomWindowEvents } from "#/contexts/window-events";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Sources_Message;
};

export const SourcesMessage = memo(function SourcesMessage({ msg }: Props) {
  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        isMessageComplete
          ? CustomWindowEvents.CloseSourcesDrawer
          : CustomWindowEvents.OpenSourcesDrawer,
      ),
    );
  }, [isMessageComplete]);

  return <SourcesForUser sources={msg.sources} shouldShow={false} />;

  if (typeof window === "undefined") {
    return null;
  }

  const showIntermediateMessage = generalContextStore.use.showIntermediateMessages();
  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

  return (
    <MessageWrapper
      className="text-muted-foreground p-0"
      data-sources-message
      data-id={msg.id}
      title="Sources"
    >
      {showIntermediateMessage ? (
        <div className="flex w-full">
          <div className="z-10 @[450px]:ml-[25%] flex bg-notebook px-3.5 gap-1 group-even/chat-messages:bg-aside group-odd/chat-messages:bg-aside">
            <span className="size-3 flex-none"></span>

            <i className="whitespace-pre-wrap text-xs">{msg.toggle_text}</i>

            {isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}
          </div>
        </div>
      ) : isMessageComplete ? null : (
        SEARCHING_CTX
      )}

      <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
    </MessageWrapper>
  );
});
