"use client";

import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import {
  BotConversationMessageStatus,
  type BotConversationMessage,
  type BotConversationMessageType,
} from "#/types/chat";
import { MessageWrapper } from "./MessageWrapper";
import { ANIMATED_DOTS, SEARCHING_YPO } from "./icons";
import { BrainCircuit } from "lucide-react";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Sources_Message;
};

export const EndMessage = memo(function EndMessage({ msg }: Props) {
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
      }, 5_000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isMessageComplete]);

  if (showOnlySources) {
    return <SourcesForUser sources={msg.sources} shouldShow={false} />;
  }

  return (
    <MessageWrapper title="Sources (End group of messages)" data-start-message data-id={msg.id}>
      <span
        className="flex font-semibold z-10 items-center justify-start w-full text-xs text-muted"
        title="To show more, set 'Show intermediate messages' to true on settings"
      >
        <BrainCircuit className="stroke-muted-foreground size-3" />

        <span>&nbsp;Gathering more data</span>

        {ANIMATED_DOTS}
      </span>

      <SourcesForUser sources={msg.sources} shouldShow={false} />
    </MessageWrapper>
  );
});
