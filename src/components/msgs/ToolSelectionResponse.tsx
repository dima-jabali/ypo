"use client";

import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import {
  type BotConversationMessage,
  BotConversationMessageStatus,
  type BotConversationMessageType,
} from "#/types/chat";
import { SELECTING_TOOL } from "./icons";
import { MessageWrapper } from "./MessageWrapper";

type Props = {
  msg: ToolSelectionResponseMessage;
};

export type ToolSelectionResponseMessage = BotConversationMessage & {
  message_type: BotConversationMessageType.Tool_Selection_Response;
};

export const ToolSelectionResponse = memo(function ToolSelectionResponse({ msg }: Props) {
  const [showOnlySources, setShowOnlySources] = useState(false);

  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (isMessageComplete) {
      timerRef.current = setTimeout(() => {
        setShowOnlySources(true);
      }, 3_000);
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
      title="Tool Selection Response"
      data-tool-selection-response
      data-id={msg.id}
    >
      {SELECTING_TOOL}

      <SourcesForUser sources={msg.sources} shouldShow={false} />
    </MessageWrapper>
  );
});
