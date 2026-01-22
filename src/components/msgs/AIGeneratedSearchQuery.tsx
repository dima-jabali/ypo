"use client";
import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import {
  BotConversationMessageStatus,
  type BotConversationMessage,
  type BotConversationMessageType,
} from "#/types/chat";
import { ANIMATED_DOTS, THINKING_SPAN } from "./icons";
import { MessageWrapper } from "./MessageWrapper";
import { BrainCircuit } from "lucide-react";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.AI_Generated_Search_Query;
};

export const AIGeneratedSearchQuery = memo(function AIGeneratedSearchQuery({ msg }: Props) {
  const [showOnlySources, setShowOnlySources] = useState(false);

  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (isMessageComplete) {
      timerRef.current = setTimeout(() => {
        setShowOnlySources(true);
      }, 2_000);
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
      className="text-muted-foreground"
      title="AI Generated Search Query"
      data-ai-generated-search-query
      data-id={msg.id}
    >
      <span
        className="flex font-semibold z-10 items-center justify-start w-full text-xs text-muted"
        title="To show more, set 'Show intermediate messages' to true on settings"
      >
        <BrainCircuit className="stroke-muted-foreground size-3" />

        <span>&nbsp;Generating search query</span>

        {ANIMATED_DOTS}
      </span>

      <SourcesForUser sources={msg.sources} shouldShow={false} />
    </MessageWrapper>
  );
});
