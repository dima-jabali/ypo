"use client";

import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import {
  BotConversationMessageStatus,
  type BotConversationMessage,
  type BotConversationMessageType,
} from "#/types/chat";
import { MessageWrapper } from "./MessageWrapper";
import { SEARCHING_YPO } from "./icons";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Sources_Message;
};

export const StartMessage = memo(function StartMessage({ msg }: Props) {
  const isStreaming = useIsStreaming();

  const [initialIsMessageComplete] = useState(
    isStreaming ? false : msg.message_status === BotConversationMessageStatus.Complete,
  );
  const [showOnlySources, setShowOnlySources] = useState(initialIsMessageComplete);

  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (isMessageComplete) {
      timerRef.current = setTimeout(() => {
        setShowOnlySources(true);
      }, 7_000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isMessageComplete]);

  if (showOnlySources) {
    return <SourcesForUser sources={msg.sources} shouldShow={false} />;
  }

  return (
    <MessageWrapper
      title="Sources (Start group of messages)"
      className="p-0 empty:hidden"
      data-start-message
      data-id={msg.id}
    >
      {SEARCHING_YPO}

      <SourcesForUser sources={msg.sources} shouldShow={false} />
    </MessageWrapper>
  );
});
